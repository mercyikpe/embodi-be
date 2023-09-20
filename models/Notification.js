const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to the user or doctor who will receive the notification
    required: true,
  },
  recipientName: {
    type: String,
  },
  message: {
    type: String,
    // required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to the sender (can be User, Doctor, or Admin)
    required: true,
  },
  senderName: {
    type: String,
  },
  diseaseTitle: {
    type: String,
  },
  notificationType: {
    type: String,
    enum: ["appointment", "questionnaire"],
    default: 'appointment',
    // required: true,
  },
  status: {
    type: String,
    enum: ["unread", "read"],
    default: "unread",
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  appointmentDate: {
    type: Date,
  },
  appointmentTime: {
    type: String,
  },
},
{ timestamps: true });

const Notification = mongoose.model("Notification", NotificationSchema);

module.exports = Notification;
