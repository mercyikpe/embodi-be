const User = require("../models/User");
const DoctorInfo = require("../models/DoctorInfo");
const transporter = require("../utilities/transporter");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
//const DoctorInfo = require('../models/DoctorInfo');

// Function to sign up a user as a doctor

const InviteDoctor = async (req, res) => {
  const { email, adminUserId } = req.body;

  try {
    // Check if the user with the given email already exists
    let user = await User.findOne({ email });

    if (user) {
      // Check if the user is already a doctor and is verified
      if (user.role === "isDoctor" && user.verified) {
        return res.json({
          status: 200,
          message: "Doctor was already invited and verified.",
        });
      }

      // If the user exists, update their role to 'isDoctor' and save the user
      user.role = "isDoctor";
      await user.save();

      // Send an email notifying the user that they are now a doctor
      const mailOptions = {
        from: transporter.options.auth.user,
        // from: "Your Email <youremail@gmail.com>",
        to: email,
        subject: "Congratulations! You are now a doctor",
        html: "<p>You have been verified as a doctor.</p>",
      };

      await transporter.sendMail(mailOptions);

      return res.json({
        status: 200,
        message: "Doctor created successfully.",
      });
    } else {
      // If the user does not exist, create a new user with role 'isDoctor'
      const doctor = new User({
        email,
        role: "isDoctor",
        phoneNumber: generateRandomPhoneNumber(),
      });

      await doctor.save();

      // Generate a verification token and send it via email
      const verificationToken = jwt.sign(
          { email },
          process.env.JWT_SEC_KEY,
          { expiresIn: "10h" }
      );

      const downloadLink = `https://emboimentapp.com/verify-doctor`;

      const mailOptions = {
        from: transporter.options.auth.user,
        // from: "Your Email <youremail@gmail.com>",
        to: email,
        subject: "You have been Invited",
        html: `<p>Congratulations, you have been invited as a Doctor on Embodiment. Please Download the Embodiment Health app and register with the following info:</p>
        
        <p>Email: <b>${email}</b></p>
        <a href="${downloadLink}">Click here to download the app</a> 
        
        <p>Or copy this link ${downloadLink} and paste in yur broswer to download the app.</p>`
      }

      await transporter.sendMail(mailOptions);

      return res.json({
        status: 201,
        message: "Verification email sent. Please verify your doctor account.",
      });
    }
  } catch (error) {
    console.log("Error inviting doctor:", error);
    return res.status(500).json({
      status: "failed",
      message: "An error occurred while inviting the doctor.",
    });
  }
};


function generateRandomPhoneNumber() {
  // generate a random 10-digit number
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}


const signUpAsDoctors = async (req, res) => {
  const { email, adminUserId } = req.body;

  try {
    // Check if the user making the request is an admin
    // const adminUser = await User.findById(adminUserId);
    //
    // if (!adminUser || adminUser.role !== "isAdmin") {
    //   return res.status(403).json({
    //     status: "failed",
    //     message: "You do not have permission to sign up doctors.",
    //   });
    // }

    // Check if the user with the given email already exists
    let user = await User.findOne({ email });

    if (user) {
      // If the user exists, update their role to 'isDoctor' and save the user
      user.role = "isDoctor";
      await user.save();

      // Send an email notifying the user that they are now a doctor
      const mailOptions = {
        from: "Your Email <youremail@gmail.com>",
        to: email,
        subject: "Congratulations! You are now a doctor",
        html: "<p>You have been verified as a doctor.</p>",
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log("Error sending verification email:", error);
        } else {
          console.log("Verification email sent:", info.response);
        }
      });

      return res.json({
        status: 200,
        message: "Doctor created successfully.",
      });
    } else {
      // If the user does not exist, create a new user with role 'isDoctor'
      const doctor = new User({
        email,
        role: "isDoctor",
      });

      await doctor.save();

      // Generate a verification token and send it via email
      const verificationToken = jwt.sign(
        { email },
        process.env.JWT_SEC_KEY, // mine is stored in env
        { expiresIn: "10h" }
      );

      const verificationLink = `http://emboimentapp.com/verify-doctor?token=${verificationToken}`;

      const mailOptions = {
        from: "Your Email <youremail@gmail.com>",
        to: email,
        subject: "Verify Your Doctor Account",
        html: `<p>Please click the link below to verify your doctor account:</p><a href="${verificationLink}">${verificationLink}</a>`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log("Error sending verification email:", error);
        } else {
          console.log("Verification email sent:", info.response);
        }
      });

      return res.json({
        status: 200,
        message: "Verification email sent. Please verify your doctor account.",
      });
    }
  } catch (error) {
    console.log("Error signing up as doctor:", error);
    return res.status(500).json({
      status: "failed",
      message: "An error occurred while processing your request.",
    });
  }
};

