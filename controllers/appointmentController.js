const moment = require('moment');
const Appointment = require('../models/Appointment');
const DoctorInfo  = require('../models/DoctorInfo');
const User = require('../models/User');
const transporter = require('../utilities/transporter');




///// CREATE APPOINTMEN FOR DOCTOR (WORKING PERFECTLY)
const createAppointment = async (req, res) => {
  const { doctorId, startTime, endTime, date } = req.body;

  try {
    // Check if the user is authenticated
    if (!req.user) {
      return res.status(401).json({
        status: 'failed',
        message: 'Unauthorized.',
      });
    }

    // Validate the input data
    if (!doctorId || !startTime || !endTime || !date || startTime >= endTime) {
      return res.status(400).json({
        status: 'failed',
        message: 'Invalid input data. Please provide valid doctorId, startTime, endTime, and date.',
      });
    }

    // Check if the doctor exists
    const doctorInfo = await DoctorInfo.findById(doctorId).populate('user'); // Populate the user field
    if (!doctorInfo) {
      return res.status(404).json({
        status: 'failed',
        message: 'Doctor not found. Please enter a valid doctorId.',
      });
    }

    // Get the doctor's email address from the User model
    const doctorEmail = doctorInfo.user.email;

    // Convert provided startTime and endTime to ISO format
    const startTimeFormatted = moment(startTime, 'hh:mm A').toISOString();
    const endTimeFormatted = moment(endTime, 'hh:mm A').toISOString();

    // Check if the appointment time slot is available
    const existingAppointments = await Appointment.find({
      doctor: doctorId,
      date,
      $or: [
        {
          'timeSlot.startTime': { $lte: startTimeFormatted },
          'timeSlot.endTime': { $gte: startTimeFormatted },
        },
        {
          'timeSlot.startTime': { $lte: endTimeFormatted },
          'timeSlot.endTime': { $gte: endTimeFormatted },
        },
        {
          'timeSlot.startTime': { $gte: startTimeFormatted, $lte: endTimeFormatted },
          'timeSlot.endTime': { $gte: startTimeFormatted, $lte: endTimeFormatted },
        },
      ],
    });

    if (existingAppointments.length > 0) {
      return res.status(400).json({
        status: 'failed',
        message: 'The requested time slot is not available for this doctor.',
      });
    }

    // Create the new appointment
    const appointment = new Appointment({
      date,
      patient: req.user.id,
      doctor: doctorId,
      timeSlot: {
        startTime: startTimeFormatted,
        endTime: endTimeFormatted,
      },
      status: 'scheduled',
    });

    const savedAppointment = await appointment.save();
    const appointmentId = savedAppointment._id;

    // Update the doctor's available time slots
    const updatedAvailableTimeSlots = doctorInfo.availableTimeSlots.concat({
      startTime: startTimeFormatted,
      endTime: endTimeFormatted,
    });

    // Update the doctor's availableTimeSlots field
    doctorInfo.availableTimeSlots = updatedAvailableTimeSlots;
    await doctorInfo.save();

    // Send email to doctor to confirm appointment creation
    const doctorMailOptions = {
      from: process.env.AUTH_EMAIL,
      to: doctorEmail,
      subject: 'Appointment Created',
      html: `
        <h1>Appointment Created</h1>
        <p>An appointment has been created for you on ${date} from ${startTime} to ${endTime}.</p>
      `,
    };

    transporter.sendMail(doctorMailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log('Doctor email sent: ' + info.response);
      }
    });

    return res.status(200).json({
      status: 'success',
      message: 'Appointment created successfully.',
      data: savedAppointment,
      appointmentId: appointmentId,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while creating the appointment.',
    });
  }
}


