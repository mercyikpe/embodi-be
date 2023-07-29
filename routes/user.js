// src/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const requestNewPassword = require('../controllers/resetPasswordControllers');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', (req, res)=>{
    res.send(' USER SIDE')
}
)

///// USER UPDATE PASSWORD
// Change Password
router.post('/changePassword', verifyToken,  requestNewPassword.changePassword);


///////USER RESET PASSWORD STARTS HERE
///////////////////////////////////////////////////////////////////////////////////

// request for password resset with email
router.post('/requestPasswordReset', requestNewPassword.requestPasswordReset);

////// verify OTP sent to email
router.post('/verifyPasswordOtp', requestNewPassword.verifyOTP);

////// Update pasword
router.put('/updatePassword', requestNewPassword.resetPassword);

///////USER RESET PASSWORD ENDS HERE






module.exports = router;
