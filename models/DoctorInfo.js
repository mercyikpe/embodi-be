const mongoose = require('mongoose');

const DoctorInfoSchema = new mongoose.Schema(
  {
    // Additional fields for doctor information
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    timeSlot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      unique: true,
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
      // Add an array of time slots representing available intervals ///from appointmet
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
);

const DoctorInfo = mongoose.model('DoctorInfo', DoctorInfoSchema);

module.exports = DoctorInfo;
