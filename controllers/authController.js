const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const createError = require("../utilities/createError");
const DoctorInfo = require("../models/DoctorInfo");
const User = require("../models/User");
const transporter = require("../utilities/transporter");
const OTPCode = require("../models/OtpCode"); // Add this line to import the OtpCode model
require("dotenv").config();
const { createTransporter, sendEmail } = require("../utilities/transporter"); // Import the emailUtils module

//const { googleAuthConfig, getGoogleProfile } = require('../../utility/googleAuth'); // Import Google Auth utility functions

const generateOTPCode = () => {
  const digits = "0123456789";
  let otpCode = "";
  for (let i = 0; i < 6; i++) {
    otpCode += digits[Math.floor(Math.random() * 10)];
  }
  return otpCode;
};

const registerUser = async (req, res) => {
  const { firstName, lastName, phoneNumber, email, password } = req.body;

  try {

    // Check if the user with the given email already exists
    let user = await User.findOne({ email });

    if (user) {
      if (user.verified) {
        
        // Remove the password field from the user object before sending the response
        delete user.password;

        return res.status(400).json({
          status: 'failed',
          message: 'User already exists and is verified.',
          user: user,
        });
      }

      // Resend OTP for account verification
      const otpCode = generateOTPCode();

      // Set the expiration time to 10 minutes from now
      const expirationTime = new Date(Date.now() + 10 * 60 * 1000);

      // Save OTP code to database
      const otpCodeRecord = new OTPCode({
        userId: user._id,
        code: otpCode,
        createdAt: Date.now(),
        expiresAt: expirationTime,
      });
      await otpCodeRecord.save();

      // Prepare and send the email using the transporter and sendEmail function
      const mailOptions = {
        from: process.env.AUTH_EMAIL,
        to: user.email,
        subject: "Verify Your Email",
        html: `
          <h1>Email Verification</h1>
          <h3>Welcome ${lastName}, </h3>
          <p>Please enter the verification code to continue.</p>
          <h2><strong>${otpCode}</strong></h2>
        `,
      };

      await transporter.sendMail(mailOptions);

      return res.status(200).json({
        status: 'success',
        message: 'Account already registered, new OTP sent for verification.',
        user: user,
      });
    }

    // If the user does not exist, create a new user and set their verified status to false
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the number of salt rounds
    const newUser = new User({
      firstName,
      lastName,
      phoneNumber,
      email,
      password: hashedPassword,
      verified: false,
    });

    const savedUser = await newUser.save();

    // Send OTP code to user's email
    const otpCode = generateOTPCode();

    // Set the expiration time to 10 minutes from now
    const expirationTime = new Date(Date.now() + 10 * 60 * 1000);

    // Save OTP code to database
    const otpCodeRecord = new OTPCode({
      userId: savedUser._id,
      code: otpCode,
      createdAt: Date.now(),
      expiresAt: expirationTime,
    });
    await otpCodeRecord.save();

    // Prepare and send the email using the transporter and sendEmail function
    const mailOptions = {
      from: process.env.AUTH_EMAIL,
      to: savedUser.email,
      subject: "Verify Your Email",
      html: `
      <h1>Email Verification</h1>
      <p> Welcome ${lastName}, Please enter the verification code to continue.</p>
      <h3><strong>${otpCode}</strong></h3>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      status: 'success',
      message: 'Sign up successful, OTP sent for verification.',
      user: savedUser,
    });
  } catch (error) {
    console.error('Error while registering user:', error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while signing up. Please try again.',
    });
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({
        status: "failed",
        message: "Email field is required",
      });
    }

    let user = await User.findOne({ email }).populate({
      path: "doctorInfo",
      model: "DoctorInfo",
      populate: {
        path: "user",
        model: "User",
      },
    });

    if (!user) {
      return res.status(404).json({
        status: "failed",
        message: "User not found",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({
        status: "failed",
        message: "Invalid password",
      });
    }

    if (!user.verified) {
      return res.status(400).json({
        status: "failed",
        message: "Please verify your email before signing in",
      });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SEC_KEY, {
      expiresIn: "24h",
    });

    let userDetails = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      status: user.status,
      verifyBadge: user.verifyBadge,
      verified: user.verified,
      image: user.image,
      dob: user.dob,
      address: user.address,
      gender: user.gender,
      allergies: user.allergies,
      disease: user.disease,
      questionaire: user.questionaire,
      bookedAppointments: user.bookedAppointments,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    if (user.role === "isDoctor") {
      // Fetch the doctorInfo and add its data to userDetails
      const doctorInfo = await DoctorInfo.findOne({ user: user._id });

      // If doctorInfo doesn't exist, create it
      if (!doctorInfo) {
        const newDoctorInfo = new DoctorInfo({ user: user._id });
        await newDoctorInfo.save();
        doctorInfo = newDoctorInfo;
      }

      userDetails.doctorId = doctorInfo._id;
      userDetails.qualification = doctorInfo.qualification;
      userDetails.specialty = doctorInfo.specialty;
      userDetails.yearOfExperience = doctorInfo.yearOfExperience;
      userDetails.rate = doctorInfo.rate;
      userDetails.bio = doctorInfo.bio;
      userDetails.bankName = doctorInfo.bankName;
      userDetails.accountName = doctorInfo.accountName;
      userDetails.accountNumber = doctorInfo.accountNumber;
    }

    return res.status(200).json({
      status: "success",
      message: "Successfully signed in",
      token,
      user: userDetails,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "failed",
      message: "Internal server error",
    });
  }
};


////// REQUEST FOR A NEW OTP IF USER DIDNT RECEIVE IT
const requestOTP = async (req, res) => {
  const { email } = req.body;

  // Check if the email is provided
  if (!email) {
    return res.status(400).json({
      status: "failed",
      message: "Email cannot be blank",
    });
  }

  try {
    // Check if the user with the provided email exists and is unverified
    const existingUser = await User.findOne({ email, verified: false });

    if (!existingUser) {
      return res.status(400).json({
        status: "failed",
        message: "User with the provided email not found or already verified.",
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
      subject: "Verify Your Email",
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
          status: "failed",
          message: "An error occurred while resending the verification code.",
        });
      } else {
        console.log("Email sent: " + info.response);
        return res.status(200).json({
          status: "success",
          message:
            "Verification code has been resent. Please check your email.",
        });
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "failed",
      message: "An error occurred while resending the verification code.",
    });
  }
};


const verifyOTP = async (req, res) => {
  // Extract the userId and the verification code from the request body
  const { userId, verificationCode } = req.body;

  try {
    const otpCodeRecord = await OTPCode.findOne({ userId });

    if (!otpCodeRecord) {
      return res.status(400).json({
        status: "failed",
        message: "Invalid verification code.",
      });
    }

    if (otpCodeRecord.expiresAt < Date.now()) {
      await OTPCode.deleteOne({ userId });
      return res.status(400).json({
        status: "failed",
        message: "Verification code has expired. Please sign up again.",
      });
    }

    const isMatch = verificationCode === otpCodeRecord.code;

    if (!isMatch) {
      return res.status(400).json({
        status: "failed",
        message: "Invalid verification code.",
      });
    }

    // Mark the user as verified (you can add this field to your User model)
    await User.updateOne({ _id: userId }, { verified: true });

    // Retrieve the user data after successful account verification
    const user = await User.findOne({ _id: userId });

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SEC_KEY, {
      expiresIn: "24h",
    });

    return res.status(200).json({
      status: "success",
      message: "Account verification successful.",
      token,
      user
    });
  } catch (error) {
    console.error("Error while verifying the account:", error);
    return res.status(500).json({
      status: "failed",
      message: "An error occurred while verifying the account.",
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
