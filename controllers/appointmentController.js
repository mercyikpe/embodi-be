const moment = require('moment');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/DoctorInfo');
const User = require('../models/User');
const transporter = require('../utilities/transporter');




const createAppointment = async (req, res) => {
  const { doctorId, startTime, endTime, date } = req.body;

  try {
    // Validate the input data
    if (!doctorId || !startTime || !endTime || !date || startTime >= endTime) {
      return res.status(400).json({
        status: 'failed',
        message: 'Invalid input data. Please provide valid doctorId, startTime, endTime, and date.',
      });
    }

    // Check if the doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        status: 'failed',
        message: 'Doctor not found. Please enter a valid doctorId.',
      });
    }

    // Check if the appointment time slot is available
    const availableTimeSlots = doctor.availableTimeSlots;
    const startTime24Hours = moment(startTime).format('HH:mm');
    const endTime24Hours = moment(endTime).format('HH:mm');
    if (!availableTimeSlots.some(
      (slot) => slot.startTime === startTime24Hours && slot.endTime === endTime24Hours
    )) {
      return res.status(400).json({
        status: 'failed',
        message: 'The requested time slot is not available for this doctor.',
      });
    }

    // Create the new appointment without specifying the patient
    const newAppointment = new Appointment({
      doctor: doctorId,
      startTime,
      endTime,
      date, // The raw date provided in the request
      formattedDate: moment(date).format('dddd, DD MMMM, YYYY'), // Formatted date using moment.js
    });

    const savedAppointment = await newAppointment.save();
    // Access the appointment ID after saving
    const appointmentId = savedAppointment._id;

    // Send email to doctor to confirm appointment creation
    const doctorMailOptions = {
      from: process.env.AUTH_EMAIL,
      to: doctor.email,
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
      appointmentId: appointmentId, // Return the appointment ID in the response
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while creating the appointment.',
    });
  }
};



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
