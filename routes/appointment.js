const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');


router.get('/', (req, res) => {
  res.send('THIS IS APPOINTMENT');
});


// Route to create a new appointment
router.post('/create/:userId', appointmentController.createAppointment);

///bookAppointment
//router.post('/bookAppointment', appointmentController.bookAppointment);




module.exports = router;







