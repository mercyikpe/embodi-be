const mongoose = require('mongoose');
const moment = require('moment');
const createError = require ('../utilities/createError');
const User = require ('../models/User');
const Disease = require('../models/Disease')


/////// admin can create user//////
const createUser = async (req, res, next) => {
  const { firstName, lastName, email, phoneNumber } = req.body;

  try {
    // Check if the user making the request is an admin
    const isAdmin = req.user && req.user.role.includes('isAdmin');

    // If the user is not an admin, remove the 'role' and 'status' fields from the req.body
    if (!isAdmin) {
      delete req.body.role;
      delete req.body.status;
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
      message: 'Successfully created a new user.',
      data: savedUser,
    });
  } catch (error) {
    console.log('Error creating user:', error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while processing your request.',
    });
  }
};



const updateUser = async (req, res, next) => {
  const { firstName, lastName, email, phoneNumber, image, dob, address, gender, allergies, avatar} = req.body;
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
    avatar
  };

  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
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
    const adminUser = await User.findById(req.user.id);
    if (!adminUser || adminUser.role !== 'isAdmin') { // Use '!=='
      return res.status(403).json({
        status: 'failed',
        message: 'You do not have permission to delete users.',
      });
    }

    // Check if the user to be deleted exists and is not an admin
    const userToDelete = await User.findById(req.params.id);
    if (!userToDelete) {
      return res.status(404).json({
        status: 'failed',
        message: 'User not found. Please enter a valid userId.',
      });
    }

    if (userToDelete.role === 'isAdmin') { // Use '==='
      return res.status(403).json({
        status: 'failed',
        message: 'You cannot delete an admin user.',
      });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({
      status: 200,
      message: `User with ID ${req.params.id} deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};



const getUser = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: 'isUser' });

    if (!user) {
      return res.status(404).json({
        status: 'failed',
        message: 'User not found or does not have the user role.',
      });
    }

    res.json({
      status: 200,
      message: `User with ID ${req.params.id} found`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};




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
    const users = await User.paginate({}, { page: pageNumber, limit: pageSize });

    res.json({
      status: 200,
      message: 'All users retrieved successfully',
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
    const appUsers = await User.find({ role: 'isUser' });

    res.json({
      status: 200,
      message: 'All app users with role isUser retrieved successfully',
      data: appUsers,
    });
  } catch (error) {
    next(error);
  }
};



//// get all active users
const getActiveUsers = async (req, res, next) => {
  try {
    const activeUsers = await User.find({ status: 'isActive' }).sort({ updatedAt: -1 });

    const formattedUsers = activeUsers.map(user => {
      const activityTime = moment(user.updatedAt).fromNow();
      return {
        ...user.toObject(),
        activityTime
      };
    });

    res.json({
      status: 200,
      message: 'Active users sorted by moment',
      data: formattedUsers
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
      throw new Error('User or Disease not found.');
    }

    // Add the disease to the user's ownedDiseases array
    user.ownedDiseases.push(disease._id);
    await user.save();

    return user;
  } catch (error) {
    throw new Error('Failed to add disease to user.');
  }
};



// controller function to view a user with al information
const viewUser = async (req, res) => {
  const userId = req.params.userId;

  try {
    // Find the user by ID and populate the 'disease' and 'questionnaire' fields
    const user = await User.findById(userId).populate('disease questionnaire');

    if (!user) {
      return res.status(404).json({
        status: 'failed',
        message: 'User not found.',
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
      status: 'success',
      data: userData,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while processing your request.',
    });
  }
};

const viewAllDoctors = async (req, res) => {
  try {
    // Find all users with the role 'isDoctor'
    const doctors = await User.find({ role: 'isDoctor' }).select('-password');

    if (!doctors || doctors.length === 0) {
      return res.status(404).json({
        status: 'failed',
        message: 'No doctors found.',
      });
    }

    // Return the list of doctors
    return res.status(200).json({
      status: 'success',
      message: 'List of doctors found.',
      data: doctors,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while processing your request.',
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
  viewAllDoctors
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
  viewAllDoctors
};
