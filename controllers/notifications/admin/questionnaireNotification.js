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
    const admins = await User.find({ role: "isAdmin" });

    if (admins && admins.length > 0) {
      // Create the notification for each admin
      for (const admin of admins) {
        const adminNotification = new Notification({
          recipient: admin._id,
          sender: userId,
          recipientName: `${capitalizeWords(
              admin.firstName
          )} ${capitalizeWords(admin.lastName)}`,
          senderName: `${capitalizeWords(user.firstName)} ${capitalizeWords(
              user.lastName
          )}`,
          diseaseTitle: `${questionnaireDetails.diseaseTitle}`,
          status: "unread",
          notificationType: "questionnaire",
        });

        // Save the notification for the admin
        await adminNotification.save();

        // Update the admin's notifications array
        admin.notifications.push(adminNotification._id);
        await admin.save();
      }
    }
    return admins; // Optionally, you can return a list of admin users to know who received the notification
  } catch (error) {
    throw error;
  }
};

module.exports = questionnaireNotification;
