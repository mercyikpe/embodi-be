const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const createError = require('../utilities/createError');
const User = require('../models/User');
const transporter = require('../utilities/transporter')
const OTPCode = require('../models/OtpCode'); // Add this line to import the OtpCode model
require('dotenv').config();


//const { googleAuthConfig, getGoogleProfile } = require('../../utility/googleAuth'); // Import Google Auth utility functions

const generateOTPCode = () => {
  const digits = '0123456789';
  let otpCode = '';
  for (let i = 0; i < 6; i++) {
    otpCode += digits[Math.floor(Math.random() * 10)];
  }
  return otpCode;
};

// const registerUser = async (req, res) => {
//   const { firstName, lastName, phoneNumber, email, password } = req.body;
//
//   if (!firstName || !lastName || !phoneNumber || !email || !password) {
//     return res.status(400).json({
//       status: 'failed',
//       message: 'Fields cannot be blank',
//     });
//   }
//
//   const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[!@#$%^&*]).{8,}$/;
//   if (!passwordRegex.test(password)) {
//     return res.status(400).json({
//       status: 'failed',
//       message:
//           'Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, and a special character.',
//     });
//   }
//
//   try {
//     console.log('Creating a new user instance...');
//     const newUser = new User({
//       firstName,
//       lastName,
//       phoneNumber,
//       email,
//       password,
//     });
//
//     console.log('Saving the user to the database...');
//     const savedUser = await newUser.save();
//
//     console.log('New user saved:', savedUser);
//
//     // Send OTP code to user's email
//     const otpCode = generateOTPCode();
//
//     // Set the expiration time to 10 minutes from now
//     const expirationTime = new Date(Date.now() + 10 * 60 * 1000);
//
//     // Save OTP code to database (you need to define the OTPCode model accordingly)
//     const otpCodeRecord = new OTPCode({
//       userId: savedUser._id,
//       code: otpCode,
//       createdAt: Date.now(),
//       expiresAt: expirationTime,
//     });
//     await otpCodeRecord.save();
//
//     // Prepare and send the email
//     const mailOptions = {
//       from: process.env.AUTH_EMAIL,
//       to: savedUser.email, // Use savedUser.email, not existingUser.email
//       subject: 'Verify Your Email',
//       html: `
//         <h1>Email Verification</h1>
//         <p><strong>${otpCode}</strong></p>
//         <p>Please enter the verification code in your account settings to verify your email.</p>
//       `,
//     };
//
//     transporter.sendMail(mailOptions, (error, info) => {
//       if (error) {
//         console.log('Error sending email:', error);
//       } else {
//         console.log('Email sent: ' + info.response);
//       }
//     });
//
//     return res.status(200).json({
//       status: 'success',
//       message: 'OTP sent to your email.',
//     });
//   } catch (error) {
//     console.log('Error while saving the user:', error);
//     return res.status(500).json({
//       status: 'failed',
//       message: 'An error occurred while signing up.',
//     });
//   }
// };

const registerUser = async (req, res) => {
  const { firstName, lastName, phoneNumber, email, password } = req.body;

  if (!firstName || !lastName || !phoneNumber || !email || !password) {
    return res.status(400).json({
      status: 'failed',
      message: 'Fields cannot be blank',
    });
  }

  const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[!@#$%^&*]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      status: 'failed',
      message:
          'Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, and a special character.',
    });
  }

  try {
    console.log('Creating a new user instance...');
    // Hash the password before saving to the database
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the number of salt rounds
    const newUser = new User({
      firstName,
      lastName,
      phoneNumber,
      email,
      password: hashedPassword, // Store the hashed password in the database
    });

    console.log('Saving the user to the database...');
    const savedUser = await newUser.save();

    console.log('New user saved:', savedUser);

    // ... (rest of the code for sending the OTP and response) ...

  } catch (error) {
    console.log('Error while saving the user:', error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while signing up.',
    });
  }
};


