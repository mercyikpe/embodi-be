const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const {createAppointment, bookAppointment} = require('../controllers/appointmentController');
const { verifyToken, verifyDoctor , verifyUser} = require('../middleware/authMiddleware');
const patient = require('../models/User')
router.use(express.json()); 


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

  const { doctorDetails, appointment } = result;

  return res.status(201).json({ success: true, appointment, doctorDetails,});
});



// Corrected route path with a leading slash ////USER TO BOOK APPOINTMENT ROUTE
// router.post('/book', verifyToken, async (req, res) => {
//   try {
//     const { patientId } = req.user; // Assuming you're using authentication middleware to extract user data
//     const appointmentData = req.body;

//     const result = await appointmentController.bookAppointment(patientId, appointmentData);

//     if (result.success) {
//       res.status(200).json(result);
//     } else {
//       res.status(400).json(result);
//     }
//   } catch (error) {
//     console.error('Route Error:', error);
//     res.status(500).json({ error: error.message }); // Return the specific error message
//   }
// });


// Create a POST route for booking an appointment
/*
router.post('/book', verifyToken, async (req, res) => {
  const { appointmentId } = req.body;
  const patientId = req.user.id; // Assuming you get the patient ID from the token

  try {
    // Call the bookAppointment function with appointmentId and patientId
    const result = await bookAppointment(appointmentId, patientId);

    if (result.status === 'failed') {
      return res.status(400).json({ error: result.message });
    }

    return res.status(200).json({ success: true, appointment: result.data });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'An error occurred while processing the request.' });
  }
});
*/

router.post( '/book', verifyToken, appointmentController.bookAppointment );








///// route
//router.post('/book/:userId', verifyToken, appointmentController.bookAppointment);

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