const User = require('../models/User');
const DoctorInfo = require('../models/DoctorInfo');




///// update user and doctor information
const updateDoctorInfo = async (req, res, next) => {
    const { userId } = req.params;
  
    try {
      // Check if the user exists and is a doctor
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          status: 'failed',
          message: 'User not found. Please enter a valid userId.',
        });
      }
  
      // Update the User model using the userId
      const userUpdateData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        phoneNumber: req.body.phoneNumber,
        dob: req.body.dob,
        address: req.body.address,
        gender: req.body.gender,
        allergies: req.body.allergies,
      };
  
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        userUpdateData,
        { new: true }
      );
  
      if (!user.isDoctor) {
        return res.status(200).json({
          status: 'success',
          message: 'User updated successfully.',
          data: updatedUser,
        });
      }
  
      // Update the DoctorInfo using the userId
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
        { new: true, upsert: true }
      );
  
      return res.status(200).json({
        status: 'success',
        message: 'DoctorInfo and User updated successfully.',
        data: { doctorInfo: updatedDoctorInfo, user: updatedUser },
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: 'failed',
        message: 'An error occurred while processing your request.',
      });
    }
  };


  /////// update doctor's bnks account
const updateDoctorAccountInfo = async (req, res, next) => {
    const { userId } = req.params;
  
    try {
      // Check if the user exists and is a doctor
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          status: 'failed',
          message: 'User not found. Please enter a valid userId.',
        });
      }
  
      if (!user.isDoctor) {
        return res.status(400).json({
          status: 'failed',
          message: 'User is not a doctor. Cannot update DoctorInfo.',
        });
      }
  
      // Update the DoctorInfo using the userId
      const updateData = {
       
        bankName: req.body.bankName,
        accountName: req.body.accountName,
        accountNumber: req.body.accountNumber,
      };
  
      const updatedDoctorAccountInfo = await DoctorInfo.findOneAndUpdate(
        { user: userId },
        updateData,
        { new: true, upsert: true }
      );
  
      return res.status(200).json({
        status: 'success',
        message: 'Doctor Account information updated successfully.',
        data: updatedDoctorAccountInfo,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: 'failed',
        message: 'An error occurred while processing your request.',
      });
    }
  };



  ////// VIEW DOCTOR
  const viewDoctor = async (req, res, next) => {
    const { userId } = req.params;
  
    try {
      // Check if the user exists and is a doctor
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          status: 'failed',
          message: 'User not found. Please enter a valid userId.',
        });
      }
  
      if (!user.isDoctor) {
        return res.status(400).json({
          status: 'failed',
          message: 'User is not a doctor. Cannot view DoctorInfo.',
        });
      }
  
      // Get the DoctorInfo for the user
      const doctorInfo = await DoctorInfo.findOne({ user: userId });
  
      // Combine the DoctorInfo and User data
      const doctorData = {
        ...doctorInfo,
        ...user,
      };
  
      // Add the available time slots to the doctor data
      doctorData.availableTimeSlots = doctorInfo.availableTimeSlots;
  
      return res.status(200).json({
        status: 'success',
        message: 'Doctor information retrieved successfully.',
        data: doctorData,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: 'failed',
        message: 'An error occurred while processing your request.',
      });
    }
  };

  /////// GET DOCTOR BY SPECILTY
  const viewDoctorsBySpecialty = async (req, res) => {
    // Get the specialty from the request
    const specialty = req.params.specialty;
  
    // Get the doctors for the specialty
    const doctors = await DoctorInfo.find({ specialty });
  
    // Return the doctors
    return res.status(200).json({
      status: 'success',
      message: 'Doctors retrieved successfully.',
      data: doctors,
    });
  };


  /////// fetch all users the are doctors
  const getAllDoctors = async (req, res) => {
    // Get all users that are doctors
    const doctors = await User.find({ isDoctor: true });
  
    // Return the doctors
    return res.status(200).json({
      status: 'success',
      message: 'Doctors retrieved successfully.',
      data: doctors,
    });
  }
  
  const getAllDoctorsPaginated = async (req, res) => {
    // Get the page number from the request
    const pageNumber = req.query.pageNumber || 1;
  
    // Get the doctors for the page
    const doctors = await User.find({ isDoctor: true })
      .skip((pageNumber - 1) * 10)
      .limit(10);
  
    // Return the doctors
    return res.status(200).json({
      status: 'success',
      message: 'Doctors retrieved successfully.',
      data: doctors,
      currentPage: pageNumber,
      totalPages: Math.ceil(doctors.length / 10),
    });
  };

  const searchDoctors = async (req, res) => {

    // Get the search term from the request
    const searchTerm = req.query.searchTerm;
  
    // Get the doctors that match the search term
    const doctors = await User.find({
      isDoctor: true,
      $text: { $search: searchTerm },
    });
  
    // Return the doctors
    return res.status(200).json({
      status: 'success',
      message: 'Doctors retrieved successfully.',
      data: doctors,
    });
  };



module.exports = {
  searchDoctors,
  getAllDoctorsPaginated,
  getAllDoctors,
  viewDoctorsBySpecialty,
  viewDoctor,
  updateDoctorInfo,
  updateDoctorAccountInfo
};
