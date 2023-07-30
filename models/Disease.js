// models/Disease.js
const mongoose = require('mongoose');

const DiseaseSchema = new mongoose.Schema(
  {
    
  },
  { timestamps: true }
);

const Disease = mongoose.model('Disease', DiseaseSchema);

module.exports = Disease;
