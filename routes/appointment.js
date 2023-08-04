const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');



// Route to create a new appointment
router.post('/appointment', appointmentController.createAppointment);

///bookAppointment
//router.post('bookAppointment/:userId', appointmentController.bookAppointment);




module.exports = router;