/////SIGNIN DOCTOR
const doctorSignin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({
        status: "failed",
        message: "Email field is required",
      });
    }

    const user = await User.findOne({ email }).populate({
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
      // Only doctors should have their doctorInfo returned
      const doctorInfo = await DoctorInfo.findOne({ user: user._id });

      if (doctorInfo) {
        userDetails.doctorId = doctorInfo._id;
        userDetails.qualification = doctorInfo.qualification;
        userDetails.specialty = doctorInfo.specialty;
        userDetails.yearOfExperience = doctorInfo.yearOfExperience;
        userDetails.rate = doctorInfo.rate;
        userDetails.bio = doctorInfo.bio;
        userDetails.bankName = doctorInfo.bankName;
        userDetails.accountName = doctorInfo.accountName;
        userDetails.accountNumber = doctorInfo.accountNumber;
      } else {
        // Create doctorInfo entry if not present
        const newDoctorInfo = new DoctorInfo({
          user: user._id,
        });

        await newDoctorInfo.save();
      }
    }

    return res.status(200).json({
      status: "success",
      message: "Doctor successfully signed in",
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

/////////SIGN UP DOCTOR. This is not in use
const signUpAsDoctor = async (req, res) => {
  const { email, adminUserId } = req.body;

  // Check if the request body contains the required fields
  if (!email || !adminUserId) {
    return res.status(400).json({
      status: "failed",
      message: "Please provide the email and adminUserId in the request body.",
    });
  }

  try {
    // Check if the user making the request is an admin
    const adminUser = await User.findById(adminUserId);

    // Check if the user exists and is an admin
    if (!adminUser || !adminUser.role.includes("isAdmin")) {
      return res.status(403).json({
        status: "failed",
        message: "You do not have permission to sign up doctors.",
      });
    }

    // Check if the user with the given email already exists
    let user = await User.findOne({ email });

    if (user) {
      // If the user exists, check if they are already a doctor
      if (user.role.includes("isDoctor")) {
        return res.json({
          status: 200,
          message: "The user is already registered as a doctor.",
        });
      } else {
        // If the user exists but is not a doctor, update their role to 'isDoctor' and save the user
        user.role.push("isDoctor");
        await user.save();

        // Send an email notifying the user that they are now a doctor
        const mailOptions = {
          from: process.env.AUTH_EMAIL,
          to: email,
          subject: "Congratulations! You are now a doctor",
          html: "<p>You have been verified as a doctor. Kindly login to your account to update your information.</p>",
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log("Error sending verification email:", error);
          } else {
            console.log("Verification email sent:", info.response);
          }
        });

        return res.json({
          status: 200,
          message: "Doctor created successfully.",
        });
      }
    } else {
      // If the user does not exist, create a new user and set their role to 'isDoctor'
      const doctor = new User({
        email,
        role: ["isDoctor"],
      });

      await doctor.save();

      // Generate a verification token and send it via email
      const verificationToken = jwt.sign(
        { email },
        process.env.JWT_SEC_KEY, // Replace with secret key// mine is stored in .env
        { expiresIn: "1h" }
      );

      const verificationLink = `http://https://embodie.vercel.app//verifyDoctor?token=${verificationToken}`;

      const mailOptions = {
        from: process.env.AUTH_EMAIL,
        to: email,
        subject: "Verify Your Doctor Account",
        html: `<p>Please click the link below to verify your doctor account:</p><a href="${verificationLink}">${verificationLink}</a>`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log("Error sending verification email:", error);
        } else {
          console.log("Verification email sent:", info.response);
        }
      });

      return res.json({
        status: 200,
        message: "Verification email sent. Please verify your doctor account.",
      });
    }
  } catch (error) {
    console.log("Error signing up as doctor:", error);
    return res.status(500).json({
      status: "failed",
      message: "An error occurred while processing your request.",
    });
  }
};

