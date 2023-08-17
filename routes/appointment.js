const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { verifyToken, verifyDoctor , verifyUser} = require('../middleware/authMiddleware');

router.get('/', (req, res) => {
  res.send('THIS IS APPOINTMENT');
});

// Route to create a new appointment
//router.post('/create/:userId', verifyToken, verifyDoctor, verifyUser, appointmentController.createAppointment);
router.post('/create/:userId', async (req, res) => {
  const { doctorId, date, appointments } = req.body;

  if (!doctorId || !date || !appointments) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Call the createAppointment function
  const result = await appointmentController.createAppointment(doctorId, date, appointments);

  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  return res.status(201).json({ success: true, appointment: result.appointment });
});


// Corrected route path with a leading slash ////USER TO BOOK APPOINTMENT ROUTE
router.post('/book/:userId', appointmentController.bookAppointment);

//FETCH ALL THE BOOKED APPOINTMENT FOR ALL THE DOCTORS
router.get('/bookedAppointment', appointmentController.getBookedAppointmentsForDoctors);

///// FETCH APPOINTMENT FOR INDIVIDUAL DOCTOR
router.get('/bookedAppointment/:doctorId/view', appointmentController.getBookedAppointmentsForDoctor);

//// CHANGE APPOINTMENT STATUS
router.put('/updatestatus/:appointmentId',  appointmentController.updateAppointmentStatus);

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