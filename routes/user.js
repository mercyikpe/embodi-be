// src/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const requestNewPassword = require('../controllers/resetPasswordController');
const userController = require('../controllers/userController')

const {viewAllDoctors} = require("../controllers/userController");
const {getUserOrders} = require("../controllers/notifications/user/questionnaireNotification");

const {createSubscription} = require("../controllers/subscription");

const { verifyToken } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadFile');

////// ROUTE FOR TESTING
router.get('/', verifyToken,  (req, res)=>{
    res.send(' USER SIDE')
})

// admin create new user or Create a new user request
router.post('/create',  userController.createUser);

// Update a user
router.put('/update/:id', userController.handleUserProfileUpdate);
// router.put('/update/:id', upload.single('avatar'), userController.handleUserProfileUpdate);

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

router.get('/orders/:userId', getUserOrders);



///// UPDATE USER  PASSWORD
router.post('/changePassword',  requestNewPassword.changePassword);


///////USER RESET PASSWORD STARTS HERE
///////////////////////////////////////////////////////////////////////////////////

// request for password resset with email
router.post('/requestPasswordReset', requestNewPassword.requestPasswordReset);

////// verify OTP sent to email
router.post('/updatePassword', requestNewPassword.verifyOTPAndPasswordReset);

router.post('/subscribe',  createSubscription);

// router.post('/verifyPasswordOtp', requestNewPassword.verifyOTP);

////// Update pasword
// router.put('/updatePassword', requestNewPassword.resetPassword);
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
