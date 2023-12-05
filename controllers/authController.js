const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const createError = require("../utilities/createError");
const DoctorInfo = require("../models/DoctorInfo");
const User = require("../models/User");
const transporter = require("../utilities/transporter");
const OTPCode = require("../models/OtpCode"); // Add this line to import the OtpCode model
require("dotenv").config();
const { LoginTicket, OAuth2Client } = require("google-auth-library");

const oAuth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "postmessage"
);

// POST api/users/auth/google
// Auth user with google
const googleAuth = async (req, res, next) => {
  try {
    if (!req.body.code) {
      throw createError(
        400,
        "No Google credential found. Please try again later."
      );
    }
    const { tokens } = await oAuth2Client.getToken(req.body.code);
    const idToken = tokens.id_token;

    // Ensure that idToken is not null or undefined
    if (!idToken) {
      throw createError(400, "Invalid Google token");
    }

    // Verify the credential
    const ticket = await oAuth2Client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    // access the payload using the getPayload method
    const payload = ticket.getPayload();

    if (!payload) {
      throw createError(400, "Invalid Google token payload");
    }

    const { email_verified, given_name, family_name, name, email, picture } =
      payload;

    const user = await User.findOne({ email });

    if (email_verified) {
      if (user) {
        // Remove the password field from the user object
        const userWithoutPassword = { ...user.toObject() };
        delete userWithoutPassword.password;

        return res.status(200).json({
          status: "success",
          message: "Successfully logged in with Google",
          user: userWithoutPassword,
        });
      } else {
        // Generate a password for the user using bcrypt
        const password = bcrypt.genSaltSync(10);

        // Hash the password using bcrypt
        const hashedPassword = bcrypt.hashSync(password, 10);

        const newUser = new User({
          firstName: given_name,
          lastName: family_name,
          email,
          phone: phoneNumber,
          password: hashedPassword,
          image: picture,
        });

        const createdUser = await newUser.save();

        if (!createdUser) {
          throw createError(500, "Account not created with Google");
        }

        // Remove the password field from the user object
        const userWithoutPassword = { ...createdUser.toObject() };
        delete userWithoutPassword.password;

        return res.status(200).json({
          status: "success",
          message: "Successfully logged in with Google",
          user: userWithoutPassword,
        });
      }
    }
  } catch (error) {
    next(error);
  }
};

// Helper function to generate OTP code
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
    // Check if the user with the given phone number already exists
    const existingUser = await User.findOne({ phoneNumber });

    if (existingUser) {
      return res.status(400).json({
        status: "failed",
        message: "Phone number already exists.",
      });
    }

    // Check if the user with the given email already exists
    let user = await User.findOne({ email });

    if (user) {
      if (user.verified) {
        // User is already verified
        delete user.password;
        return res.status(400).json({
          status: "failed",
          message: "User already exists and is verified.",
          user: user,
        });
      }

      // Resend OTP for account verification
      return resendOTP(user, res);
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

    // Send OTP for account verification
    return sendOTP(savedUser, res);
  } catch (error) {
    return res.status(500).json({
      status: "failed",
      message: "An error occurred while signing up. Please try again.",
    });
  }
};

const sendOTP = async (user, res) => {
  const otpCode = generateOTPCode();
  const expirationTime = new Date(Date.now() + 10 * 60 * 1000); // Set the expiration time to 10 minutes from now

  const newOTPCode = new OTPCode({
    userId: user._id,
    code: otpCode,
    createdAt: Date.now(),
    expiresAt: expirationTime,
  });
  await newOTPCode.save();

  const mailOptions = {
    from: process.env.AUTH_EMAIL,
    to: user.email,
    subject: "Verify Your Email",
    html: `
      <h1>Email Verification</h1>
      <p>Welcome ${user.lastName},</p>
      <p>Please enter the verification code to continue. The code will expire after <em>10 minutes</em>.</p>
      <h2><strong>${otpCode}</strong></h2>
    `,
  };

  await transporter.sendMail(mailOptions);

  const userWithoutPassword = { ...user._doc };
  delete userWithoutPassword.password;

  return res.status(200).json({
    status: "success",
    message: "Sign up successful, OTP sent for verification.",
    user: userWithoutPassword,
  });
};

const resendOTP = async (user, res) => {
  const otpCode = generateOTPCode();
  const expirationTime = new Date(Date.now() + 10 * 60 * 1000); // Set the expiration time to 10 minutes from now

  const otpCodeRecord = await OTPCode.findOne({ userId: user._id });

  if (otpCodeRecord) {
    // Update the existing OTP record
    otpCodeRecord.code = otpCode;
    otpCodeRecord.expiresAt = expirationTime;
    otpCodeRecord.used = false;
    await otpCodeRecord.save();
  } else {
    // Save a new OTP code to the database
    const newOTPCode = new OTPCode({
      userId: user._id,
      code: otpCode,
      createdAt: Date.now(),
      expiresAt: expirationTime,
    });
    await newOTPCode.save();
  }

  const mailOptions = {
    from: process.env.AUTH_EMAIL,
    to: user.email,
    subject: "Verify Your Email",
    html: `
      <h1>Email Verification</h1>
      <p>Welcome ${user.lastName},</p>
      <p>Please enter the verification code in your account settings to verify your email. The code will expire after <em>10 minutes</em>.</p>
      <h2><strong>${otpCode}</strong></h2>
    `,
  };

  await transporter.sendMail(mailOptions);

  const userWithoutPassword = { ...user._doc };
  delete userWithoutPassword.password;

  return res.status(200).json({
    status: "success",
    message: "Verification code has been resent. Please check your email.",
    user: { id, email }
  });
};

////// REQUEST FOR A NEW OTP IF USER DIDNT RECEIVE IT
const requestOTP = async (req, res) => {
  const { email } = req.body;

  try {
    // Check if the user with the provided email exists and is unverified
    const existingUser = await User.findOne({ email, verified: false });

    if (!existingUser) {
      return res.status(400).json({
        status: "failed",
        message: "User with the provided email not found or already verified.",
      });
    }

    // Call the resendOTP function by passing the user and response objects
    return resendOTP(existingUser, res);
  } catch (error) {
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
        message: "Verification code has expired. Please request Otp again.",
      });
    }

    if (otpCodeRecord.used) {
      return res.status(400).json({
        status: "failed",
        message: "Verification code has already been used.",
      });
    }

    const isMatch = verificationCode === otpCodeRecord.code;

    if (!isMatch) {
      return res.status(400).json({
        status: "failed",
        message: "Invalid verification code.",
      });
    }

    // Mark the OTP code as used
    otpCodeRecord.used = true;
    await otpCodeRecord.save();

    // Mark the user as verified
    await User.updateOne({ _id: userId }, { verified: true });

    // Retrieve the user data after successful account verification
    const user = await User.findOne({ _id: userId });

    // Generate a JWT token for the user
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SEC_KEY, {
      expiresIn: "24h",
    });

    // Exclude the password field from the user object in the response
    const userWithoutPassword = { ...user._doc };
    delete userWithoutPassword.password;

    return res.status(200).json({
      status: "success",
      message: "Account verification successful.",
      token,
      user: userWithoutPassword,
      // user
    });
  } catch (error) {
    return res.status(500).json({
      status: "failed",
      message: "An error occurred while verifying the account.",
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
      avatar: user.avatar,
      // image: user.image,
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
    // console.log(error);
    return res.status(500).json({
      status: "failed",
      message: "Internal server error",
    });
  }
};

const authController = {
  registerUser,
  loginUser,
  requestOTP,
  verifyOTP,
  googleAuth,
};

module.exports = authController;