const registerUsers = async (req, res) => {
  const { firstName, lastName, phoneNumber, email, password } = req.body;

  if (!firstName || !lastName || !phoneNumber || !email || !password) {
    return res.status(400).json({
      status: 'failed',
      message: 'Fields cannot be blank',
    });
  }

  const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[!@#$%^&*]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      status: 'failed',
      message:
        'Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, and a special character.',
    });
  }

  try {
    const existingUser = await User.findOne({ $or: [{ phoneNumber }, { email }] });

    if (existingUser && !existingUser.verified) {
      // Send OTP code to user's email
      const otpCode = generateOTPCode();

      // Set the expiration time to 10 minutes from now
      const expirationTime = new Date(Date.now() + 10 * 60 * 1000);

      // Save OTP code to database
      const otpCodeRecord = new OTPCode({
        userId: existingUser._id,
        code: otpCode,
        createdAt: Date.now(),
        expiresAt: expirationTime,
      });
      await otpCodeRecord.save();

      const mailOptions = {
        from: process.env.AUTH_EMAIL,
        to: existingUser.email,
        subject: 'Verify Your Email',
        html: `
          <h1>Email Verification</h1>
          <p><strong>${otpCode}</strong></p>
          <p>Please enter the verification code in your account settings to verify your email.</p>
        `,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });

      return res.status(200).json({
        status: 'success',
        message: 'OTP sent to your email.',
      });
    } else {
      return res.status(400).json({
        status: 'failed',
        message: 'Email or Phone is already in use.',
      });
    }
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
    const { email, phoneNumber, password } = req.body;

    if (!email && !phoneNumber) {
      return res.status(400).json({
        status: 'failed',
        message: 'Phone or email field is required',
      });
    }

    const user = await User.findOne({ $or: [{ phoneNumber }, { email }] });
    if (!user) {
      return res.status(404).json({
        status: 'failed',
        message: 'User not found',
      });
    }

    console.log('Comparing password...');
    console.log('Stored Hashed Password:', user.password);
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log('Invalid password provided:', password);
      return res.status(400).json({
        status: 'failed',
        message: 'Invalid password',
      });
    }

    if (!user.verified) {
      return res.status(400).json({
        status: 'failed',
        message: 'Please verify your email before signing in',
      });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SEC_KEY, { expiresIn: '1h' });
    const { isAdmin, ...otherDetails } = user._doc;

    return res.status(200).json({
      status: 'success',
      message: 'Successfully signed in',
      token,
      user: otherDetails,
    });
  } catch (error) {
    console.log(error); // Log the error for debugging purposes
    return res.status(500).json({
      status: 'failed',
      message: 'Internal server error',
    });
  }
};

  const loginUserr = async (req, res, next) => {
    try {
      const { email, phoneNumber, password } = req.body;
  
      if (!email && !phoneNumber) {
        return res.status(400).json({
          status: 'failed',
          message: 'Phone or email field is required',
        });
      }
  
      const user = await User.findOne({ $or: [{ phoneNumber }, { email }] });
      if (!user) {
        return res.status(404).json({
          status: 'failed',
          message: 'User not found',
        });
      }
  
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(400).json({
          status: 'failed',
          message: 'Invalid password',
        });
      }
  
      if (!user.verified) {
        return res.status(400).json({
          status: 'failed',
          message: 'Please verify your email before signing in',
        });
      }
  
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SEC_KEY, { expiresIn: '1h' });
      const { isAdmin, ...otherDetails } = user._doc;
  
      return res.status(200).json({
        status: 'success',
        message: 'Successfully signed in',
        token,
        user: otherDetails,
      });
    } catch (error) {
      console.log(error); // Log the error for debugging purposes
      return res.status(500).json({
        status: 'failed',
        message: 'Internal server error',
      });
    }
  };
  

  ////// REQUEST FOR A NEW OTP IF USER DIDNT RECEIVE IT

  const requestOTP = async (req, res) => {
    const { email } = req.body;
  
    // Check if the email is provided
    if (!email) {
      return res.status(400).json({
        status: 'failed',
        message: 'Email cannot be blank',
      });
    }
  
    try {
      // Check if the user with the provided email exists and is unverified
      const existingUser = await User.findOne({ email, verified: false });
  
      if (!existingUser) {
        return res.status(400).json({
          status: 'failed',
          message: 'User with the provided email not found or already verified.',
        });
      }
  
      // Regenerate a new OTP for the existing unverified user
      const otpCode = generateOTPCode();
      const expirationTime = new Date(Date.now() + 10 * 60 * 1000);
  
      // Save the new OTP code to the database
      const newOTPCode = new OTPCode({
        userId: existingUser._id,
        code: otpCode,
        createdAt: Date.now(),
        expiresAt: expirationTime,
      });
      await newOTPCode.save();
  
      // Resend the OTP to the user's email
      const mailOptions = {
        from: process.env.AUTH_EMAIL,
        to: existingUser.email,
        subject: 'Verify Your Email',
        html: `
          <h1>Email Verification</h1>
          <p><strong>${otpCode}</strong></p>
          <p>Please enter the verification code in your account settings to verify your email.</p>
        `,
      };
  
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
          return res.status(500).json({
            status: 'failed',
            message: 'An error occurred while resending the verification code.',
          });
        } else {
          console.log('Email sent: ' + info.response);
          return res.status(200).json({
            status: 'success',
            message: 'Verification code has been resent. Please check your email.',
          });
        }
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: 'failed',
        message: 'An error occurred while resending the verification code.',
      });
    }
  };
  


const verifyOTP = async (req, res) => {
    // Extract the userId and the verification code from the request body
    const { userId, verificationCode } = req.body;
  
    try {
      const otpCodeRecord = await OTPCode.findOne({ userId });
  
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
        await OtpCode.deleteOne({ userId }); // Delete the record directly from the model
  
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
      await OTPCode.deleteOne({ userId });
  
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
  requestOTP,
  verifyOTP,
  //loginWithGoogle,
};

module.exports = authController;
