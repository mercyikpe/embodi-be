const mongoose = require("mongoose");

const ScheduleSchema = new mongoose.Schema({
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
    enum: ["Scheduled", "Booked", "Completed", "Cancelled"],
    default: "Scheduled",
  },
  bookingId: {
    type: String,
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    // required: true,
  },
});

const AppointmentSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DoctorInfo",
      required: true,
    },
    date: {
      type: Date,
      // required: true,
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
AppointmentSchema.index({ date: 1, "schedule.startTime": 1 }, { unique: true });

const Appointment = mongoose.model("Appointment", AppointmentSchema);

module.exports = Appointment;