const express = require("express");
const router = express.Router();

const { verifyToken, verifyDoctor } = require("../middleware/authMiddleware");

const {singleDoctorNotification, getDoctorNotifications, updateNotificationStatus} = require("../controllers/notification");

router.get("/", verifyDoctor, (req, res) => {
  res.send(" Notification SIDE");
});

router.get("/:doctorId", verifyDoctor, getDoctorNotifications);

router.get("/:doctorId/:notificationId/details", verifyDoctor, singleDoctorNotification);

router.put("/:doctorId/:notificationId", verifyDoctor, updateNotificationStatus);


module.exports = router;