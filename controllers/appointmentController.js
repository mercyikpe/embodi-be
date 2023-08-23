const moment = require('moment');
const Appointment = require('../models/Appointment');
const DoctorInfo  = require('../models/DoctorInfo');
const User = require('../models/User');
const Patient = require('../models/User');
const transporter = require('../utilities/transporter');
//const moment = require('moment');
const mongoose = require('mongoose');


////// i just suspended this this night 08 21 - 146am
const createAppointment = async (doctorId, date, appointments) => {
  try {
    const doctorInfo = await DoctorInfo.findById(doctorId).populate('user');

    if (!doctorInfo) {
      return { error: 'Doctor not found' };
    }

    const startTimeFormatted = moment(`${date} ${appointments[0].startTime}`, 'YYYY-MM-DD HH:mm').toISOString();
    const endTimeFormatted = moment(`${date} ${appointments[0].endTime}`, 'YYYY-MM-DD HH:mm').toISOString();

    // Check if the new appointment conflicts with existing appointments
    const existingAppointments = await Appointment.find({
      doctor: doctorId,
      date,
      'appointments.startTime': { $lt: endTimeFormatted },
      'appointments.endTime': { $gt: startTimeFormatted },
    });

    if (existingAppointments.length > 0) {
      const errors = [];
      for (const appointment of existingAppointments) {
        const appointmentStartTime = moment(appointment.appointments[0].startTime, 'HH:mm').toISOString();
        const appointmentEndTime = moment(appointment.appointments[0].endTime, 'HH:mm').toISOString();

        const startTimeOverlaps = moment(startTimeFormatted).isBefore(appointmentEndTime) && moment(startTimeFormatted).isSameOrAfter(appointmentStartTime);
        const endTimeOverlaps = moment(endTimeFormatted).isAfter(appointmentStartTime) && moment(endTimeFormatted).isSameOrBefore(appointmentEndTime);

        if (startTimeOverlaps || endTimeOverlaps) {
          errors.push({
            type: 'overlapping',
            message: 'The requested time slot overlaps with another appointment.',
          });
        }
      }

      if (errors.length > 0) {
        return {
          error: 'The requested time slot is not available.',
          details: errors,
        };
      }
    }

    const appointment = await Appointment.findOneAndUpdate(
      {
        doctor: doctorId,
        date,
        $nor: [
          {
            'appointments.startTime': { $eq: startTimeFormatted },
          },
          {
            'appointments.endTime': { $eq: endTimeFormatted },
          },
        ],
      },
      {
        $push: { appointments: appointments[0] },
      },
      { new: true }
    );

    if (!appointment) {
      const newAppointmentData = {
        date,
        doctor: doctorInfo.user,
        appointments,
      };

      const newAppointment = new Appointment(newAppointmentData);
      await newAppointment.save();

      const appointmentId = newAppointment._id;

      // Update the doctor's availableTimeSlots field
      doctorInfo.availableTimeSlots.push({
        date,
        startTime: moment(startTimeFormatted).format('HH:mm'),
        endTime: moment(endTimeFormatted).format('HH:mm'),
        status: 'Scheduled',
        //patientId
      });
      await doctorInfo.save();

      //// APPOINTMENT ID
    

      // Get the doctor's email address from the User model
      const doctorEmail = doctorInfo.user.email;
      const doctorId = doctorInfo._id;
      const doctorName = `${doctorInfo.user.firstName} ${doctorInfo.user.lastName}`;
      const doctorPhone = doctorInfo.user.phoneNumber;
      const doctorGender = doctorInfo.user.gender;
      const doctorSpecialty = doctorInfo.specialty;
      const doctorRate = doctorInfo.rate;

      // Send email to doctor to confirm appointment creation
      const doctorMailOptions = {
        from: process.env.AUTH_EMAIL,
        to: doctorEmail,
        subject: `Appointment Created For ${doctorName}`,
        html: `
          <h1>Appointment Created </h1>
          <p> Hi ${doctorName}, An appointment has been created for you on ${date} from ${moment(startTimeFormatted).format('HH:mm')} to ${moment(endTimeFormatted).format('HH:mm')}.</p>
        `,
      };

      transporter.sendMail(doctorMailOptions, (error, info) => {
        if (error) {
          console.log(error);
        } else {
          console.log('Doctor email sent to: ' +  doctorName, '|', doctorEmail);
        }
      });

      const doctorDetails = {
        appointmentId,
        doctorId,
        doctorName,
        doctorEmail,
        doctorPhone,
        doctorGender,
        doctorSpecialty,
        doctorRate,
      };

      return { success: true, appointmentId, appointment: newAppointment, doctorDetails, appointmentId};
      console.log( newAppointment, doctorDetails, appointmentId)
    }

    return { success: true, appointment };
  } catch (error) {
    console.error('Error:', error);
    return { error: 'An error occurred while processing the appointment request.' };
  }
};


