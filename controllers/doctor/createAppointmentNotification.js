const Notification = require("../../models/Notification");
const User = require("../../models/User");
const res = require("express");


const createAppointmentNotification = async (
    doctorId,
    userId,
    appointmentDetails
) => {
  try {
    // Find the doctor and user using their IDs
    const doctor = await User.findById(doctorId);
    const user = await User.findById(userId);

    if (!doctor || !user) {
      return res.status(404).json({ message: "Doctor or user not found" });
    }

    // Create the notification with appointment date and time, including sender's and recipient's names
    const notification = new Notification({
      recipient: doctorId,
      sender: userId,
      recipientName: `${doctor.firstName} ${doctor.lastName}`, // Include recipient's name
      senderName: `${user.firstName} ${user.lastName}`, // Include sender's name
      status: "unread",
      appointmentDate: appointmentDetails.date,
      appointmentTime: appointmentDetails.startTime,
    });

    // Save the notification
    await notification.save();

    // Update the doctor's notifications array
    doctor.notifications.push(notification._id);
    await doctor.save();

    return notification;
  } catch (error) {
    // Handle errors as needed
    throw error;
  }
};


module.exports = createAppointmentNotification;
