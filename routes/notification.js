const express = require("express");
const router = express.Router();

const { verifyToken, verifyDoctor } = require("../middleware/authMiddleware");
const {singleDoctorNotification, getDoctorNotifications, updateNotificationStatus} = require("../controllers/notification");

router.get("/", verifyToken, verifyDoctor, (req, res) => {
  res.send(" Notification SIDE");
});

router.get("/:doctorId", verifyToken, verifyDoctor, getDoctorNotifications);

router.get("/:doctorId/:notificationId/details", verifyToken, verifyDoctor, singleDoctorNotification);

router.put("/:doctorId/:notificationId", verifyToken, verifyDoctor, updateNotificationStatus);


module.exports = router;