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
///////CREATE QUESTIONNAIRE USING DISEASE ID
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


///// VIEW QUESIONNAIRE AND DISEASE
// controllers/questionnaireController.js

const viewQuestionnaireWithDisease = async (req, res) => {
  try {
    const { questionnaireId } = req.params;

    // Find the questionnaire by ID
    const questionnaire = await Questionnaire.findById(questionnaireId);

    // Check if the questionnaire exists
    if (!questionnaire) {
      return res.status(404).json({
        status: 'failed',
        message: 'Questionnaire not found. Please enter a valid questionnaireId.',
      });
    }

    // Retrieve the associated disease data using the `diseaseId` from the questionnaire
    const disease = await Disease.findById(questionnaire.diseaseId);

    // Return the questionnaire and associated disease data
    return res.status(200).json({
      status: 'success',
      message: 'Questionnaire and associated disease retrieved successfully.',
      data: {
        questionnaire,
        disease,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while retrieving the questionnaire and associated disease.',
    });
  }
};

///// view all the questions and disease together
const viewAllDiseasesWithQuestionnaires = async (req, res) => {
  try {
    // Fetch all diseases
    const diseases = await Disease.find({});

    // Fetch all questionnaires and associate them with their diseases
    const questionnaires = await Questionnaire.find({});
    const questionnairesMap = new Map();
    questionnaires.forEach((questionnaire) => {
      questionnairesMap.set(questionnaire.diseaseId.toString(), questionnaire);
    });

    // Combine diseases with their questionnaires
    const diseasesWithQuestionnaires = diseases.map((disease) => ({
      disease,
      questionnaire: questionnairesMap.get(disease._id.toString()) || null,
    }));

    return res.status(200).json({
      status: 'success',
      message: 'Diseases and associated questionnaires retrieved successfully.',
      data: diseasesWithQuestionnaires,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while fetching diseases and questionnaires.',
    });
  }
};









module.exports = {
  createQuestionnaireForDisease,
  viewQuestionnaireWithDisease,
  viewAllDiseasesWithQuestionnaires

 
};
