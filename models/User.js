const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    avatar: {
      type: String,
      default: "",
    },

    firstName: {
      type: String,
      required: false,
    },
    lastName: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    phoneNumber: {
      type: String,
      unique: true,
      required: false,
      sparse: true,
    },
    password: {
      type: String,
      required: false,
    },

    role: {
      type: String,
      enum: ["isUser", "isAdmin", "isDoctor", "isOthers"],
      default: "isUser", // Default to 'isUser'
    },

    status: {
      type: String,
      enum: ["isActive", "isInactive", "isBlocked", "isSuspended", "isLimited"],
      default: "isActive",
    },

    verifyBadge: {
      type: Boolean,
      default: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    image: {
      type: String,
    },
    dob: {
      type: Date,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    gender: {
      type: String,
      default: "",
    },
    allergies: {
      type: [String],
    },

    doctorInfo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DoctorInfo",
    },
    pastAppointments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointment", // Reference the Appointment model
      },
    ],
    pastConsultation: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Questionnaire", // Reference the Questionnaire model
      },
    ],

    bookedAppointments: [
      {
        appointment: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Appointment",
        },
        doctorInfo: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "DoctorInfo",
        },
        startTime: String,
        endTime: String,
        status: String,
        doctorName: String,
      },
    ],
    sendAppointmentEmails: {
      type: Boolean,
      default: true,
    },

    notifications: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Notification",
      },
    ],

    isValid: {
      type: Boolean,
      default: true,
    }
  },

  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);

module.exports = User;
