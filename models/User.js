const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    ///// for front end use
    name: {
      type: String,
      //required: true,
    },

    //////// for user profile update
    avatar: {
      type: String,
      //required: true,
    },

    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
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
      required: true,
      // sparse: true,
    },
    password: {
      type: String,
      required: true,
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

    // ... Other fields ...

    doctorInfo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DoctorInfo",
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

    pastAppointments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointment", // Reference the Appointment model
      },
    ],

    disease: [
      {
        disease: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Disease",
        },
        data: {
          // Fields to store data specific to the disease
          // For example: symptoms, treatment, notes, etc.
        },
      },
    ],

    questionaire: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Questionaire",
    },

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
    ////
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
    },
  },

  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);

module.exports = User;
