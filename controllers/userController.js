const mongoose = require("mongoose");
const moment = require("moment");
const createError = require("../utilities/createError");
const User = require("../models/User");
const Disease = require("../models/Disease");
const Notification = require("../models/Notification");
const { successResponse, errorResponse } = require("../utilities/apiResponse");

/////// admin can create user//////
const createUser = async (req, res, next) => {
  const { firstName, lastName, email, phoneNumber } = req.body;

  try {
    // Check if the user making the request is an admin
    const isAdmin = req.user && req.user.role.includes("isAdmin");

    // If the user is not an admin, remove the 'role' and 'status' fields from the req.body
    if (!isAdmin) {
      delete req.body.role;
      delete req.body.status;
    }

    // Check if the phone number already exists in the database
    const existingUserWithPhoneNumber = await User.findOne({ phoneNumber });
    if (existingUserWithPhoneNumber) {
      return res.status(400).json({ status: 'failed', message: "Phone number already exists." });
    }

    // Create a new user instance with the provided data
    const newUser = new User(req.body);

    // Validate the user data based on the isAdmin status
    if (isAdmin) {
      // Admin user - validate all required fields
      newUser.firstName = firstName;
      newUser.lastName = lastName;
      newUser.email = email;
      newUser.phoneNumber = phoneNumber;

      // Additional validation for admin user can be done here if needed
    } else {
      // Non-admin user - no specific validation for firstName, lastName, email, and phoneNumber
    }

    // Save the user to the database
    const savedUser = await newUser.save();

    return res.json({
      status: 200,
      message: "Successfully created a new user.",
      data: savedUser,
    });
  } catch (error) {
    console.log("Error creating user:", error);
    return res.status(500).json({
      status: "failed",
      message: "An error occurred while processing your request.",
    });
  }
};

