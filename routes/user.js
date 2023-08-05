// src/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const requestNewPassword = require('../controllers/resetPasswordController');
const userController = require('../controllers/userController')
const { verifyToken, verifyUser, verifyAdmin, verifyDoctor } = require('../middleware/authMiddleware');

////// ROUTE FOR TESTING
router.get('/', (req, res)=>{
    res.send(' USER SIDE')
})

// Create a new user
router.post('/create',  userController.createUser);

// Update a user
router.put('/update/:id', userController.updateUser);

// Delete a user
router.delete('/:id', verifyUser, verifyAdmin, userController.deleteUser);

// Get a user by ID
router.get('/:id', userController.getUser);

// Get all users with pagination
router.get('/allusers', userController.getAllUsers);

// Get all users without pagination
router.get('/alluserson', userController.getAllTheAppUsers);

// Get active users sorted by moment
router.get('/active', userController.getActiveUsers);

router.get('/viewsome', userController.viewUser);



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






module.exports = router;
