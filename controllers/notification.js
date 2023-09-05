const Notification = require("../models/Notification");
const User = require("../models/User");

const getDoctorNotifications = async (req, res) => {
  const { doctorId } = req.params;

  try {
    // Fetch all notifications for the doctor
    const notifications = await Notification.find({ recipient: doctorId }).sort(
      { appointmentDate: 1, timestamp: 1 }
    );

    // Group notifications by appointmentDate
    const groupedNotifications = {};
    notifications.forEach((notification) => {
      if (notification.appointmentDate) {
        const appointmentDate = notification.appointmentDate
          .toISOString()
          .split("T")[0]; // Extract date in YYYY-MM-DD format
        if (!groupedNotifications[appointmentDate]) {
          groupedNotifications[appointmentDate] = [];
        }
        groupedNotifications[appointmentDate].push(notification);
      }
    });

    return res.status(200).json({ notifications: groupedNotifications });
  } catch (error) {
    // console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Endpoint to get notifications for a specific doctor
const singleDoctorNotification = async (req, res) => {
  const { notificationId, doctorId } = req.params;

  try {
    const notification = await Notification.findById(notificationId)
        .populate('sender', 'gender dob allergies pastAppointments');

    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }

    // Check if the notification recipient matches the provided doctorId
    if (notification.recipient.toString() !== doctorId) {
      return res.status(403).json({ message: "Permission denied." });
    }

    res.status(200).json({ notification });
  } catch (error) {
    // console.error("Error retrieving notification:", error);
    res.status(500).json({ message: "Error retrieving notification" });
  }
};

const updateNotificationStatus = async (req, res) => {
  const { notificationId } = req.params;

  try {
    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (notification.status === "read") {
      return res
        .status(400)
        .json({ message: "Notification is already marked as read" });
    }

    // Update the notification status to "read"
    notification.status = "read";
    await notification.save();

    res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    // console.error("Error marking notification as read:", error.message);
    res.status(500).json({ message: "Error marking notification as read" });
  }
};

module.exports = {
  singleDoctorNotification,
  getDoctorNotifications,
  updateNotificationStatus,
};