/*
 /// recent commentented to test something
const createAppointment = async (doctorId, date, appointments) => {
  try {
    const doctorInfo = await DoctorInfo.findOne({ user: doctorId });

    if (!doctorInfo) {
      return { error: 'Doctor not found' };
    }

    const startTimeFormatted = moment(`${date} ${appointments[0].startTime}`, 'YYYY-MM-DD HH:mm').toISOString();
    const endTimeFormatted = moment(`${date} ${appointments[0].endTime}`, 'YYYY-MM-DD HH:mm').toISOString();

    // Check if the date already exists in the Appointment collection
    const existingAppointments = await Appointment.find({
      doctor: doctorId,
      date,
    });

    if (existingAppointments.length === 0) {
      // The date does not exist, create a new document
      const newAppointmentData = {
        date,
        doctor: doctorInfo.user,
        appointments,
      };

      const newAppointment = new Appointment(newAppointmentData);
      await newAppointment.save();

      // Add the new appointment to the doctor's available time slots
      const updatedAvailableTimeSlots = doctorInfo.availableTimeSlots.concat({
        date,
        startTime: moment(startTimeFormatted).format('HH:mm'),
        endTime: moment(endTimeFormatted).format('HH:mm'),
      });

      // Update the doctor's availableTimeSlots field
      doctorInfo.availableTimeSlots = updatedAvailableTimeSlots;
      await doctorInfo.save();

      // Get the doctor's email address from the User model
      const doctorEmail = doctorInfo.user.email;

      // Send email to doctor to confirm appointment creation
      const doctorMailOptions = {
        from: process.env.AUTH_EMAIL,
        to: doctorEmail,
        subject: 'Appointment Created',
        html: `
          <h1>Appointment Created</h1>
          <p>An appointment has been created for you on ${date} from ${moment(startTimeFormatted).format('HH:mm')} to ${moment(endTimeFormatted).format('HH:mm')}.</p>
        `,
      };

      transporter.sendMail(doctorMailOptions, (error, info) => {
        if (error) {
          console.log(error);
        } else {
          console.log('Doctor email sent: ' + info.response);
        }
      });

      return { success: true, appointment: newAppointment };
    } else {
      // The date exists, find the existing document
      const existingAppointment = existingAppointments[0];

      // Push the new appointment to the existing document
      existingAppointment.appointments.push(appointments[0]);

      // Save the updated document
      await existingAppointment.save();

      return { success: true, appointment: existingAppointment };
    }
  } catch (error) {
    console.error('Error:', error);
    return { error: 'An error occurred while processing the appointment request.' };
  }
};

*/



///////// USER TO BOOK APPOINTMENT

