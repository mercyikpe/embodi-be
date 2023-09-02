const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema(
    {
        startTime: {
            type: String,
            // required: true,
        },
        endTime: {
            type: String,
            // required: true,
        },
        status: {
            type: String,
            enum: ['Scheduled', 'Booked', 'Completed', 'Cancelled'],
            default: 'Scheduled',
        },
    },
);

const AppointmentSchema = new mongoose.Schema(
    {
        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'DoctorInfo',
            required: true,
        },
        date: {
            type: Date,
            // required: true,
        },
        status: {
            type: String,
            enum: ['Scheduled', 'Booked', 'Completed', 'Cancelled'],
            default: 'Scheduled',
        },

        schedule: [ScheduleSchema],

        sendAppointmentEmail: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// Add a compound unique index to prevent overlapping appointments on the same date and time
AppointmentSchema.index({ date: 1, 'schedule.startTime': 1 }, { unique: true });

const Appointment = mongoose.model('Appointment', AppointmentSchema);

module.exports = Appointment;

// // models/Appointment.js
// const mongoose = require('mongoose');
//
// const AppointmentSchema = new mongoose.Schema(
//   {
//     // date: {
//     //   type: Date,
//     //   //required: true,
//     // },
//
//     doctor: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'DoctorInfo',
//      required: true,
//     },
//
//     date: {
//       type: String,
//       required: true,
//     },
//     isCompleted: {
//       type: Boolean,
//       required: true,
//     },
//     status: {
//           type: String,
//           enum: ['Scheduled', 'Booked', 'Completed', 'Cancelled'],
//           default: 'Scheduled',
//         },
//     schedule: [
//       {
//         startTime: {
//           type: String,
//           required: true,
//         },
//         endTime: {
//           type: String,
//           required: true,
//         },
//         status: {
//           type: String,
//           enum: ['Scheduled', 'Booked', 'Completed', 'Cancelled'],
//           default: 'Scheduled',
//         },
//       },
//     ],
//
//     // appointments: [{
//     //
//     //   appointmentId: {
//     //     type: String,
//     //   },
//     //
//     //   startTime: {
//     //     type: String,
//     //     required: true,
//     //   },
//     //   endTime: {
//     //     type: String,
//     //     //required: true,
//     //   },
//     //   status: {
//     //     type: String,
//     //     enum: ['Scheduled', 'Booked', 'Completed', 'Cancelled'],
//     //     default: 'Scheduled',
//     //   },
//     //   createdAt: {
//     //     type: Date,
//     //     default: Date.now(),
//     //   },
//     //   updatedAt: {
//     //     type: Date,
//     //     default: Date.now(),
//     //   },
//     //   patient: {
//     //     type: mongoose.Schema.Types.ObjectId,
//     //     ref: 'User',
//     //     //required: true,
//     //   },
//     //
//     //   bookingId: {
//     //     type: String,
//     //   },
//     //
//     // }],
//
//     ////// send email on request
//     sendAppointmentEmail: {
//       type: Boolean,
//       default: true,
//     },
//
//   },
//   { timestamps: true }
// );
//
// const Appointment = mongoose.model('Appointment', AppointmentSchema);
//
// // Add a compound unique index to prevent duplicate appointments based on date and startTime
// AppointmentSchema.index({ date: 1, 'schedule.startTime': 1 }, { unique: true });
//
//
// module.exports = Appointment;