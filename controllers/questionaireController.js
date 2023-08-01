const Disease = require('../models/Disease');
const Questionnaire = require('../models/Questionnaire.js'); // Make sure the filename is correct
const mongoose = require('mongoose');



async function createQuestionnaireForDisease(req, res) {
  try {
    const { diseaseId, question, answer } = req.body;

    console.log('Disease ID:', diseaseId);
    console.log('Question:', question);
    console.log('Answer:', answer);

    // First, create a new questionnaire instance
    const questionnaire = new Questionnaire({
      question,
      answer,
      diseaseId,
    });

  
    // Save the questionnaire to the database
    await questionnaire.save();

    // Find the disease by its ID
    const disease = await Disease.findById(diseaseId);

    // Add the newly created questionnaire's ObjectId to the disease's questionnaire array
    disease.questionnaire.push(questionnaire._id);

    // Save the updated disease to the database
    await disease.save();

    // Return the `data` object
    const data = {
      _id: questionnaire._id,
      questionnaire: [],
      "__v": 0
    };

    return res.status(201).json(data);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while creating the questionnaire.',
    });
  }
}

module.exports = createQuestionnaireForDisease;


/*
// Create a new questionnaire for a disease
async function createQuestionnaire(req, res) {
  try {
    const diseaseId = req.params.id;
    const questionnaireData = req.body;
    const disease = await Disease.findById(diseaseId);
    if (!disease) {
      return res.status(404).json({
        status: 'failed',
        message: 'Disease not found.',
      });
    }
    disease.questionnaire.push(questionnaireData);
    await disease.save();
    return res.status(201).json({
      status: 'success',
      message: 'Questionnaire created successfully.',
      data: questionnaireData,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while creating the questionnaire.',
    });
  }
}

// Update a questionnaire for a disease
async function updateQuestionnaire(req, res) {
  try {
    const diseaseId = req.params.id;
    const questionnaireId = req.params.questionnaireId;
    const questionnaireData = req.body;
    const disease = await Disease.findById(diseaseId);
    if (!disease) {
      return res.status(404).json({
        status: 'failed',
        message: 'Disease not found.',
      });
    }
    const questionnaireIndex = disease.questionnaire.findIndex(
      (questionnaire) => questionnaire._id.toString() === questionnaireId
    );
    if (questionnaireIndex === -1) {
      return res.status(404).json({
        status: 'failed',
        message: 'Questionnaire not found.',
      });
    }
    disease.questionnaire[questionnaireIndex] = questionnaireData;
    await disease.save();
    return res.status(200).json({
      status: 'success',
      message: 'Questionnaire updated successfully.',
      data: questionnaireData,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while updating the questionnaire.',
    });
  }
}

// View questionnaire for a disease
async function viewQuestionnaire(req, res) {
  try {
    const diseaseId = req.params.id;
    const disease = await Disease.findById(diseaseId);
    if (!disease) {
      return res.status(404).json({
        status: 'failed',
        message: 'Disease not found.',
      });
    }
    return res.status(200).json({
      status: 'success',
      data: disease.questionnaire,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while fetching the questionnaire.',
    });
  }
}
*/
module.exports = {
  createQuestionnaireForDisease
  /*
  addQuestionsToQuestionnaire,
  updateQuestionsInQuestionnaire,
  viewQuestionsForDisease,
  viewQuestionnaire,
  deleteQuestionnaire,
  createQuestionnaire,
  updateQuestionnaire
*/
  /*
  
  createQuestionnaire,
  updateQuestionnaire,
  viewQuestionnaire,
  */
};
