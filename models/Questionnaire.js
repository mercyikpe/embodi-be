const mongoose = require('mongoose');

const QuestionnaireSchema = new mongoose.Schema({
  question: {
    type: String,
    //required: true,
  },
  answer: {
    type: String,
    //required: true,
  },
  diseaseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Disease',
  },
});

const Questionnaire = mongoose.model('Questionnaire', QuestionnaireSchema);

module.exports = Questionnaire;