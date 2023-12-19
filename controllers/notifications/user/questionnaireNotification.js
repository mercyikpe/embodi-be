const Notification = require("../../../models/Notification");
const User = require("../../../models/User");
const res = require("express");

const questionnaireNotification = async (userId, questionnaireDetails) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    const userNotification = new Notification({
      recipient: user._id,
      sender: userId,
      diseaseTitle: `${questionnaireDetails.diseaseName}`,
      status: "unread",
      notificationType: "questionnaire",
      message: `${questionnaireDetails.diseaseName} medication has been prescribed for you. ${questionnaireDetails.adminPrescription} `,
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


const getUserOrders = async (req, res) => {
  const user = req.params.userId;

  try {
    if (!user) {
      return res.status(404).json({ message: "Account does not exist." });
    }

    // Fetch all notifications for the user
    const notifications = await Notification.find({
      recipient: user,
      notificationType: "questionnaire",
    }).sort({ timestamp: 1 });

    // Group notifications by timestamp (or any other field you prefer)
    const groupedNotifications = {};
    notifications.forEach((notification) => {
      const timestamp = notification.timestamp.toISOString().split("T")[0]; // Extract date in YYYY-MM-DD format
      if (!groupedNotifications[timestamp]) {
        groupedNotifications[timestamp] = [];
      }
      groupedNotifications[timestamp].push(notification);
    });

    return res.status(200).json({ orders: groupedNotifications });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  questionnaireNotificationUser: questionnaireNotification,
  getUserOrders,
};