const handleUserProfileUpdate = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const updates = {};

    if (req.body.firstName) {
      updates.firstName = req.body.firstName;
    }
    if (req.body.lastName) {
      updates.lastName = req.body.lastName;
    }
    // if (req.body.phoneNumber) {
    //   updates.phoneNumber = req.body.phoneNumber;
    // }
    if (req.body.phoneNumber) {
      // Check if the provided phoneNumber already exists in the database
      const existingUser = await User.findOne({ phoneNumber: req.body.phoneNumber });
      if (existingUser && existingUser._id.toString() !== userId) {
        return res.status(400).json({
          status: "failed",
          message: "Phone number already exists.",
        });
        // return res.status(400).json({ message: "Phone number already exists." });
      }
      updates.phoneNumber = req.body.phoneNumber;
    }

    if (req.body.dob) {
      updates.dob = req.body.dob;
    }
    if (req.body.address) {
      updates.address = req.body.address;
    }
    if (req.body.gender) {
      updates.gender = req.body.gender;
    }
    if (req.body.allergies) {
      updates.allergies = req.body.allergies;
    }
    if (req.body.avatar) {
      updates.avatar = req.body.avatar;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true,
    }).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: `User with ID ${userId} not found` });
    }

    return res.status(200).json({
      message: `User with ID ${userId} updated successfully`,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    phoneNumber,
    image,
    dob,
    address,
    gender,
    allergies,
  } = req.body;
  const updateData = {
    firstName,
    lastName,
    email,
    phoneNumber,
    image,
    dob,
    address,
    gender,
    allergies,
  };
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    res.json({
      status: 200,
      message: `User with ID ${req.params.id} updated`,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

///// delete user

const deleteUser = async (req, res, next) => {
  try {
    // Check if the user making the request is an admin
   //  const adminUser = await User.findById(adminUserId);

    // console.log("adminUserId", adminUserId)
    // if (!adminUser || adminUser.role !== "isAdmin") {
    //   // Use '!=='
    //   return res.status(403).json({
    //     status: "failed",
    //     message: "You do not have permission to delete users.",
    //   });
    // }

    // Check if the user to be deleted exists and is not an admin
    const userToDelete = await User.findById(req.params.id);

    if (!userToDelete) {
      return res.status(404).json({
        status: "failed",
        message: "User not found. Please select a valid user.",
      });
    }

    if (userToDelete.role === "isAdmin") {
      return res.status(403).json({
        status: "failed",
        message: "You cannot delete an admin user.",
      });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({
      status: 200,
      message: `User deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};

const getUser = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: "isUser" });

    if (!user) {
      return res.status(404).json({
        status: "failed",
        message: "User not found or does not have the user role.",
      });
    }

    // Populate the user's past consultations with disease titles
    const populatedUser = await User.findOne({
      _id: req.params.id,
      role: "isUser",
    })
      .populate({
        path: "pastConsultation",
        populate: {
          path: "diseaseId",
          select: "title", // Select only the title field of the disease
        },
      })
      .populate("notifications") // Populate the notifications
      .populate("pastAppointments") // Populate the pastAppointments
      .exec();

    // Extract the disease titles from past consultations
    const pastConsultations = populatedUser.pastConsultation.map(
      (consultation) => consultation.diseaseId.title
    );

    // Format the "past consultation" field as a comma-separated list of disease titles
    const pastConsultation = pastConsultations.join(", ");

    res.json({
      status: 200,
      message: `User with ID ${req.params.id} found`,
      data: {
        ...populatedUser.toObject(),
        pastConsultation, // Rename to "past consultation"
      },
    });
  } catch (error) {
    next(error);
  }
};

// const getUser = async (req, res, next) => {
//   try {
//     const user = await User.findOne({ _id: req.params.id, role: "isUser" });
//
//     if (!user) {
//       return res.status(404).json({
//         status: "failed",
//         message: "User not found or does not have the user role.",
//       });
//     }
//
//     res.json({
//       status: 200,
//       message: `User with ID ${req.params.id} found`,
//       data: user,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

/////// get all users with pagination
const getAllUsers = async (req, res, next) => {
  let pageSize = 10;
  let pageNumber = 1;

  if (req.query.pageSize) {
    pageSize = parseInt(req.query.pageSize, 10);
  }

  if (req.query.pageNumber) {
    pageNumber = parseInt(req.query.pageNumber, 10);
  }

  try {
    const users = await User.paginate(
      {},
      { page: pageNumber, limit: pageSize }
    );

    res.json({
      status: 200,
      message: "All users retrieved successfully",
      data: users.docs,
      totalPages: users.totalPages,
      currentPage: users.page,
      totalUsers: users.totalDocs,
    });
  } catch (error) {
    next(error);
  }
};

//// get all the user without paginaztion

const getAllTheAppUsers = async (req, res, next) => {
  try {
    const appUsers = await User.find({ role: "isUser" });

    res.json({
      status: 200,
      message: "All app users with role isUser retrieved successfully",
      data: appUsers,
    });
  } catch (error) {
    next(error);
  }
};

//// get all active users
const getActiveUsers = async (req, res, next) => {
  try {
    const activeUsers = await User.find({ status: "isActive" }).sort({
      updatedAt: -1,
    });

    const formattedUsers = activeUsers.map((user) => {
      const activityTime = moment(user.updatedAt).fromNow();
      return {
        ...user.toObject(),
        activityTime,
      };
    });

    res.json({
      status: 200,
      message: "Active users sorted by moment",
      data: formattedUsers,
    });
  } catch (error) {
    next(error);
  }
};

/////////USER OWN DISEASE THEY AND QUESTIONAIRE
const addDiseaseToUser = async (userId, diseaseId) => {
  try {
    const user = await User.findById(userId);
    const disease = await Disease.findById(diseaseId);

    if (!user || !disease) {
      throw new Error("User or Disease not found.");
    }

    // Add the disease to the user's ownedDiseases array
    user.ownedDiseases.push(disease._id);
    await user.save();

    return user;
  } catch (error) {
    throw new Error("Failed to add disease to user.");
  }
};

// controller function to view a user with al information
const viewUser = async (req, res) => {
  const userId = req.params.userId;

  try {
    // Find the user by ID and populate the 'disease' and 'questionnaire' fields
    const user = await User.findById(userId).populate("disease questionnaire");

    if (!user) {
      return res.status(404).json({
        status: "failed",
        message: "User not found.",
      });
    }

    // Choose the fields you want to include in the response
    const userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      // Add other fields you want to show in the response
      // For example: firstName, lastName, phoneNumber, etc.
    };

    // Return the user data in the response
    return res.status(200).json({
      status: "success",
      data: userData,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({
      status: "failed",
      message: "An error occurred while processing your request.",
    });
  }
};

const viewAllDoctors = async (req, res) => {
  try {
    // Find all users with the role 'isDoctor'
    const doctors = await User.find({ role: "isDoctor" }).select("-password");

    if (!doctors || doctors.length === 0) {
      return res.status(404).json({
        status: "failed",
        message: "No doctors found.",
      });
    }

    // Return the list of doctors
    return res.status(200).json({
      status: "success",
      message: "List of doctors found.",
      data: doctors,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "failed",
      message: "An error occurred while processing your request.",
    });
  }
};

const viewDoctorAppointmentsByWeek = async (req, res) => {
  const { doctorId } = req.params; // Get the doctor's ID from the request parameters
  const { userId } = req.user; // Get the user's ID from the authenticated user (assuming you have user authentication middleware)

  try {
    // Check if the user exists and is a doctor
    const user = await User.findById(userId);
    if (!user || user.role !== "isUser") {
      return res.status(404).json({
        status: "failed",
        message: "User not found or not authorized.",
      });
    }

    // Find the doctor's information
    const doctorInfo = await DoctorInfo.findOne({ user: doctorId });
    if (!doctorInfo) {
      return res.status(404).json({
        status: "failed",
        message: "Doctor not found.",
      });
    }

    // Calculate the start and end dates for the 7-day intervals
    const currentDate = new Date();
    const endDate = new Date(currentDate); // Use the current date as the end date
    const startDate = new Date(currentDate);
    startDate.setDate(currentDate.getDate() - 6); // Calculate the start date as 7 days ago

    // Find the doctor's available appointments within the specified date range
    const availableAppointments = await Appointment.find({
      doctor: doctorId,
      date: { $gte: startDate, $lte: endDate },
      status: "Scheduled", // Only retrieve available slots
    });

    // Construct the response with available appointment slots grouped by 7-day intervals
    const response = {
      doctorId: doctorInfo.user._id,
      doctorName: doctorInfo.user.name, // Replace with the actual field for doctor's name
      startDate,
      endDate,
      availableSlots: availableAppointments.map((appointment) => ({
        appointmentId: appointment._id,
        date: appointment.date, // Add date to the response
        startTime: appointment.startTime,
        endTime: appointment.endTime,
      })),
    };

    // Return the available appointment slots grouped by 7-day intervals to the user
    return res.status(200).json({
      status: "success",
      message: "Doctor appointments found by 7-day intervals.",
      data: response,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      status: "failed",
      message: "An error occurred while processing your request.",
    });
  }
};

const userController = {
  viewUser, //// route not created for this
  addDiseaseToUser, /////// route not created for this
  createUser,
  updateUser,
  deleteUser,
  getUser,
  getAllTheAppUsers,
  getAllUsers,
  getActiveUsers,
  viewAllDoctors,
};

module.exports = {
  viewUser,
  addDiseaseToUser,
  createUser,
  updateUser,
  deleteUser,
  getUser,
  getAllTheAppUsers,
  getAllUsers,
  getActiveUsers,
  viewAllDoctors,
  viewDoctorAppointmentsByWeek,
  handleUserProfileUpdate,
};
