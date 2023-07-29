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
  },
  { timestamps: true }
);

const DoctorInfo = mongoose.model('DoctorInfo', DoctorInfoSchema);

module.exports = DoctorInfo;
