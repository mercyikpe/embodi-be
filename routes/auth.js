// src/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, verifyAdmin, verifyDoctor, verifyUser} = require('../middleware/authMiddleware');
const {authValidator} = require("../validators/auth");
const runValidation = require("../validators");

router.get('/', (req, res)=>{
    res.send(' running here')
}
)

// User registration route
router.post('/register', authValidator, runValidation,  authController.registerUser);

// User login route
router.post('/login', authController.loginUser);

// REQUEST FOR NEW OTP
router.post('/requestotp', authController.requestOTP);

/// verify Otp
router.post('/verifyotp', authController.verifyOTP);

// Protected route that requires token verification
router.get('/protected', verifyToken, (req, res) => {
    // This route will only be accessible if the token is valid
    // The user's information is available in req.user
    res.json({ message: 'You have access to this protected route!', user: req.user });
  });

  router.post('/logout', verifyToken, async (req, res) => {
    try {
      // Invalidate the access token and refresh token
      await User.findByIdAndUpdate(req.user.id, {
        isValid: false,
        refreshToken: null
      });
  
      // Redirect the user to the home page
      res.redirect('/');
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'An error occurred while logging out' });
    }
  });

  router.post('/refresh', verifyToken, async (req, res) => {
    try {
      // Get the refresh token from the request body
      const refreshToken = req.body.refreshToken;
  
      // Find the user record by the refresh token
      const user = await User.findOne({ refreshToken });
  
      // If the user record exists, then generate a new access token
      if (user) {
        const newAccessToken = jwt.sign({ id: user.id }, process.env.JWT_SEC_KEY);
  
        // Return the new access token to the user
        res.json({ accessToken: newAccessToken });
      } else {
        // The refresh token is invalid
        res.status(401).json({ message: 'Invalid refresh token' });
      }
    } catch (err) {
      res.status(500).json({ message: 'An error occurred while refreshing the token' });
    }
  });

// User Google sign-in route
//router.post('google-signin', authController.googleSignIn);



module.exports = router;
