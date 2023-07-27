const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
//const createError = require('../utilities/createError');
const User = require('../models/User');
const trasnporter = require('../utilities/transporter')
//const OtpCode = require('../../models/user/OtpCode');
//const { googleAuthConfig, getGoogleProfile } = require('../../utility/googleAuth'); // Import Google Auth utility functions

const generateOTPCode = () => {
  const digits = '0123456789';
  let otpCode = '';
  for (let i = 0; i < 6; i++) {
    otpCode += digits[Math.floor(Math.random() * 10)];
  }
  return otpCode;
};

const registerUser = async (req, res) => {
  const { firstName, lastName, phoneNumber, email, password } = req.body;

  // Check if any of the fields are empty
  if (!firstName || !lastName || !phoneNumber || !email || !password) {
    return res.status(400).json({
      status: 'failed',
      message: 'Fields cannot be blank'
    });
  }

  // Password requirements
  const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[!@#$%^&*]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      status: 'failed',
      message: 'Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, and a special character.',
    });
  }

  try {
    const existingUser = await User.findOne({ $or: [{ phoneNumber }, { email }] });

    if (existingUser) {
      return res.status(400).json({
        status: 'failed',
        message: 'Email or Phhone is already exist.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      firstName,
      lastName,
      phoneNumber,
      email,
      password: hashedPassword,
    });

    const savedUser = await newUser.save();

    // Send verification OTP
    const otpCode = generateOTPCode();
    const otpCodeRecord = new OtpCode({
      userId: savedUser._id,
      code: otpCode,
      createdAt: Date.now(),
      expiresAt: Date.now() + 600000, // 10 minutes
    });
    await otpCodeRecord.save();

    // You can send the OTP to the user's email here if needed
    

    return res.status(200).json({
      status: 'success',
      message: 'Signup successful. Please verify your email using the OTP.',
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while signing up.',
    });
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;

    if (!username && !email) {
      return res.status(400).json({
        status: 'failed',
        message: 'Username or email field is required',
      });
    }

    const user = await User.findOne({ $or: [{ username }, { email }] });
    if (!user) {
      return res.status(500).json({
        status: 'failed',
        message: 'Wrong username or email',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(500).json({
        status: 'failed',
        message: 'Wrong password',
      });
    }

    if (!user.verified) {
      return res.status(400).json({
        status: 'failed',
        message: 'Please verify your email before signing in',
      });
    }

    const token = jwt.sign({ userId: user._id }, process.env.PASS_SEC, { expiresIn: '1h' });
    const { isAdmin, ...otherDetails } = user._doc;

    return res.status(200).json({
      status: 'success',
      message: 'Successfully signed in',
      token,
      user: otherDetails,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'failed',
      message: 'Internal server error',
    });
  }
};

const verifyOTP = async (req, res) => {
  // Extract the userId and the verification code from the request body
  const { userId, verificationCode } = req.body;

  try {
    const otpCodeRecord = await OtpCode.findOne({ userId });

    if (!otpCodeRecord) {
      // No OTP record found for the user
      return res.status(400).json({
        status: 'failed',
        message: 'Invalid verification code.',
      });
    }

    // Check if the OTP code has expired
    if (otpCodeRecord.expiresAt < Date.now()) {
      // If the OTP code has expired, delete the OTP record and inform the user
      await otpCodeRecord.delete();

      return res.status(400).json({
        status: 'failed',
        message: 'Verification code has expired. Please sign up again.',
      });
    }

    // Compare the verification code with the stored OTP code
    const isMatch = verificationCode === otpCodeRecord.code;

    if (!isMatch) {
      // Incorrect verification details
      return res.status(400).json({
        status: 'failed',
        message: 'Invalid verification code.',
      });
    }

    // Mark the user as verified (you can add this field to your User model)
    await User.updateOne({ _id: userId }, { verified: true });

    // Delete the OTP record
    await otpCodeRecord.delete();

    return res.status(200).json({
      status: 'success',
      message: 'Account verification successful.',
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while verifying the account.',
    });
  }
};


/*

// Login with Google
const loginWithGoogle = async (req, res, next) => {
  try {
    // Authenticate the user with the Google token
    const { token } = req.body;
    const profile = await getGoogleProfile(token);

    // Check if the user exists in the database
    let user = await User.findOne({ email: profile.email });

    // If the user does not exist, create a new user account
    if (!user) {
      user = new User({
        username: profile.name,
        email: profile.email,
        password: '', // Since the user is logging in with Google, we can set an empty password
        verified: true, // We assume that the user's email is already verified by Google
      });

      user = await user.save();
    }

    // Create and send the JWT token
    const token = jwt.sign({ userId: user._id }, process.env.PASS_SEC, { expiresIn: '1h' });
    const { isAdmin, ...otherDetails } = user._doc;

    return res.status(200).json({
      status: 'success',
      message: 'Successfully logged in with Google',
      token,
      user: otherDetails,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'failed',
      message: 'Google login failed',
    });
  }
};
*/
const authController = {
  registerUser,
  loginUser,
  verifyOTP,
  //loginWithGoogle,
};

module.exports = authController;
