// models/Appointment.js
const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      //required: true,
    },
    
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoctorInfo',
     // required: true,
    },
    appointments: [{
      startTime: {
        type: String,
        required: true,
      },
      endTime: {
        type: String,
        //required: true,
      },
      status: {
        type: String,
        enum: ['Scheduled', 'Booked', 'Completed', 'Cancelled'],
        default: 'Scheduled',
      },
      createdAt: {
        type: Date,
        default: Date.now(),
      },
      updatedAt: {
        type: Date,
        default: Date.now(),
      },
      patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        //required: true,
      },
      
      bookingId: {
        type: String,
      }, 
       
    }],

    ////// send email on request 
    sendAppointmentEmail: {
      type: Boolean,
      default: true,
    },

  },
  { timestamps: true }
);

const Appointment = mongoose.model('Appointment', AppointmentSchema);

module.exports = Appointment;