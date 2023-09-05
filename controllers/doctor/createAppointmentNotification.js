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

    // Construct the notification message with user's first name and last name
    const message = `${user.firstName} ${user.lastName} has booked an appointment with you.`;

    // Create the notification with appointment date and time
    const notification = new Notification({
      message,
      sender: userId, // ID of the user who booked the appointment
      recipient: doctorId, // ID of the doctor
      appointmentDate: appointmentDetails.date, // Set the appointment date
      appointmentTime: appointmentDetails.startTime, // Set the appointment time
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
