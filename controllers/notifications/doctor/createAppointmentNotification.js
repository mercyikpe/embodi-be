const Notification = require("../../../models/Notification");
const User = require("../../../models/User");
const res = require("express");
const {capitalizeWords} = require("../../../utilities/format");


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

    // Create the notification for the doctor
    const doctorNotification = new Notification({
      recipient: doctorId,
      sender: userId,
      recipientName: `${capitalizeWords(doctor.firstName)} ${capitalizeWords(doctor.lastName)}`,
      senderName: `${capitalizeWords(user.firstName)} ${capitalizeWords(user.lastName)}`,
      message: `${capitalizeWords(user.firstName)} ${capitalizeWords(user.lastName)} booked an appointment`,
      status: "unread",
      appointmentDate: appointmentDetails.date,
      appointmentTime: appointmentDetails.startTime,
    });

    // Save the notification for the doctor
    await doctorNotification.save();

    // Update the doctor's notifications array
    doctor.notifications.push(doctorNotification._id);
    await doctor.save();

    // Find the admin user (you'll need to define how to identify the admin user)
    const admin = await User.findOne({ role: "isAdmin" });

    if (admin) {
      // Create the notification for the admin
      const adminNotification = new Notification({
        recipient: admin._id,
        sender: userId,
        recipientName: "Admin", // You can customize this as needed
        senderName: `${capitalizeWords(user.firstName)} ${capitalizeWords(user.lastName)}`,
        message: `${capitalizeWords(user.firstName)} ${capitalizeWords(user.lastName)} performed an action`,
        status: "unread",
      });

      // Save the notification for the admin
      await adminNotification.save();

      // Update the admin's notifications array
      admin.notifications.push(adminNotification._id);
      await admin.save();
    }

    return doctorNotification;

    // Create the notification with appointment date and time, including sender's and recipient's names
    // const notification = new Notification({
    //   recipient: doctorId,
    //   sender: userId,
    //   recipientName: `${capitalizeWords(doctor.firstName)} ${capitalizeWords(doctor.lastName)}`, // Include recipient's name
    //   senderName: `${capitalizeWords(user.firstName)} ${capitalizeWords(user.lastName)}`, // Include sender's name
    //   // recipientName: `${doctor.firstName} ${doctor.lastName}`, // Include recipient's name
    //   // senderName: `${user.firstName} ${user.lastName}`, // Include sender's name
    //   message: `${capitalizeWords(user.firstName)} ${capitalizeWords(user.lastName)} booked an appointment`,
    //   status: "unread",
    //   appointmentDate: appointmentDetails.date,
    //   appointmentTime: appointmentDetails.startTime,
    // });
    //
    // // Save the notification
    // await notification.save();
    //
    // // Update the doctor's notifications array
    // doctor.notifications.push(notification._id);
    // await doctor.save();
    //
    // return notification;
  } catch (error) {
    // Handle errors as needed
    throw error;
  }
};


module.exports = createAppointmentNotification;
