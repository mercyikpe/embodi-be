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

    // Find all users with the role "admin"
    const adminUsers = await User.find({ role: "isAdmin" });

    for (const adminUser of adminUsers) {
      // Create the notification for each admin user
      const adminNotification = new Notification({
        recipient: adminUser._id,
        sender: userId,
        recipientName: `${capitalizeWords(
          adminUser.firstName
        )} ${capitalizeWords(adminUser.lastName)}`,
        senderName: `${capitalizeWords(user.firstName)} ${capitalizeWords(
          user.lastName
        )}`,
        diseaseTitle: `${questionnaireDetails.diseaseTitle}`,
        status: "unread",
        notificationType: "questionnaire",
      });

      // Save the notification for the admin user
      await adminNotification.save();

      // Update the admin user's notifications array
      adminUser.notifications.push(adminNotification._id);
      await adminUser.save();
    }

    return adminUsers; // Optionally, you can return a list of admin users to know who received the notification
  } catch (error) {
    throw error;
  }
};

module.exports = questionnaireNotification;
