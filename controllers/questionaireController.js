const Disease = require('../models/Disease');


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

module.exports = {
  createQuestionnaire,
  updateQuestionnaire,
  viewQuestionnaire,
};
