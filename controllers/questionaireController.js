const Disease = require('../models/Disease');
const Questionnaire = require('../models/Questionnaire.js'); // Make sure the filename is correct
const mongoose = require('mongoose');
const validateBeforeSave = require('../middleware/validate')

/*
const createQuestionnaireForDisease = async (req, res) => {
  try {
    const {question, answer, diseaseId} = req.body;

    // First, check if the diseaseId exists
    const disease = await Disease.findById(diseaseId);
    if (!disease) {
      return res.status(404).json({
        status: 'failed',
        message: 'Disease not found.',
      });
    }

    // Create a new questionnaire instance
    const questionnaire = new Questionnaire({
      question,
      answer,
      diseaseId,
    });

    // Validate the questionnaire
    if (!questionnaire.validate()) {
      return res.status(400).json({
        status: 'failed',
        message: 'Questionnaire is not valid.',
      });
    }

    // Save the questionnaire to the database
    await questionnaire.save();

    // Append the questionnaire to the disease
    disease.questionnaire.push(questionnaire._id);

    // Save the disease to the database
    await disease.save();

    // Return the `data` object
    const data = {
      _id: questionnaire._id,
      questionnaire: [],
      "__v": 0
    };

    return res.status(201).json({
      status: 'success',
      message: 'Questionnaire created successfully.',
      data,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while creating the questionnaire.',
    });
  }
};
*/

const createQuestionnaireForDisease = async (req, res) => {
  try {
    const {question, answer, diseaseId} = req.body;

    // First, create a new questionnaire instance
    const questionnaire = new Questionnaire({
      question,
      answer,
      diseaseId,
    });

    // Save the questionnaire to the database
    await questionnaire.save();

    // Return the `data` object
    const data = {
      _id: questionnaire._id,
      questionnaire: [],
      "__v": 0
    };

    return res.status(201).json({
      status: 'success',
      message: 'Questionnaire created successfully.',
      data,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while creating the questionnaire.',
    });
  }
};



module.exports = createQuestionnaireForDisease;



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
