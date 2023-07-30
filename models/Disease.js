// models/Disease.js
const mongoose = require('mongoose');

const DiseaseSchema = new mongoose.Schema(
  {
    title: {
        type: String,
        required: true,
      },
      catergory: {
        type: String,
        required: true,
      },
      photo: {
        type: String,
        required: true,
      },
      popular: {
        type: Bolean,
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
  },
  { timestamps: true }
);

const Disease = mongoose.model('Disease', DiseaseSchema);

module.exports = Disease;
