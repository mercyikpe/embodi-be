const mongoose = require('mongoose');

const DiseaseSchema = new mongoose.Schema({
  title: {
    type: String,
    //required: true,
  },
  category: {
    type: String,
    //required: true,
  },
  photo: {
    type: String,
  },
  popular: {
    type: Boolean,
    default: false,
  },
  detailTitle: {
    type: String,
    //required: true,
  },
  detail: {
    type: String,
    //required: true,
  },
  
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
  },
  questionnaire: [{
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Questionnaire',
    },
    question: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
  }],

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    //required: true,
    unique: true,
  },

  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    //required: true,
    unique: true,
  },
}, { timestamps: true });

const Disease = mongoose.model('Disease', DiseaseSchema);

module.exports = Disease;