///////// USER TO BOOK APPOINTMENT
const bookAppointment = async (req, res) => {
  const { appointmentId, patientId } = req.body;

  try {
    // Find the appointment to book
    const appointment = await Appointment.findById(appointmentId);

    // Check if the appointment exists and is available
    if (!appointment || appointment.patient) {
      return res.status(400).json({
        status: 'failed',
        message: 'Invalid appointment or appointment is already booked.',
      });
    }

    // Update the appointment with the patientId and change status to 'booked'
    appointment.patient = patientId;
    appointment.status = 'Booked'; // Change the status to 'booked'
    const bookedAppointment = await appointment.save();

    // Find the doctor associated with the appointment
    const doctor = await DoctorInfo.findById(appointment.doctor).populate('user');

    // Check if the doctor exists
    if (!doctor) {
      return res.status(404).json({
        status: 'failed',
        message: 'Doctor not found for this appointment.',
      });
    }

    // Get the doctor's email address and name from the User model
    const doctorEmail = doctor.user.email;
    const doctorName = `${doctor.user.firstName} ${doctor.user.lastName}`;

    // Get the patient's details
    const patient = await User.findById(patientId);

    // Send email notifications to doctor and patient
    const doctorMailOptions = {
      from: process.env.AUTH_EMAIL,
      to: doctorEmail,
      subject: 'Appointment Booked',
      html: `
        <h1>Appointment Booked</h1>
        <p>Patient ${patient.firstName} ${patient.lastName} has booked an appointment with you, Dr. ${doctorName}, on ${appointment.date} from ${appointment.timeSlot.startTime} to ${appointment.timeSlot.endTime}.</p>
      `,
    };

    transporter.sendMail(doctorMailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log('Doctor email sent: ' + info.response);
      }
    });

    const patientMailOptions = {
      from: process.env.AUTH_EMAIL,
      to: patient.email,
      subject: 'Appointment Booked',
      html: `
        <h1>Appointment Booked</h1>
        <p>You have successfully booked an appointment with Dr. ${doctorName} on ${appointment.date} from ${appointment.timeSlot.startTime} to ${appointment.timeSlot.endTime}.</p>
      `,
    };

    transporter.sendMail(patientMailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log('Patient email sent: ' + info.response);
      }
    });

    // Update the user's bookedAppointments array
    await User.findByIdAndUpdate(patientId, { $push: { bookedAppointments: bookedAppointment._id } });

    return res.status(200).json({
      status: 'success',
      message: 'Appointment booked successfully.',
      data: bookedAppointment,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while booking the appointment.',
    });
  }
};

//// view doctor and list of appointment. doctor's profile from user profile, and from doctor's information and times slots
// Controller function to fetch booked appointments for each doctor
const getBookedAppointmentsForDoctors = async (req, res) => {
  try {
    // Fetch all booked appointments
    const bookedAppointments = await Appointment.find({ status: 'Booked' })
      .populate({
        path: 'doctor',
        model: 'DoctorInfo',
        populate: {
          path: 'user',
          model: 'User',
        },
      })
      .populate('patient') // Populate patient information
      .sort({ date: 1 }); // Sort appointments by date in ascending order

    // Map appointments and format the data
    const formattedAppointments = bookedAppointments.map(appointment => ({
      doctor: {
        DoctorId: appointment.doctor._id,
        name: `${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`,
        email: appointment.doctor.user.email,
        Phone: appointment.doctor.user.phoneNumber,
        specialty: appointment.doctor.specialty, // Include doctor's specialty
        rate: appointment.doctor.rate, // Include doctor's rate
        // Other doctor's information from DoctorInfo model
        // ...
       
      },

      /////// fetch patient informtion
      patient: {
        patientId: appointment.patient._id,
        name: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
        email: appointment.patient.email,
        address: appointment.patient.address,
        phoneNumber: appointment.patient.phoneNumber,
        allergies: appointment.patient.allergies,
       
      },
      // Other appointment information
      AppointmentId: appointment._id,
      date: appointment.date,
      startTime: appointment.timeSlot.startTime,
      endTime: appointment.timeSlot.endTime,
      status: appointment.status,
      // ...
    }));

    // Return the formatted data
    return res.status(200).json({
      status: 'success',
      message: 'Fetched booked appointments successfully.',
      data: formattedAppointments,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while fetching booked appointments.',
    });
  }
};

