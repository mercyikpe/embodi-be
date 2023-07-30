// models/Questionaire. js
const mongoose = require('mongoose');

const QuestionaireSchema = new mongoose.Schema(
  {
    title: {
        type: String,
        required: true,
      },
      options: {
        type: [
          {
            option: {
              type: String,
              required: true,
            }
          },
        ],
        
      },
  },
  { timestamps: true }
);

const Questionaire = mongoose.model('Questionaire', QuestionaireSchema);

module.exports = Questionaire;
