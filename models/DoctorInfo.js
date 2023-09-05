const mongoose = require("mongoose");

const DoctorInfoSchema = new mongoose.Schema(
  {
    // Additional fields for doctor information
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    appointments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointment",
      },
    ],
    // notifications: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Notification",
    //   },
    // ],

    qualification: {
      type: String,
      // required: true,
    },
    placeOfWork: {
      type: String,
      // required: true,
    },
    specialty: {
      type: String,
      // required: true,
    },
    yearOfExperience: {
      type: Number,
      // required: true,
    },
    rate: {
      type: Number,
      // required: true,
    },
    bio: {
      type: String,
      //required: true,
    },
    // Bank information fields for doctors
    bankName: {
      type: String,
    },
    accountName: {
      type: String,
    },
    accountNumber: {
      type: Number,
    },
    availableTimeSlots: {
      type: [
        {
          date: {
            type: Date,
            // required: true,
          },
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
          },
          patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },

          bookingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
        },
      ],
      default: [], // Initialize with an empty array
    },

    // Email sending functionality
    sendAppointmentEmail: {
      type: Boolean,
      default: true,
    },
  },

  { timestamps: true }
);

const DoctorInfo = mongoose.model("DoctorInfo", DoctorInfoSchema);

module.exports = DoctorInfo;
