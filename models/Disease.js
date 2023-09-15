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
  
  // doctor: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Doctor',
  // },

  // Array of questionnaires related to the disease
  // questionnaire: [{
  //   _id: {
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: 'Questionnaire',
  //   },
  //   question: {
  //     type: String,
  //     required: true,
  //   },
  //   answer: {
  //     type: String,
  //     required: true,
  //   },
  // }],

  // Reference to the User who has this disease
  //  user: {
  //    type: mongoose.Schema.Types.ObjectId,
  //    ref: 'User',
  //    //required: true,
  //
  // },

  // Reference to the Appointment related to this disease
  // appointment: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Appointment',
  //   //required: true,
  //
  // },
}, { timestamps: true });

const Disease = mongoose.model('Disease', DiseaseSchema);

module.exports = Disease;
