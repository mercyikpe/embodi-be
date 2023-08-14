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


// Corrected route path with a leading slash ////USER TO BOOK APPOINTMENT ROUTE
router.post('/book/:userId', appointmentController.bookAppointment);

//FETCH ALL THE BOOKED APPOINTMENT FOR ALL THE DOCTORS
router.get('/bookedAppointment', appointmentController.getBookedAppointmentsForDoctors);

///// FETCH APPOINTMENT FOR INDIVIDUAL DOCTOR
router.get('/bookedAppointment/:doctorId/view', appointmentController.getBookedAppointmentsForDoctor);

//// CHANGE APPOINTMENT STATUS
router.put('/updatestatus/:appointmentId', verifyToken, appointmentController.updateAppointmentStatus);

//// get complete appointment for each doctor getCompletedAppointments
router.get('/getAppointmentById/:appointmentId',  appointmentController.getCompletedAppointments);

////get completed appointment for all the doctors getAllCompletedAppointments
router.get('/getAllTheAppointment',  appointmentController.getAllCompletedAppointments);


///DELELTE APPOINTM
router.delete('/delete/:appointmentId', verifyToken,  appointmentController.deleteAppointment);

//FETCH ALL THE  APPOINTMENT FOR ALL THE DOCTORS
router.get('/viewAll', appointmentController.viewAllAppointments);

///// SORT APPOINTMENT BY DATE FOR INDIVIDUAL DOCTOR 
router.get('/sortbydate/:doctorId', appointmentController.sortByDates);

////// getCompletedAppointmentsForDoctor GET ALL COMPLETED APPOINTMENT FOR EACH DOCTOR (ASIN ONE DOTOR SEEING ALL HIS APPOINTMENT)
router.get('/viewCompleted/:doctorId', appointmentController.getCompletedAppointmentsForDoctor);







module.exports = router;
