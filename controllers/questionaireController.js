const Disease = require("../models/Disease");
const User = require("../models/User.js");
const Questionnaire = require("../models/Questionnaire.js");
const questionnaireNotification = require("./notifications/admin/questionnaireNotification");
const {
  questionnaireNotificationUser,
} = require("./notifications/user/questionnaireNotification");
const SubscriptionPlan = require("../models/Subscription")

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

    // decrease the questionnairesCount
    await SubscriptionPlan.findOne({ userId }).then(user => {

      if (user.questionnairesCount > 0) {
        user.questionnairesCount--;
      }
      user.save();

      return user
    })

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
      message: "Questionnaire submitted successfully.",
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
  const { prescription } = req.body;

  try {
    // Find the questionnaire based on the questionnaireId
    // const questionnaire = await Questionnaire.findById(questionnaireId).populate("user");
    const questionnaire = await Questionnaire.findById(
      questionnaireId
    ).populate("user");

    if (!questionnaire) {
      return res.status(404).json({ message: "Questionnaire not found." });
    }
    // Check if the questionnaire is already marked as "Completed"
    if (questionnaire.status === "completed") {
      return res
        .status(400)
        .json({ message: "Questionnaire is already marked as completed." });
    }

    let success = false;

    try {
      // Fetch the disease document using the `diseaseId` from the questionnaire
      const disease = await Disease.findById(questionnaire.diseaseId);

      // Get the user ID from the questionnaire
      const userId = questionnaire.user;
      questionnaire.prescription = prescription || "";

      // Call the function to create a notification
      const questionnaireDetails = {
        diseaseName: disease ? disease.title : "Unknown Disease",
        adminPrescription: questionnaire ? questionnaire.prescription : "No medication",
      };

      /*
      const questionnaireDetails =
        questionnaire.prescription || "No medication";
       */
      // Save the updated questionnaire
      questionnaire.status = "completed";
      await questionnaire.save();

      // Attempt to send the questionnaire notification
      await questionnaireNotificationUser(userId, questionnaireDetails);

      success = true;
    } catch (updateError) {
      // If there's an error during the update, log the error
      // Respond with an error message
      return res.status(500).json({
        error: updateError.message,
        message: "Error marking the questionnaire as completed.",
      });
    } finally {
      // Check the success flag before responding
      if (success) {
        // Respond with a success message and userNotification
        return res
          .status(200)
          .json({ message: "Questionnaire marked as completed." });
      } else {
        // Rollback the status update if there was an error
        questionnaire.status = "uncompleted";
        questionnaire.prescription = ""; // Reset prescription if an error occurred
        await questionnaire.save();
      }
    }
  } catch (error) {
    // Handle the initial error when finding the questionnaire
    return res.status(500).json({
      error: error.message,
      message: "An error occurred while finding the questionnaire.",
    });
  }
};

module.exports = {
  createQuestionnaireForDisease,
  viewAllQuestionnaires,
  markQuestionnaireCompleted,
};
