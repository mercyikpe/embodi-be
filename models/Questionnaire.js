const mongoose = require("mongoose");

const QuestionnaireSchema = new mongoose.Schema({
  questionsAndAnswers: [
    {
      question: {
        type: String,
      },
      answer: {
        type: String,
      },
    },
  ],
  // Reference to the User who has this disease
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    //required: true,
  },
  diseaseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Disease",
  },
},
    { timestamps: true }
);

const Questionnaire = mongoose.model("Questionnaire", QuestionnaireSchema);

module.exports = Questionnaire;
