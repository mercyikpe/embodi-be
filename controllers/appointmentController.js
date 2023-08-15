const moment = require('moment');
const Appointment = require('../models/Appointment');
const DoctorInfo  = require('../models/DoctorInfo');
const User = require('../models/User');
const transporter = require('../utilities/transporter');




///// CREATE APPOINTMEN FOR DOCTOR (WORKING PERFECTLY)


const mongoose = require('mongoose');

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
    });

    const appointmentDate = {
      date,
    };

    // Check if the appointment is already exist
    if (existingAppointments.some(appointment => appointment.date === appointmentDate)) {
      // If the appointment is already exist, push the new appointment to the existing appointment array
      const existingAppointment = existingAppointments.find(appointment => appointment.date === appointmentDate);
      existingAppointment.timeSlots.push({
        startTime: startTimeFormatted,
        endTime: endTimeFormatted,
      });
      await existingAppointment.save();
    } else {
      // If the appointment is not exist, create a new appointment array and push the new appointment to the array
      const timeSlots = [{
        startTime: startTimeFormatted,
        endTime: endTimeFormatted,
      }];
      appointmentDate.timeSlots = timeSlots;
      const appointment = new Appointment(appointmentDate);
      await appointment.save();
    }

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
    const appointment = await Appointment.findById(appointmentId)

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
        <p> Hi, Dr. ${doctorName}, A Patient ${patient.firstName} ${patient.lastName} has booked an appointment with you  on ${appointment.date} from ${appointment.timeSlot.startTime} to ${appointment.timeSlot.endTime}.</p>
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
        <h1> Appointment Succesfully Booked</h1>
        <p> Hi, ${patient.lastName} You have successfully booked an appointment with Dr. ${doctorName} on ${appointment.date} from ${appointment.timeSlot.startTime} to ${appointment.timeSlot.endTime}.</p>
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
      Created: appointment.createdAt,
      Updated: appointment.updatedAt
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



