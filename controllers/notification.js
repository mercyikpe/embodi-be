const Notification = require("../models/Notification");
const User = require("../models/User");

const getDoctorNotifications = async (req, res) => {
  const { doctorId } = req.params;

  try {
    // Find the doctor by ID
    const doctor = await User.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    // Retrieve notifications for the doctor, populating the sender field
    const notifications = await Notification.find({ recipient: doctorId })
      .populate("sender", "firstName lastName") // Populate sender's first and last name
      .exec();

    return res.status(200).json({ notifications });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "An error occurred while fetching notifications." });
  }
};

// Endpoint to get notifications for a specific doctor
const singleDoctorNotification = async (req, res) => {
  const { doctorId } = req.params;
  try {
    const notifications = await Notification.find({ recipient: doctorId });
    res.status(200).json({ notifications });
  } catch (error) {
    console.error("Error retrieving notifications:", error);
    res.status(500).json({ message: "Internal server error" });
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
    console.error("Error marking notification as read:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  singleDoctorNotification,
  getDoctorNotifications,
  updateNotificationStatus,
};
