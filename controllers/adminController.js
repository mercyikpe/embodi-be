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



// Define a route to update user information
const updateAdmin = async (req, res) => {
  const { userId } = req.params;
  const { phoneNumber, firstName, lastName } = req.body;

  try {
    // Find the user by ID and check if their role is "isAdmin"
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        status: 'failed',
        message: 'User not found.',
      });
    }

    if (!user.role.includes('isAdmin')) {
      return res.status(403).json({
        status: 'failed',
        message: 'User is not authorized as an admin.',
      });
    }

    // Update user information if the conditions are met
    user.phoneNumber = phoneNumber || user.phoneNumber;
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;

    await user.save();

    return res.status(200).json({
      status: 'success',
      message: 'User information updated successfully.',
      data: user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while updating user information.',
    });
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
    updateAdmin,
    viewAllAdmins
  };
  