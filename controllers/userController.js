const mongoose = require('mongoose');
const moment = require('moment');
const createError = require ('../utilities/createError');
const User = require ('../models/User');
const Disease = require('../models/Disease')



const createUser = async (req, res, next) => {
  const newUser = new User(req.body);

  try {
    const savedUser = await newUser.save();
    res.json({
      status: 200,
      message: "Successfully created a new user",
      data: savedUser
    });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
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

const deleteUser = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({
      status: 200,
      message: `User with ID ${req.params.id} deleted successfully`
    });
  } catch (error) {
    next(error);
  }
};

const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    res.json({
      status: 200,
      message: `User with ID ${req.params.id} found`,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  const pageSize = 10;
  const pageNumber = 1;

  if (req.query.pageSize) {
    pageSize = parseInt(req.query.pageSize, 10);
  }

  if (req.query.pageNumber) {
    pageNumber = parseInt(req.query.pageNumber, 10);
  }

  const users = await User.paginate(
    {},
    {
      pageSize,
      pageNumber
    }
  );

  res.json({
    status: 200,
    message: users,
  });
}

const getActiveUsers = async (req, res, next) => {
  try {
    
    const user = await User.find({ activity: 'active' }).sort({ updatedAt: -1 });

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
async function addDiseaseToUser(userId, diseaseId) {
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
}


// controller function to view a user with al information
async function viewUser(req, res) {
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

 ///// choose what to keep open when resturning response 
    const userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
     //// other fields to show. 
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
}

const userController = {
  viewUser, //// route not created for this
  addDiseaseToUser, /////// route not created for this
  createUser,
  updateUser,
  deleteUser,
  getUser,
  getAllUsers,
  getActiveUsers
};

module.exports = {
  addDiseaseToUser,
  createUser,
  updateUser,
  deleteUser,
  getUser,
  getAllUsers,
  getActiveUsers
};
