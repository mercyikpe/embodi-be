////// SCHEMA MODELS
const User = require('../models/User');
const DoctorInfo = require('../models/DoctorInfo')
const OtpCode = require('../models/OtpCode')
const Appointment = require('../models/Appointment')
const Disease = require('../models/Disease')
const Questionnaire = require('../models/Questionnaire')
const EventLog = require('../models/EventLog')

///////  MIDDLEWARES

//////  CONTROLLERS
const userController = require('../controllers/userController');

//////UPDATE ADMIN PROFILE
const updateAdminProfile = async (userId, updateData) => {
  try {
    // Find the admin user with the given userId and role "isAdmin"
    const admin = await User.findOne({ _id: userId, role: 'isAdmin' });

    if (!admin) {
      throw new Error('Admin user not found or not authorized.');
    }

    // Update the admin's profile
    Object.assign(admin, updateData);
    const updatedAdmin = await admin.save();

    return updatedAdmin;
  } catch (error) {
    throw error; // Rethrow the error to be caught in the calling function
  }
};


/////// user by admin
const updateUserByAdmin = async (userId, phoneNumber, firstName, lastName) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      return { success: false, message: 'User not found.' };
    }

    if (!user.role.includes('isAdmin')) {
      return { success: false, message: 'User is not authorized as an admin.' };
    }

    user.phoneNumber = phoneNumber || user.phoneNumber;
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;

    await user.save();

    return { success: true, message: 'User information updated successfully.', user };
  } catch (error) {
    console.log(error);
    return { success: false, message: 'An error occurred while updating user information.' };
  }
};




const viewAllAdmins = async () => {
    try {
      const admins = await User.find({ role: 'isAdmin' }).select('firstName lastName email');
      return admins;
    } catch (error) {
      throw error; // Rethrow the error to be caught in the calling function
    }
  };



module.exports = {
    updateAdminProfile,
    updateUserByAdmin,
    viewAllAdmins
  };
  