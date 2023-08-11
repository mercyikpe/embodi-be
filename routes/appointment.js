const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { verifyToken, verifyDoctor , verifyUser} = require('../middleware/authMiddleware');

router.get('/', (req, res) => {
  res.send('THIS IS APPOINTMENT');
});

// Route to create a new appointment
//router.post('/create/:userId', verifyToken, verifyDoctor, verifyUser, appointmentController.createAppointment);
router.post('/create/:userId', verifyToken, appointmentController.createAppointment, (req, res) => {
    // Get the user data from the request
    const user = req.user;
    
    // Create a new appointment
    const appointment = appointmentController.createAppointment(user);
    
    // Send a notification to the user
    const notification = {
    type: 'appointmentCreated',
    appointmentId: appointment.id,
    userId: user.id,
    };
   notificationController.sendNotification(notification);
    
    // Return the user data
    res.json({
    status: 200,
    message: 'Appointment created successfully.',
    data: user
    });
    });


// Corrected route path with a leading slash
router.post('/bookAppointment/:userId', appointmentController.bookAppointment);

module.exports = router;