////// UPDATE DOCTOR'S PROFILE
const updateDoctorInfo = async (req, res, next) => {
  const { userId } = req.params;

  try {
    // Check if the provided phoneNumber already exists in the database
    const existingUserWithPhoneNumber = await User.findOne({
      phoneNumber: req.body.phoneNumber,
    });

    if (
      existingUserWithPhoneNumber &&
      existingUserWithPhoneNumber._id.toString() !== userId
    ) {
      return res.status(400).json({
        status: "failed",
        message: "Phone number already exists.",
      });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== "isDoctor") {
      return res.status(403).json({
        status: "failed",
        message: "User not found or is not authorized as a doctor.",
      });
    }

    const userUpdateData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      dob: req.body.dob,
      address: req.body.address,
      gender: req.body.gender,
      avatar: req.body.avatar,
      allergies: req.body.allergies,
    };

    const updatedUser = await User.findByIdAndUpdate(userId, userUpdateData, {
      new: true,
    }).select("-password");

    const doctorUpdateData = {
      qualification: req.body.qualification,
      placeOfWork: req.body.placeOfWork,
      specialty: req.body.specialty,
      yearOfExperience: req.body.yearOfExperience,
      rate: req.body.rate,
      bio: req.body.bio,
    };

    const updatedDoctorInfo = await DoctorInfo.findOneAndUpdate(
      { user: userId },
      doctorUpdateData,
      { upsert: true, new: true }
    );

    return res.status(200).json({
      status: "success",
      message: "DoctorInfo and User updated successfully.",
      data: { doctorInfo: updatedDoctorInfo, user: updatedUser },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "failed",
      message: "An error occurred while processing your request.",
    });
  }
};

////// update doctors account information
const updateDoctorAccountInfo = async (req, res, next) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user || user.role !== "isDoctor") {
      return res.status(403).json({
        status: "failed",
        message: "User not found or is not authorized as a doctor.",
      });
    }

    const updateData = {
      bankName: req.body.bankName,
      accountName: req.body.accountName,
      accountNumber: req.body.accountNumber,
    };

    const updatedDoctorAccountInfo = await DoctorInfo.findOneAndUpdate(
      { user: userId },
      updateData,
      { upsert: true, new: true } // Added 'new' option to get the updated document
    );

    return res.status(200).json({
      status: "success",
      message: "Doctor Account information updated successfully.",
      data: updatedDoctorAccountInfo,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "failed",
      message: "An error occurred while processing your request.",
    });
  }
};

