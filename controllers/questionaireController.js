const Disease = require("../models/Disease");
const User = require("../models/User.js");
const Questionnaire = require("../models/Questionnaire.js");
const questionnaireNotification = require("./notifications/admin/questionnaireNotification");
const {
  questionnaireNotificationUser,
} = require("./notifications/user/questionnaireNotification");

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

const markQuestionnaireCompleted = async (req, res) => {
  const { questionnaireId } = req.params;

  try {
    // Find the questionnaire based on the questionnaireId
    const questionnaire = await Questionnaire.findById(questionnaireId);

    if (!questionnaire) {
      return res.status(404).json({ message: "Questionnaire not found." });
    }

    // Check if the questionnaire is already marked as "Completed"
    if (questionnaire.status === "completed") {
      return res
        .status(400)
        .json({ message: "Questionnaire is already marked as completed." });
    }

    // Update the status of the questionnaire to "Completed"
    questionnaire.status = "completed";

    // Save the updated questionnaire
    await questionnaire.save();

    // Get the user ID from the questionnaire
    const userId = questionnaire.user;

    // Fetch the disease document using the `diseaseId` from the questionnaire
    const disease = await Disease.findById(questionnaire.diseaseId);

    // Define questionnaire details including the disease name
    const questionnaireDetails = {
      diseaseName: disease ? disease.title : "Unknown Disease", // Use disease.title if available, otherwise set to "Unknown Disease"
    };

    // Call the function to create a notification
    // const userNotification = await questionnaireNotificationUser(
    //     userId,
    //     questionnaireDetails
    // );

    await questionnaireNotificationUser(userId, questionnaireDetails);

    // Respond with a success message and userNotification
    return res
      .status(200)
      .json({ message: "Questionnaire marked as completed." });
  } catch (error) {
    return res.status(500).json({
      message:
        "An error occurred while marking the questionnaire as completed.",
    });
  }
};

module.exports = {
  createQuestionnaireForDisease,
  viewAllQuestionnaires,
  markQuestionnaireCompleted,
};