const bookAppointment = async (req, res) => {
  const { appointmentId, appointments } = req.body;
  const patientId = appointments[0].patientId;

  // Generate a new bookingId using the generateBookingId function
  function generateBookingId() {
    const min = 1000000000; // Minimum 10-digit number
    const max = 9999999999; // Maximum 10-digit number
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  const newBookingId = generateBookingId();

  try {
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        message: `Appointment with ID ${appointmentId} not found.`,
      });
    }

    const foundAppointment = appointment.appointments.find(
      appointment => appointment.startTime === appointments[0].startTime
    );

    // Check if foundAppointment is defined
    if (foundAppointment) {
      // Check if appointment is already booked
      if (!foundAppointment.bookingId) {
        // Generate a new bookingId
        foundAppointment.newBookingId = newBookingId;
        foundAppointment.bookingId = newBookingId;
        foundAppointment.status = 'Booked';
        foundAppointment.patient = patientId;

        // Populate the model
        const doctorInfo = await DoctorInfo.findById(foundAppointment.doctor).populate('user');
        const patient = await User.findById(patientId).select('firstName lastName allergies email phoneNumber disease');

        await appointment.save();

        // Find the specific appointment index
        const appointmentIndex = appointment.appointments.findIndex(appointment => appointment.startTime === foundAppointment.startTime);

        // Return the updated appointment model
        return res.status(200).json({
          message: `Appointment booked successfully.`,
          appointment: {
            _id: appointment._id,
            date: appointment.date,
            doctorId: appointment.doctor,
            appointments: appointment.appointments,
          },
          appointmentIndex,
          doctor: doctorInfo,
          patient,
        });
      } else {
        // Appointment is already booked
        return res.status(400).json({
          message: `This appointment is already booked.`,
        });
      }
    } else {
      // Appointment does not exist
      return res.status(404).json({
        message: `Appointment with startTime ${appointments[0].startTime} does not exist.`,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: `An error occurred while booking the appointment.`,
    });
  }
};































const updateAppointment = async (doctorId, appointmentId, updateData) => {
  try {
    const { date, startTime, endTime, status } = updateData;

    // Find the doctor's info
    const doctorInfo = await DoctorInfo.findById(doctorId);
    if (!doctorInfo) {
      return { error: 'Doctor not found' };
    }

    // Find the appointment
    const appointment = await Appointment.findOne({
      doctor: doctorId,
      'appointments._id': appointmentId,
    });

    if (!appointment) {
      return { error: 'Appointment not found' };
    }

    // Update appointment details
    const appointmentIndex = appointment.appointments.findIndex(
      (appt) => appt._id.toString() === appointmentId
    );

    if (appointmentIndex === -1) {
      return { error: 'Appointment not found' };
    }

    // Check if the status is updated to 'Completed' or 'Canceled'
    if (status === 'Completed') {
      // Notify the patient with an appreciation email
      const patientId = appointment.appointments[appointmentIndex].patient;
      const patient = await User.findById(patientId);
      if (patient.sendAppointmentCompletedEmail) {
        await sendPatientAppointmentCompletedEmail(patient, doctorInfo, date, startTime);
      }
    } else if (status === 'Canceled') {
      // Notify the patient to rebook
      const patientId = appointment.appointments[appointmentIndex].patient;
      const patient = await User.findById(patientId);
      if (patient.sendAppointmentCanceledEmail) {
        await sendPatientAppointmentCanceledEmail(patient, doctorInfo, date, startTime);
      }
    }

    // Update appointment details
    if (date) {
      appointment.appointments[appointmentIndex].date = date;
    }
    if (startTime) {
      appointment.appointments[appointmentIndex].startTime = startTime;
    }
    if (endTime) {
      appointment.appointments[appointmentIndex].endTime = endTime;
    }
    if (status) {
      appointment.appointments[appointmentIndex].status = status;
    }

    await appointment.save();

    return {
      success: true,
      message: 'Appointment updated successfully',
      appointment: appointment.appointments[appointmentIndex],
    };
  } catch (error) {
    console.error('Error:', error);
    return { error: 'An error occurred while updating the appointment.' };
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
  updateAppointment,
  getBookedAppointmentsForDoctors,
  getBookedAppointmentsForDoctor,
  updateAppointmentStatus,
  getCompletedAppointments,
  getAllCompletedAppointments,
  deleteAppointment,
  viewAllAppointments,
  sortByDates,
  getCompletedAppointmentsForDoctor,
 
  //deleteAppointment,
  //viewAppointments,
};
