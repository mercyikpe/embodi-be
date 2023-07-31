const mongoose = require('mongoose');
const moment = require('moment');
const createError = require ('../utilities/createError');
const User = require ('../models/User');


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
  try {
    const pageSize = 10;
    const pageNumber = 1;
    const users = await User.paginate(
      {},
      {
        pageSize,
        pageNumber
      }
    );
    res.json({
      status: 200,
      message: users
    });
  } catch (error) {
    next(error);
  }
};

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

const userController = {
  createUser,
  updateUser,
  deleteUser,
  getUser,
  getAllUsers,
  getActiveUsers
};

module.exports = {
  createUser,
  updateUser,
  deleteUser,
  getUser,
  getAllUsers,
  getActiveUsers
};
