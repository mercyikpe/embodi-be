
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
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
     // required: true,
      unique: true,
    },
    password: {
      type: String,
     // required: true,
    },

    isAdmin: {
      type: Boolean,
      default: false,
    },
    isDoctor: {
      type: Boolean,
      default: false,
    },

    // Additional field to reference DoctorInfo model
    doctorInfo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoctorInfo',
    },
    
    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['verified', 'unverified'],
      default: 'unverified',
    },
    verified: {
      type: Boolean,
      default: false,
    },
    image: {
      type: String,  
    },
    dob: {
      type: Date

    },
    address: {
      type: String,  
    },
    gender: {
      type: String,  
    },
    allergies: {
      type: [String ] 
    },

    ownedDiseases: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Disease',
      },
    ],

    //////////USER OWN DISEASE AND QUESTION THEY ANSWER
    diseaseData: [
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

    
    disease: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Disease',
    },

    questionaire: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Questionaire',
    },

  },
  { timestamps: true }
);

const User = mongoose.model('User', UserSchema);

module.exports = User;