///////// FET COMPLETED APPOINTENT FOR EACH DOCTOR (ASIN ONE DOCTOR SEEING ALL HIS COMLETED APPOINTMENT)
const getCompletedAppointmentsForDoctor = async (req, res) => {
  const doctorId = req.params.doctorId;

  try {
    // Fetch all completed appointments for the specific doctor
    const completedAppointments = await Appointment.find({ doctor: doctorId, status: 'completed' })
      .populate({
        path: 'doctor',
        model: 'DoctorInfo',
        populate: {
          path: 'user',
          model: 'User',
        },
      })
      .populate('patient')
      .sort({ date: 1 });

    // Map appointments and format the data
    const formattedAppointments = completedAppointments.map(appointment => {
      if (!appointment.doctor || !appointment.patient) {
        return null;
      }

      const doctor = appointment.doctor;
      const patient = appointment.patient;

      return {
        doctor: {
          DoctorId: doctor._id,
          name: `${doctor.user.firstName} ${doctor.user.lastName}`,
          email: doctor.user.email,
          Phone: doctor.user.phoneNumber,
          specialty: doctor.specialty,
          rate: doctor.rate,
          // Other doctor's information from DoctorInfo model
          // ...
        },
        patient: {
          patientId: patient._id,
          name: `${patient.firstName} ${patient.lastName}`,
          email: patient.email,
          address: patient.address,
          phoneNumber: patient.phoneNumber,
          allergies: patient.allergies,
          // ...
        },
        AppointmentId: appointment._id,
        date: appointment.date,
        startTime: appointment.timeSlot.startTime,
        endTime: appointment.timeSlot.endTime,
        status: appointment.status,
        Created: appointment.createdAt,
        Updated: appointment.updatedAt
        // ...
      };
    });

    // Remove any null entries
    const validAppointments = formattedAppointments.filter(appointment => appointment !== null);

    // Return the formatted data
    return res.status(200).json({
      status: 'success',
      message: 'Fetched completed appointments for the specific doctor successfully.',
      data: validAppointments,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while fetching completed appointments for the specific doctor.',
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

      appointmentId: appointment._id,
      date: appointment.date,
      startTime: appointment.timeSlot.startTime,
      endTime: appointment.timeSlot.endTime,
      Status: appointment.status,
      Created: appointment.createdAt,
      Updated: appointment.updatedAt
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


//////DELTE APPOITMENT
const deleteAppointment = async (req, res) => {
  const appointmentId = req.params.appointmentId;
  const userId = req.user._id; // Assuming the authenticated user ID is available

  try {
    // Find the appointment to delete
    const appointment = await Appointment.findById(appointmentId);

    // Check if the appointment exists
    if (!appointment) {
      return res.status(404).json({
        status: 'failed',
        message: 'Appointment not found. Please enter a valid appointmentId.',
      });
    }

    // Populate the doctorInfo field from the User model
    await req.user.populate('doctorInfo').execPopulate();

    // Check if the authenticated user is a doctor and is the creator of the appointment
    if (req.user.role.includes('isDoctor') && appointment.doctor.toString() !== req.user.doctorInfo._id.toString()) {
      return res.status(403).json({
        status: 'failed',
        message: 'You are not authorized to delete this appointment.',
      });
    }

    // Delete the appointment
    await Appointment.findByIdAndDelete(appointmentId);

    return res.status(200).json({
      status: 'success',
      message: 'Appointment deleted successfully.',
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while deleting the appointment.',
    });
  }
};



////FETCG EVERYTHING APPOINTMENT
const viewAllAppointments = async (req, res) => {
  try {
    // Fetch all appointments
    const appointments = await Appointment.find()
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
    const formattedAppointments = appointments.map(appointment => {
      if (!appointment.doctor || !appointment.patient) {
        return null;
      }

      const doctor = appointment.doctor;
      const patient = appointment.patient;

      return {
        doctor: {
          DoctorId: doctor._id,
          name: `${doctor.user.firstName} ${doctor.user.lastName}`,
          email: doctor.user.email,
          Phone: doctor.user.phoneNumber,
          specialty: doctor.specialty,
          rate: doctor.rate,
          // Other doctor's information from DoctorInfo model
          // ...
        },
        patient: {
          patientId: patient._id,
          name: `${patient.firstName} ${patient.lastName}`,
          email: patient.email,
          address: patient.address,
          phoneNumber: patient.phoneNumber,
          allergies: patient.allergies,
          // ...
        },
        AppointmentId: appointment._id,
        date: appointment.date,
        startTime: appointment.timeSlot.startTime,
        endTime: appointment.timeSlot.endTime,
        status: appointment.status,
        // ...
      };
    });

    // Remove any null entries
    const validAppointments = formattedAppointments.filter(appointment => appointment !== null);

    // Return the formatted data
    return res.status(200).json({
      status: 'success',
      message: 'Fetched all appointments successfully.',
      data: validAppointments,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while fetching appointments.',
    });
  }
};

//////// SORT ALL APPOINTMENT FOR INDIVIDUAL DOCTOR BY DATE
const sortByDates = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;

    // Fetch all appointments for the specific doctor
    const appointments = await Appointment.find({ doctor: doctorId })
      .populate({
        path: 'doctor',
        model: 'DoctorInfo',
        populate: {
          path: 'user',
          model: 'User',
        },
      })
      .populate('patient')
      .sort({ date: 1 });

    const formattedAppointments = appointments.map(appointment => {
      if (!appointment.doctor || !appointment.patient) {
        return null;
      }

      const doctor = appointment.doctor;
      const patient = appointment.patient;

      return {
        doctor: {
          DoctorId: doctor._id,
          name: `${doctor.user.firstName} ${doctor.user.lastName}`,
          email: doctor.user.email,
          Phone: doctor.user.phoneNumber,
          specialty: doctor.specialty,
          rate: doctor.rate,
          // Other doctor's information from DoctorInfo model
          // ...
        },
        patient: {
          patientId: patient._id,
          name: `${patient.firstName} ${patient.lastName}`,
          email: patient.email,
          address: patient.address,
          phoneNumber: patient.phoneNumber,
          allergies: patient.allergies,
          // ...
        },
        AppointmentId: appointment._id,
        date: appointment.date,
        startTime: appointment.timeSlot.startTime,
        endTime: appointment.timeSlot.endTime,
        status: appointment.status,
        Created: appointment.createdAt,
        Updated: appointment.updatedAt
        // ...
      };
    });

    // Remove any null entries
    const validAppointments = formattedAppointments.filter(appointment => appointment !== null);

    // Return the formatted data
    return res.status(200).json({
      status: 'success',
      message: 'Fetched appointments for the specific doctor successfully.',
      data: validAppointments,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while fetching appointments for the specific doctor.',
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
  getAllCompletedAppointments,
  deleteAppointment,
  viewAllAppointments,
  sortByDates,
  getCompletedAppointmentsForDoctor
  //deleteAppointment,
  //viewAppointments,
};
