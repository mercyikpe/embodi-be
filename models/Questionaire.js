// models/Questionaire. js
const mongoose = require('mongoose');

const QuestionaireSchema = new mongoose.Schema(
  {
    
  },
  { timestamps: true }
);

const Appointment = mongoose.model('Disease', DiseaseSchema);

module.exports = Disease;
