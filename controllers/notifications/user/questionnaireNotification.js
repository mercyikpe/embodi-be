const Notification = require("../../../models/Notification");
const User = require("../../../models/User");
const res = require("express");
const { capitalizeWords } = require("../../../utilities/format");

const questionnaireNotification = async (userId, questionnaireDetails) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userNotification = new Notification({
      recipient: user._id,
      sender: userId,
      diseaseTitle: `${questionnaireDetails.diseaseTitle}`,
      status: "unread",
      notificationType: "questionnaire",
    });

    // Save the notification for the user
    await userNotification.save();

    // Update the user's notifications array
    user.notifications.push(userNotification._id);
    await user.save();

    return userNotification;
  } catch (error) {
    throw error;
  }
};

module.exports = questionnaireNotification;
