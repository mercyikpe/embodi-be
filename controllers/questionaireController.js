const Disease = require("../models/Disease");
const User = require("../models/User.js"); // Make sure the filename is correct
const Questionnaire = require("../models/Questionnaire.js"); // Make sure the filename is correct
const questionnaireNotification = require("./notifications/admin/questionnaireNotification");

///////CREATE QUESTIONNAIRE USING DISEASE ID
const createQuestionnaireForDisease = async (req, res) => {
  try {
    const { questionsAndAnswers } = req.body;
    const { userId, diseaseId } = req.params;

    // Find the disease based on the provided diseaseId
    const disease = await Disease.findById(diseaseId);

    if (!disease) {
      return res.status(404).json({
        status: "failed",
        message: "Disease not found.",
      });
    }

    const questionnaireData = {
      diseaseId,
      questionsAndAnswers,
      user: userId, // Associate the questionnaire with the user
    };

    const questionnaire = new Questionnaire(questionnaireData);
    await questionnaire.save();

    // Use the disease title in the notification
    const diseaseTitle = disease.title;

    // Call the function to create a notification for all admin users
    await questionnaireNotification(userId, { diseaseTitle });

    // Add the questionnaire to the user's past consultations
    const user = await User.findById(userId);
    if (user) {
      user.pastConsultation.push(questionnaire._id);
      await user.save();
    }

    return res.status(201).json({
      status: "success",
      message: "Questionnaire created successfully.",
      data: questionnaire, // Include the questionnaire data in the response
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "failed",
      message: "An error occurred while creating the questionnaire.",
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
        status: "failed",
        message:
          "Questionnaire not found. Please enter a valid questionnaireId.",
      });
    }

    // Retrieve the associated disease data using the `diseaseId` from the questionnaire
    const disease = await Disease.findById(questionnaire.diseaseId);

    // Return the questionnaire and associated disease data
    return res.status(200).json({
      status: "success",
      message: "Questionnaire and associated disease retrieved successfully.",
      data: {
        questionnaire,
        disease,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "failed",
      message:
        "An error occurred while retrieving the questionnaire and associated disease.",
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
      status: "success",
      message: "Diseases and associated questionnaires retrieved successfully.",
      data: diseasesWithQuestionnaires,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "failed",
      message: "An error occurred while fetching diseases and questionnaires.",
    });
  }
};

module.exports = {
  createQuestionnaireForDisease,
  viewQuestionnaireWithDisease,
  viewAllDiseasesWithQuestionnaires,
};
