// src/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const requestNewPassword = require('../controllers/resetPasswordController');
const userController = require('../controllers/userController')

const {viewAllDoctors} = require("../controllers/userController");


const { verifyToken } = require('../middleware/authMiddleware');

////// ROUTE FOR TESTING
router.get('/', verifyToken,  (req, res)=>{
    res.send(' USER SIDE')
})

// Create a new user
router.post('/create',  userController.createUser);

// Update a user
router.put('/update/:id', userController.updateUser);

// Delete a user
router.delete('/delete/:id',  userController.deleteUser);

// Get a user by ID
router.get('/user/:id', userController.getUser);

// Get all users with pagination
router.get('/allusers', userController.getAllUsers);

// Get all users without pagination
router.get('/alluserson', userController.getAllTheAppUsers);

// Get active users sorted by moment
router.get('/active', userController.getActiveUsers);

router.get('/viewsome', userController.viewUser);

router.get('/doctors', viewAllDoctors);



///// UPDATE USER  PASSWORD
router.post('/changePassword', verifyToken,  requestNewPassword.changePassword);


///////USER RESET PASSWORD STARTS HERE
///////////////////////////////////////////////////////////////////////////////////

// request for password resset with email
router.post('/requestPasswordReset', requestNewPassword.requestPasswordReset);

////// verify OTP sent to email
router.post('/verifyPasswordOtp', requestNewPassword.verifyOTP);

////// Update pasword
router.put('/updatePassword', requestNewPassword.resetPassword);
//
///////USER RESET PASSWORD ENDS HERE


//// PATIENTS DATA
const { populatePatientFields } = require('../middleware/populateFields');

// Route to get patient details
router.get('/patient/:patientId', populatePatientFields, (req, res) => {
  const patient = req.patient;
  return res.status(200).json({ patient });
});






module.exports = router;
