const mongoose = require('mongoose');

const DiseaseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
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
    required: true,
  },
  detail: {
    type: String,
    required: true,
  },
  questionaire: [
    {
      title: {
        type: String,
        required: true,
      },
      option: {
        type: String,
        required: true,
      }
    },
  ],
}, { timestamps: true });

const Disease = mongoose.model('Disease', DiseaseSchema);

module.exports = Disease;
