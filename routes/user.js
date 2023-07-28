// src/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const requestNewPassword = require('../controllers/resetPasswordControllers');

router.get('/', (req, res)=>{
    res.send(' USER SIDE')
}
)

// request for password resset with email
router.post('/requestPasswordReset', requestNewPassword.requestPasswordReset);

////// verify OTP sent to email
router.post('/verifyPasswordOtp', requestNewPassword.verifyOTP);

////// Update pasword
router.put('/updatePassword', requestNewPassword.resetPassword);







module.exports = router;
