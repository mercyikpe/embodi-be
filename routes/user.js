// src/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const requestNewPassword = require('../controllers/resetPasswordController');
const userController = require('../controllers/userController')
const { verifyToken, verifyUser, verifyAdmin, verifyDoctor } = require('../middleware/authMiddleware');


router.get('/', (req, res)=>{
    res.send(' USER SIDE')
}
)


// Create a new user
router.post('/create',  userController.createUser);

// Update a user
router.put('/:id', userController.updateUser);

// Delete a user
router.delete('/:id', verifyUser, verifyAdmin, userController.deleteUser);

// Get a user by ID
router.get('/:id', userController.getUser);

// Get all users
router.get('/all', userController.getAllUsers);

// Get active users sorted by moment
router.get('/active', userController.getActiveUsers);



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
