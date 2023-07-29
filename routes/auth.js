// src/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/', (req, res)=>{
    res.send(' running here')
}
)

// User registration route
router.post('/register', authController.registerUser); 

// User login route
router.post('/login', authController.loginUser);

// REQUEST FOR NEW OTP
router.post('/requestotp', authController.requestOTP);

/// verify Otp
router.post('/verifyotp', authController.verifyOTP);

// User Google sign-in route
//router.post('google-signin', authController.googleSignIn);



module.exports = router;