////// fetch all the appointment for each Doctor
const getBookedAppointmentsForDoctor = async (req, res) => {
  const doctorId = req.params.doctorId; // Extract doctorId from the request parameters

  try {
    // Fetch all booked appointments for the specified doctor
    const bookedAppointments = await Appointment.find({ doctor: doctorId, status: 'Booked' })
      .populate({
        path: 'doctor',
        model: 'DoctorInfo',
        populate: {
          path: 'user',
          model: 'User',
        },
      })
      .populate('patient') // Populate patient information
      .sort({ date: 1 }); // Sort appointments by date in ascending order

    // Map appointments and format the data
    const formattedAppointments = bookedAppointments.map(appointment => ({
      doctor: {
        name: `${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`,
        email: appointment.doctor.user.email,
        specialty: appointment.doctor.specialty, // Include doctor's specialty
        rate: appointment.doctor.rate, // Include doctor's rate
        // Other doctor's information from DoctorInfo model
        // ...
      },
      patient: {
        name: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
        email: appointment.patient.email,
        address: appointment.patient.address,
        phoneNumber: appointment.patient.phoneNumber,
        allergies: appointment.patient.allergies,
      },
      // Other appointment information
      date: appointment.date,
      startTime: appointment.timeSlot.startTime,
      endTime: appointment.timeSlot.endTime,
      // ...
    }));

    // Return the formatted data
    return res.status(200).json({
      status: 'success',
      message: 'Fetched booked appointments for the doctor successfully.',
      data: formattedAppointments,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while fetching booked appointments for the doctor.',
    });
  }
};


////// update appoinment status
const updateAppointmentStatus = async (req, res) => {
  const { doctorId, status, startTime, endTime, date } = req.body;

  try {
    const appointmentId = req.params.appointmentId;

    // Check if the doctor has created the appointment
    const appointment = await Appointment.findOne({ _id: appointmentId, doctor: doctorId });

    if (!appointment) {
      return res.status(404).json({
        status: 'failed',
        message: 'Appointment not found for this doctor.',
      });
    }

    // Update the appointment status if provided
    if (status) {
      appointment.status = status;
    }

    // Update the appointment time slot if provided
    if (startTime || endTime) {
      if (startTime) {
        appointment.timeSlot.startTime = startTime;
      }
      if (endTime) {
        appointment.timeSlot.endTime = endTime;
      }
    }

    // Update the appointment date if provided
    if (date) {
      appointment.date = date;
    }

    const updatedAppointment = await appointment.save();

    return res.status(200).json({
      status: 'success',
      message: 'Appointment updated successfully.',
      data: updatedAppointment,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while updating the appointment.',
    });
  }
};

//// fetch completed appointment for single single
const getCompletedAppointments = async (req, res) => {
  const doctorId = req.params.doctorId;

  try {
    // Find the doctor's completed appointments
    const completedAppointments = await Appointment.find({
      doctor: doctorId,
      status: 'completed',
    })
      .populate('patient', 'firstName lastName email address phoneNumber allergies')
      .populate({
        path: 'doctor',
        model: 'DoctorInfo',
        populate: {
          path: 'user',
          model: 'User',
          select: 'name email phoneNumber specialty rate',
        },
      })
      .sort({ date: 'asc' });

    return res.status(200).json({
      status: 'success',
      message: 'Completed appointments fetched successfully.',
      data: completedAppointments,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while fetching completed appointments.',
    });
  }
};


//////GET COMPLETED PPOINMENT FOR ALL THE DOCTORS
const getAllCompletedAppointments = async (req, res) => {
  try {
    // Find all completed appointments with doctor and patient details
    const completedAppointments = await Appointment.find({
      status: 'completed',
    })
      .populate('patient', 'firstName lastName email address phoneNumber allergies')
      .populate({
        path: 'doctor',
        model: 'DoctorInfo',
        populate: {
          path: 'user',
          model: 'User',
          select: 'name email phoneNumber specialty rate',
        },
      })
      .sort({ doctor: 'asc', date: 'asc' });

    return res.status(200).json({
      status: 'success',
      message: 'Completed appointments fetched successfully.',
      data: completedAppointments,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while fetching completed appointments.',
    });
  }
};

















  




module.exports = {
  createAppointment,
  bookAppointment,
  getBookedAppointmentsForDoctors,
  getBookedAppointmentsForDoctor,
  updateAppointmentStatus,
  getCompletedAppointments,
  getAllCompletedAppointments
  //updateAppointment,
  //deleteAppointment,
  //viewAppointments,
};
