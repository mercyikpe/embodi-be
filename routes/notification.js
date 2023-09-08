const express = require("express");
const router = express.Router();

const { verifyToken, verifyDoctor } = require("../middleware/authMiddleware");

const {singleDoctorNotification, getDoctorNotifications, updateNotificationStatus} = require("../controllers/notification");
const {getAdminNotifications} = require("../controllers/notifications/admin/notifications");
const {getUserNotifications} = require("../controllers/notifications/user/notifications");

router.get("/", verifyDoctor, (req, res) => {
  res.send(" Notification SIDE");
});


// ADMIN
router.get("/admin/:adminId", getAdminNotifications);

// User
router.get("/user/:userId", getUserNotifications);

// DOCTOR
router.get("/:doctorId", getDoctorNotifications);

router.get("/:doctorId/:notificationId/details", singleDoctorNotification);

router.put("/:doctorId/:notificationId", updateNotificationStatus);


module.exports = router;