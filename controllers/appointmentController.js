const moment = require('moment');
const Appointment = require('../models/Appointment');
const DoctorInfo  = require('../models/DoctorInfo');
const User = require('../models/User');
const transporter = require('../utilities/transporter');




///// CREATE APPOINTMEN FOR DOCTOR
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









  const bookAppointment = async (req, res) => {
    const { appointmentId, patientId } = req.body;
  
    try {
      // Find the appointment to book
      const appointment = await Appointment.findById(appointmentId);
  
      // Check if the appointment exists
      if (!appointment) {
        return res.status(404).json({
          status: 'failed',
          message: 'Appointment not found. Please enter a valid appointmentId.',
        });
      }
  
      // Check if the appointment is already booked
      if (appointment.patient) {
        return res.status(400).json({
          status: 'failed',
          message: 'This appointment is already booked.',
        });
      }
  
      // Update the appointment with the patientId
      appointment.patient = patientId;
      const bookedAppointment = await appointment.save();
  
      // Find the doctor associated with the appointment
      const doctor = await User.findById(appointment.doctor);
  
      // Send email to doctor to notify about the appointment booking
      const doctorMailOptions = {
        from: process.env.AUTH_EMAIL,
        to: doctor.email,
        subject: 'Appointment Booked',
        html: `
          <h1>Appointment Booked</h1>
          <p>Patient ${patientId} has booked an appointment with you on ${appointment.date} from ${appointment.timeSlot.startTime} to ${appointment.timeSlot.endTime}.</p>
        `,
      };
  
      transporter.sendMail(doctorMailOptions, (error, info) => {
        if (error) {
          console.log(error);
        } else {
          console.log('Doctor email sent: ' + info.response);
        }
      });
  
      // Send email to patient to confirm appointment booking
      const patientMailOptions = {
        from: process.env.AUTH_EMAIL,
        to: patientId, // Assuming patientId contains the patient's email address
        subject: 'Appointment Booked',
        html: `
          <h1>Appointment Booked</h1>
          <p>You have successfully booked an appointment with Dr. ${doctor.firstName} ${doctor.lastName} on ${appointment.date} from ${appointment.timeSlot.startTime} to ${appointment.timeSlot.endTime}.</p>
        `,
      };
  
      transporter.sendMail(patientMailOptions, (error, info) => {
        if (error) {
          console.log(error);
        } else {
          console.log('Patient email sent: ' + info.response);
        }
      });
  
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
  




module.exports = {
  createAppointment,
  bookAppointment,
  //updateAppointment,
  //deleteAppointment,
  //viewAppointments,
};
