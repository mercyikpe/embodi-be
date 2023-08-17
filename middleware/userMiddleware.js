// Import necessary models
const User = require('../models/User');
const Disease = require('../models/Disease');
const Questionnaire = require('../models/Questionnaire');

// Middleware to automatically add form data to the user model
UserSchema.pre('save', async function (next) {
  if (this.isModified('disease') || this.isModified('questionnaire')) {
    // If the disease or questionnaire field is modified, fetch the corresponding document
    try {
      if (this.disease) {
        const disease = await Disease.findById(this.disease);
        if (disease) {
          this.disease = disease;
        }
      }

      if (this.questionnaire) {
        const questionnaire = await Questionnaire.findById(this.questionnaire);
        if (questionnaire) {
          this.questionaire = questionnaire;
        }
      }
    } catch (error) {
      console.error('Error fetching and adding form data:', error);
    }
  }

  next();
});