///// view doctorinfo only using userId
const viewDoctor = async (req, res, next) => {
  const { userId } = req.params;

  try {
    // Find the user by ID and check if they have the 'isDoctor' role
    const user = await User.findById(userId).populate("doctorInfo");
    if (!user || user.role !== "isDoctor") {
      return res.status(403).json({
        status: "failed",
        message: "User not found or is not authorized as a doctor.",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Doctor information found.",
      data: {
        user,
        doctorInfo: user.doctorInfo || null,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "failed",
      message: "An error occurred while processing your request.",
    });
  }
};

const viewDoctorInfo = async (req, res) => {
  const { userId } = req.params;

  try {
    // Check if the user exists and is a doctor
    const user = await User.findById(userId);

    if (!user || user.role !== "isDoctor") {
      return res.status(404).json({
        status: "failed",
        message: "Doctor not found. Please enter a valid doctor userId.",
      });
    }

    // Retrieve the doctor's information along with populated scheduled appointments and user data
    // const doctorInfo = await DoctorInfo.findOne({ user: userId })
    //     .populate({
    //       path: "appointments",
    //       match: { "schedule.status": "Scheduled" }, // Filter scheduled appointments
    //     })
    const doctorInfo = await DoctorInfo.findOne({ user: userId })
      // .populate({
      //   path: "appointments",
      //   match: { "schedule.status": { $in: ["Scheduled", "Completed", "Booked"] } }, // Include all statuses
      // })
      //
      .populate({
        path: "appointments",
        match: {
          "schedule.status": { $in: ["Scheduled", "Completed", "Booked"] },
        }, // Include all statuses
        populate: {
          path: "schedule.patient", // Populate the patient field
          select: "_id firstName lastName", // Select only the first and last name of the patient
        },
      })
      .populate("user", "-password -notifications"); // Exclude the password and notifications fields from the user data

    if (!doctorInfo) {
      return res.status(404).json({
        status: "failed",
        message: "Doctor information not found.",
      });
    }

    // Calculate groupedSchedules
    const groupedSchedules = {
      booked: [],
      completed: [],
      scheduled: [],
      cancelled: [],
    };

    doctorInfo.appointments.forEach((appointment) => {
      appointment.schedule.forEach((schedule) => {
        const scheduleObject = {
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          status: schedule.status,
          _id: schedule._id,
          bookingId: schedule.bookingId,
        };

        if (schedule.patient) {
          // If patient information is available, include first and last name
          scheduleObject.patientId = schedule.patient._id;
          scheduleObject.patientFirstName = schedule.patient.firstName;
          scheduleObject.patientLastName = schedule.patient.lastName;
        }

        if (schedule.status === "Booked") {
          groupedSchedules.booked.push(scheduleObject);
        } else if (schedule.status === "Completed") {
          groupedSchedules.completed.push(scheduleObject);
        } else if (schedule.status === "Scheduled") {
          groupedSchedules.scheduled.push(scheduleObject);
        } else if (schedule.status === "Cancelled") {
          groupedSchedules.cancelled.push(scheduleObject);
        }
      });
    });

    // doctorInfo.appointments.forEach((appointment) => {
    //   appointment.schedule.forEach((schedule) => {
    //     if (schedule.status === "Booked") {
    //       groupedSchedules.booked.push(schedule);
    //     } else if (schedule.status === "Completed") {
    //       groupedSchedules.completed.push(schedule);
    //     } else if (schedule.status === "Scheduled") {
    //       groupedSchedules.scheduled.push(schedule);
    //     } else if (schedule.status === "Cancelled") {
    //       groupedSchedules.cancelled.push(schedule);
    //     }
    //   });
    // });

    // Group scheduled appointments by date with their _id
    const groupedScheduledAppointments = {};

    doctorInfo.appointments.forEach((appointment) => {
      appointment.schedule.forEach((schedule) => {
        if (schedule.status === "Scheduled") {
          const date = new Date(appointment.date).toISOString().split("T")[0]; // Extract the date part

          if (!groupedScheduledAppointments[date]) {
            groupedScheduledAppointments[date] = {
              _id: appointment._id,
              schedules: [],
            };
          }

          groupedScheduledAppointments[date].schedules.push({
            _id: schedule._id,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
          });
        }
      });
    });

    // Extract the schedule objects with status "Scheduled" for availableTimeSlots
    const availableTimeSlots = Object.entries(groupedScheduledAppointments).map(
      ([date, data]) => ({
        _id: data._id,
        date,
        schedules: data.schedules,
      })
    );

    // Create a new response object with the desired fields
    const responseObject = {
      status: "success",
      message: "Doctor information returned.",
      data: {
        ...doctorInfo._doc,
        user: doctorInfo.user,
        total_number_of_appointment_scheduled:
          groupedSchedules.scheduled.length,
        total_number_of_appointment_booked: groupedSchedules.booked.length,
        total_number_of_appointment_completed:
          groupedSchedules.completed.length,
        total_number_of_appointment_cancelled:
          groupedSchedules.cancelled.length,
        groupedSchedules: groupedSchedules, // Include groupedSchedules in the response
        availableTimeSlots: availableTimeSlots, // Include availableTimeSlots in the response
      },
    };

    // Exclude the appointments array from the response
    delete responseObject.data.appointments;

    // Return the modified response object
    return res.status(200).json(responseObject);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "failed",
      message: "An error occurred while displaying doctor info.",
    });
  }
};

// Controller to add or update a user's rating for a doctor
const rateDoctor = async (req, res) => {
  const { doctorId, userId } = req.params;
  const { starRating } = req.body;

  try {
    // Find the user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Find the doctor
    const doctor = await DoctorInfo.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    // Check if the user has already rated this doctor
    const existingRating = doctor.ratings.find(
      (rating) => rating.user.toString() === userId
    );

    if (existingRating) {
      // User has already rated the doctor, update the rating
      existingRating.rating = starRating;
    } else {
      // User is rating the doctor for the first time
      doctor.ratings.push({ user: userId, rating: starRating });
    }

    // Recalculate the average rating
    const totalRatings = doctor.ratings.length;
    const totalRatingSum = doctor.ratings.reduce(
      (sum, rating) => sum + rating.rating,
      0
    );
    const averageRating = totalRatingSum / (totalRatings || 1); // Avoid division by zero

    // Update the doctor's ratings fields
    doctor.averageRating = averageRating;
    doctor.totalRatings = totalRatings;
    doctor.totalRatingSum = totalRatingSum;

    // Save the updated doctor info
    await doctor.save();

    return res.status(200).json({
      message: "Doctor rated successfully.",
      // rating: averageRating,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "An error occurred while rating the doctor.",
    });
  }
};

