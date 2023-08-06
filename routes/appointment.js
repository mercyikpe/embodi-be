const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
//const checkDoctorRole = require('../middleware/checkDoctorRole')
const { verifyToken, verifyUser, verifyAdmin, verifyDoctor } = require('../middleware/authMiddleware');



// Route to create a new appointment
router.post('/create', verifyToken, verifyDoctor, appointmentController.createAppointment);

///bookAppointment
//router.post('bookAppointment/:userId', appointmentController.bookAppointment);




module.exports = router;







