const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to the user or doctor who will receive the notification
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to the sender (can be User, Doctor, or Admin)
    required: true,
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
  // Add separate fields for appointment date and time
  appointmentDate: {
    type: Date,
    required: true,
  },
  appointmentTime: {
    type: String,
    required: true,
  },
});

const Notification = mongoose.model("Notification", NotificationSchema);

module.exports = Notification;


// const mongoose = require("mongoose");
//
// const NotificationSchema = new mongoose.Schema({
//   recipient: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User", // Reference to the user or doctor who will receive the notification
//     required: true,
//   },
//   message: {
//     type: String,
//     required: true,
//   },
//   sender: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User", // Reference to the sender (can be User, Doctor, or Admin)
//     required: true,
//   },
//   status: {
//     type: String,
//     enum: ["unread", "read"],
//     default: "unread",
//   },
//   timestamp: {
//     type: Date,
//     default: Date.now,
//   },
// });
//
// const Notification = mongoose.model("Notification", NotificationSchema);
//
// module.exports = Notification;