const fetchDoctorsWithFullInfo = async (req, res) => {
  try {
    // Use the aggregate pipeline to perform a lookup between User and DoctorInfo models
    const doctors = await User.aggregate([
      {
        // Match only users with the role 'isDoctor'
        $match: { role: "isDoctor" },
      },
      {
        // Perform a left outer join with DoctorInfo model using the 'user' field
        $lookup: {
          from: "doctorinfos", // The collection name for DoctorInfo model
          localField: "_id",
          foreignField: "user",
          as: "doctorInfo",
        },
      },
      {
        // Unwind the 'doctorInfo' array to get individual doctor information
        $unwind: {
          path: "$doctorInfo",
          preserveNullAndEmptyArrays: true, // Handle the case where a doctor may not have DoctorInfo
        },
      },
      {
        // Project only the fields you need from both User and DoctorInfo models
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          email: 1,
          phoneNumber: 1,
          avatar: 1,
          qualification: { $ifNull: ["$doctorInfo.qualification", null] },
          placeOfWork: { $ifNull: ["$doctorInfo.placeOfWork", null] },
          specialty: { $ifNull: ["$doctorInfo.specialty", null] },
          yearOfExperience: { $ifNull: ["$doctorInfo.yearOfExperience", null] },
          rate: { $ifNull: ["$doctorInfo.rate", null] },
          bio: { $ifNull: ["$doctorInfo.bio", null] },
          // Add more fields as needed from both User and DoctorInfo models
        },
      },
    ]);

    return res.status(200).json({
      status: "success",
      message: "Doctors information fetched successfully.",
      data: doctors,
    });
  } catch (error) {
    // console.log(error);
    return res.status(500).json({
      status: "failed",
      message: "An error occurred while fetching doctors information.",
    });
  }
};

const removeDoctorRole = async (req, res) => {
  const { userId } = req.params;

  try {
    // Find the user with the provided user ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        status: "failed",
        message: "Doctor not found. Please select a valid Doctor.",
      });
    }

    // Check if the user has the role 'isDoctor'
    if (user.role === "isDoctor") {
      // Update the user's role to 'isUser'
      user.role = "isUser";
      await user.save();

      return res.status(200).json({
        status: "success",
        message: "Doctor role removed successfully.",
        data: user,
      });
    } else {
      return res.status(400).json({
        status: "failed",
        message: "The user is not a doctor.",
      });
    }
  } catch (error) {
    // console.log(error);
    return res.status(500).json({
      status: "failed",
      message: "An error occurred while processing your request.",
    });
  }
};

///// DELETE DOCTOR TOTALLY FROM THE SYSTEM
const deleteDoctor = async (req, res) => {
  const { userId } = req.params;

  try {
    // Find the user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        status: "failed",
        message: "User not found. Please enter a valid user ID.",
      });
    }

    // Check if the user has the role 'isDoctor'
    if (user.role === "isDoctor") {
      // Delete the user and associated DoctorInfo
      await Promise.all([
        User.findByIdAndDelete(userId),
        DoctorInfo.findOneAndDelete({ user: userId }),
      ]);

      return res.status(200).json({
        status: "success",
        message: "Doctor user and associated DoctorInfo deleted successfully.",
      });
    } else {
      return res.status(400).json({
        status: "failed",
        message: "The user is not a doctor.",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "failed",
      message: "An error occurred while processing your request.",
    });
  }
};

module.exports = {
  fetchDoctorsWithFullInfo,
  signUpAsDoctor,
  doctorSignin,
  signUpAsDoctors,
  viewDoctor,
  deleteDoctor,
  updateDoctorInfo,
  updateDoctorAccountInfo,
  viewDoctorInfo,
  removeDoctorRole,
  rateDoctor,
  InviteDoctor
};
