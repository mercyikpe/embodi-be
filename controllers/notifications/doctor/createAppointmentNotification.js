const Notification = require("../../../models/Notification");
const User = require("../../../models/User");
const res = require("express");
const { capitalizeWords } = require("../../../utilities/format");

const createAppointmentNotification = async (
  doctorId,
  userId,
  appointmentDetails
) => {
  try {
    // Find the doctor and user using their IDs
    const doctor = await User.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }


    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create the notification for the doctor
    const doctorNotification = new Notification({
      recipient: doctorId,
      sender: userId,
      recipientName: `${capitalizeWords(doctor.firstName)} ${capitalizeWords(
        doctor.lastName
      )}`,
      senderName: `${capitalizeWords(user.firstName)} ${capitalizeWords(
        user.lastName
      )}`,
      message: `${capitalizeWords(user.firstName)} ${capitalizeWords(
        user.lastName
      )} booked an appointment`,
      status: "unread",
      appointmentDate: appointmentDetails.date,
      appointmentTime: appointmentDetails.startTime,
    });

    // Save the notification for the doctor
    await doctorNotification.save();

    // Update the doctor's notifications array
    doctor.notifications.push(doctorNotification._id);
    await doctor.save();


    // Find the admin user
    const admin = await User.findOne({ role: "isAdmin" });

    if (admin) {
      // Create the notification for the admin
      const adminNotification = new Notification({
        recipient: admin._id,
        sender: userId,
        recipientName: `${capitalizeWords(doctor.firstName)} ${capitalizeWords(doctor.lastName)}`,
        senderName: `${capitalizeWords(user.firstName)} ${capitalizeWords( user.lastName )}`,
        message: `${capitalizeWords(user.firstName)} ${capitalizeWords(user.lastName)} booked an appointment`,
        status: "unread",
      });

      // Save the notification for the admin
      await adminNotification.save();

      // Update the admin's notifications array
      admin.notifications.push(adminNotification._id);
      await admin.save();
    }

    if (user) {
      // Create the notification for the user
      const userNotification = new Notification({
        recipient: user._id,
        sender: userId,
        recipientName: `${capitalizeWords(doctor.firstName)} ${capitalizeWords(doctor.lastName)}`,
        senderName: `${capitalizeWords(user.firstName)} ${capitalizeWords(user.lastName)}`,
        message: `You have scheduled an appointment with Dr. ${capitalizeWords(doctor.firstName)} ${capitalizeWords(doctor.lastName)}`,
        status: "unread",
      });

      // Save the notification for the user
      await userNotification.save();

      // Update the user's notifications array
      user.notifications.push(userNotification._id);
      await user.save();
    }

    return doctorNotification;
  } catch (error) {
    throw error;
  }
};

module.exports = createAppointmentNotification;
