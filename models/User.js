const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      //required: true,
    },

    firstName: {
      type: String,
      //required: true,
    },
    lastName: {
      type: String,
      //required: true,
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
      sparse: true,
     
    },
    password: {
      type: String,
      //required: true,
    },
    role: {
      type: [String],
      enum: ['isUser', 'isAdmin', 'isDoctor', 'isOthers'],
      default: ['isAdmin'], // Default to 'isUser' if no role is provided during user creation
    },

    status: {
      type: String,
      enum: ['isActive', 'isInactive', 'isBlocked', 'isSuspended', 'isLimited'],
      default: 'isActive', // Default to 'isActive' if no status is provided during user creation
    },

    // ... Other fields ...

     doctorInfo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoctorInfo',
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
    },
    address: {
      type: String,
    },
    gender: {
      type: String,
    },
    allergies: {
      type: [String],
    },
   
    disease: [
      {
        disease: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Disease',
        },
        data: {
          // Fields to store data specific to the disease
          // For example: symptoms, treatment, notes, etc.
        },
      },
    ],
   
    questionaire: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Questionaire',
    },
    
    bookedAppointments: [
      {
        appointment: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Appointment',
        },
        doctorInfo: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'DoctorInfo',
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

    isValid: {
      type: Boolean,
      default: true,
    },
 },
  
  { timestamps: true }
);

const User = mongoose.model('User', UserSchema);

module.exports = User;
