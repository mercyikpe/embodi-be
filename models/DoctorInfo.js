const mongoose = require('mongoose');

const DoctorInfoSchema = new mongoose.Schema(
  {
    // Reference to the User model for the doctor's user information
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
     
    },

    // Reference to the Appointment model for the doctor's time slots
    timeSlot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      //required: true,
     
    },

    qualification: {
      type: String,
      required: true,
    },
    placeOfWork: {
      type: String,
      required: true,
    },
    specialty: {
      type: String,
      required: true,
    },
    yearOfExperience: {
      type: Number,
      required: true,
    },
    rate: {
      type: Number,
      required: true,
    },
    bio: {
      type: String,
      required: true,
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

    // Star rating for the doctor
    StarRating: {
      type: Number,
      default: 0,
      min: 0, // Adjust the min value based on your requirements
    },
    
/////////// AAVILABE TIM SLOT
availableTimeSlots: {
  type: [
    {
      startTime: {
        type: String,
        required: true,
      },
      endTime: {
        type: String,
        required: true,
      },
    },
  ],
  default: [], // Initialize with an empty array
},
  },
  { timestamps: true }
)

const DoctorInfo = mongoose.model('DoctorInfo', DoctorInfoSchema);

module.exports = DoctorInfo;
