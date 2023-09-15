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

const viewAllQuestionnaires = async (req, res, next) => {
  try {
    // Fetch all questionnaires and populate the 'user' field with selected user fields
    const questionnaires = await Questionnaire.find()
      .populate({
        path: "user",
        select: "firstName lastName pastConsultation email gender",
      })
      .populate("diseaseId", "title");

    // Calculate the count of questionnaires
    const questionnaireCount = questionnaires.length;

    res.json({
      status: 200,
      message: "All questionnaires retrieved successfully.",
      data: {
        questionnaireTotalCount: questionnaireCount,
        questionnaires,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createQuestionnaireForDisease,
  viewAllQuestionnaires,
};
