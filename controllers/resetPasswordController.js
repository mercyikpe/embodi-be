const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const createError = require('../utilities/createError');
const User = require('../models/User');
const transporter = require('../utilities/transporter');
const OTPCode = require('../models/OtpCode'); // Import the OTPCode model

// CHANGE PASSWORD  when user is logged in
const changePassword = async (req, res) => {
  const { currentPassword, newPassword, userId } = req.body;
  // const userId = req.user.userId; // Make sure 'userId' matches the property name in req.user

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        status: 'failed',
        message: 'User not found. Please log in again.',
      });
    }

    // Verify the current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({
        status: 'failed',
        message: 'Invalid current password. Please enter the correct password.',
      });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the user's password
    await User.findByIdAndUpdate(userId, { password: hashedPassword });

    return res.status(200).json({
      status: 'success',
      message: 'Password changed successfully.',
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while processing your request.',
    });
  }
};

// GENERATE OTP HELPER FUNCTION
const generateOTPCode = () => {
  const digits = '0123456789';
  let otpCode = '';
  for (let i = 0; i < 6; i++) {
    otpCode += digits[Math.floor(Math.random() * 10)];
  }
  return otpCode;
};

// Request Password reset through email
const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        status: 'failed',
        message: 'User not found. Please enter a valid email address.',
      });
    }

    // Generate OTP code
    const otpCode = generateOTPCode();

    // Set the expiration time to 10 minutes from now
    const expirationTime = new Date(Date.now() + 10 * 60 * 1000);

    // Save the OTP code record in the database
    const otpCodeRecord = new OTPCode({
      userId: user._id,
      code: otpCode,
      createdAt: Date.now(),
      expiresAt: expirationTime,
    });
    await otpCodeRecord.save();

    // Send the OTP to the user's email
    const mailOptions = {
      from: process.env.AUTH_EMAIL,
      to: user.email,
      subject: "Password Reset OTP",
      html: `
        <h1>Password Reset OTP</h1>
        <p><strong>${otpCode}</strong></p>
        <p>Please enter the verification code to reset your password. The code will expire after <em>10 minutes</em>.</p>
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res.status(500).json({
          status: "failed",
          message: "An error occurred while sending the password reset OTP.",
        });
      } else {
        console.log("Email sent: " + info.response);
        return res.status(200).json({
          status: "success",
          message: "Password reset OTP has been sent to your email address. Please check your email.",
        });
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: "failed",
      message: "An error occurred while sending the password reset OTP.",
    });
  }
};

// Verify otp and reset password
const verifyOTPAndPasswordReset = async (req, res) => {
  const { email, verificationCode, newPassword } = req.body;

  try {
    // Check if the user with the provided email exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        status: "failed",
        message: "User with the provided email not found.",
      });
    }

    // Check if there is a valid OTP record for the user
    const otpCodeRecord = await OTPCode.findOne({ userId: user._id });

    if (!otpCodeRecord) {
      return res.status(400).json({
        status: "failed",
        message: "Invalid OTP or OTP has expired. Please request a new OTP.",
      });
    }

    // Check if the OTP is expired
    if (otpCodeRecord.expiresAt < Date.now()) {
      await OTPCode.deleteOne({ userId: user._id });
      return res.status(400).json({
        status: "failed",
        message: "OTP has expired. Please request a new OTP for password reset.",
      });
    }

    // Check if the OTP matches the provided verification code
    if (verificationCode !== otpCodeRecord.code) {
      return res.status(400).json({
        status: "failed",
        message: "Invalid OTP code. Please enter a valid code.",
      });
    }

    // Update the user's password with the new password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    // Remove the used OTP record
    await OTPCode.deleteOne({ userId: user._id });

    return res.status(200).json({
      status: "success",
      message: "Password reset successful. You can now login with your new password.",
    });
  } catch (error) {
    return res.status(500).json({
      status: "failed",
      message: "An error occurred while resetting the password.",
    });
  }
};

// const verifyOTP = async (req, res) => {
//   const { userId, email, otpCode } = req.body;
//
//   try {
//     // Find the user by email
//     const user = await User.findOne({ email } || {userId});
//
//     if (!user) {
//       return res.status(404).json({
//         status: 'failed',
//         message: 'User not found. Please enter a valid email address.',
//       });
//     }
//
//     // Find the OTP code record associated with the user
//     const otpCodeRecord = await OTPCode.findOne({ userId: user._id, code: otpCode });
//
//     if (!otpCodeRecord) {
//       return res.status(400).json({
//         status: 'failed',
//         message: 'Invalid OTP code. Please enter the correct code.',
//       });
//     }
//
//     // Check if the OTP code has expired
//     if (otpCodeRecord.expiresAt < Date.now()) {
//       // If the OTP code has expired, delete the OTP record and inform the user
//       await OTPCode.deleteOne({ userId: user._id });
//
//       return res.status(400).json({
//         status: 'failed',
//         message: 'OTP code has expired. Please request a new one.',
//       });
//     }
//
//     // If the OTP code is valid and not expired, proceed with the reset password flow
//     return res.status(200).json({
//       status: 'success',
//       message: 'Valid OTP code. You can now proceed to reset your password.',
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({
//       status: 'failed',
//       message: 'An error occurred while processing your request.',
//     });
//   }
// };


// const resetPassword = async (req, res) => {
//   const { email, newPassword } = req.body;
//
//   try {
//     // Find the user by email
//     const user = await User.findOne({ email });
//
//     if (!user) {
//       return res.status(404).json({
//         status: 'failed',
//         message: 'User not found. Please enter a valid email address.',
//       });
//     }
//
//     // Check if the user has a valid OTP code record (OTP code has been verified)
//     const otpCodeRecord = await OTPCode.findOne({ userId: user._id });
//
//     if (!otpCodeRecord) {
//       return res.status(400).json({
//         status: 'failed',
//         message: 'OTP verification is required before resetting the password.',
//       });
//     }
//
//     // Check if the OTP code has expired
//     if (otpCodeRecord.expiresAt < Date.now()) {
//       // If the OTP code has expired, delete the OTP record and inform the user
//       await OTPCode.deleteOne({ userId: user._id });
//
//       return res.status(400).json({
//         status: 'failed',
//         message: 'OTP code has expired. Please request a new one.',
//       });
//     }
//
//     // If the OTP code is valid and not expired, proceed with updating the password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(newPassword, salt);
//
//     // Update the user's password
//     await User.updateOne({ _id: user._id }, { password: hashedPassword });
//
//     // Delete the OTP record
//     await OTPCode.deleteOne({ userId: user._id });
//
//     return res.status(200).json({
//       status: 'success',
//       message: 'Password reset successful. You can now login with your new password.',
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({
//       status: 'failed',
//       message: 'An error occurred while processing your request.',
//     });
//   }
// };

///////////////////////RESET PASSWORD WITH OTP ENDS HERE


module.exports = {
  changePassword,
  requestPasswordReset,
  verifyOTPAndPasswordReset
};


