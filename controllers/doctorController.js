const User = require('../models/User');
const DoctorInfo = require('../models/DoctorInfo');
const transporter = require('../utilities/transporter');
const jwt = require('jsonwebtoken');
//const DoctorInfo = require('../models/DoctorInfo');


/*
// Function to sign up a user as a doctor
const signUpAsDoctor = async (req, res) => {
  const { email, adminUserId } = req.body;

  try {
    // Check if the user making the request is an admin
    const adminUser = await User.findById(adminUserId);

    if (!adminUser || !adminUser.isAdmin) {
      return res.status(403).json({
        status: 'failed',
        message: 'You do not have permission to sign up doctors.',
      });
    }

    // Check if the user with the given email already exists
    let user = await User.findOne({ email });

    if (user) {
      // If the user exists, update their isDoctor field to true and save the user
      user.isDoctor = true;
      await user.save();

      // Send an email notifying the user that they are now a doctor
      const mailOptions = {
        from: 'Your Email <youremail@gmail.com>',
        to: email,
        subject: 'Congratulations! You are now a doctor',
        html: '<p>You have been verified as a doctor.</p>',
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log('Error sending verification email:', error);
        } else {
          console.log('Verification email sent:', info.response);
        }
      });

      return res.json({
        status: 200,
        message: 'Doctor created successfully.',
      });
    } else {
      // If the user does not exist, create a new user and set their isDoctor field to true
      const doctor = new User({
        email,
        isDoctor: true,
      });

      await doctor.save();

      // Generate a verification token and send it via email
      const verificationToken = jwt.sign(
        { email },
        'your_secret_verification_key', // Replace with your own secret key
        { expiresIn: '1h' }
      );

      const verificationLink = `http://yourdomain.com/verify-doctor?token=${verificationToken}`;

      const mailOptions = {
        from: 'Your Email <youremail@gmail.com>',
        to: email,
        subject: 'Verify Your Doctor Account',
        html: `<p>Please click the link below to verify your doctor account:</p><a href="${verificationLink}">${verificationLink}</a>`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log('Error sending verification email:', error);
        } else {
          console.log('Verification email sent:', info.response);
        }
      });

      return res.json({
        status: 200,
        message: 'Verification email sent. Please verify your doctor account.',
      });
    }
  } catch (error) {
    console.log('Error signing up as doctor:', error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while processing your request.',
    });
  }
};
*/

const signUpAsDoctor = async (req, res) => {
  const { email, adminUserId } = req.body;

  // Check if the request body contains the required fields
  if (!email || !adminUserId) {
    return res.status(400).json({
      status: 'failed',
      message: 'Please provide the email and adminUserId in the request body.',
    });
  }

  try {
    // Check if the user making the request is an admin
    const adminUser = await User.findById(adminUserId);

    // Check if the user exists and is an admin
    if (!adminUser || !adminUser.role.includes('isAdmin')) {
      return res.status(403).json({
        status: 'failed',
        message: 'You do not have permission to sign up doctors.',
      });
    }

    // Check if the user with the given email already exists
    let user = await User.findOne({ email });

    if (user) {
      // If the user exists, check if they are already a doctor
      if (user.role.includes('isDoctor')) {
        return res.json({
          status: 200,
          message: 'The user is already registered as a doctor.',
        });
      } else {
        // If the user exists but is not a doctor, update their role to 'isDoctor' and save the user
        user.role.push('isDoctor');
        await user.save();

        // Send an email notifying the user that they are now a doctor
        const mailOptions = {
          from: process.env.AUTH_EMAIL,
          to: email,
          subject: 'Congratulations! You are now a doctor',
          html: '<p>You have been verified as a doctor. Kindly login to your account to update your information.</p>',
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log('Error sending verification email:', error);
          } else {
            console.log('Verification email sent:', info.response);
          }
        });

        return res.json({
          status: 200,
          message: 'Doctor created successfully.',
        });
      }
    } else {
      // If the user does not exist, create a new user and set their role to 'isDoctor'
      const doctor = new User({
        email,
        role: ['isDoctor'],
      });

      await doctor.save();

      // Generate a verification token and send it via email
      const verificationToken = jwt.sign(
        { email },
        process.env.JWT_SEC_KEY, // Replace with secret key
        { expiresIn: '1h' }
      );

      const verificationLink = `http://yourdomain.com/verify-doctor?token=${verificationToken}`;

      const mailOptions = {
        from: process.env.AUTH_EMAIL,
        to: email,
        subject: 'Verify Your Doctor Account',
        html: `<p>Please click the link below to verify your doctor account:</p><a href="${verificationLink}">${verificationLink}</a>`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log('Error sending verification email:', error);
        } else {
          console.log('Verification email sent:', info.response);
        }
      });

      return res.json({
        status: 200,
        message: 'Verification email sent. Please verify your doctor account.',
      });
    }
  } catch (error) {
    console.log('Error signing up as doctor:', error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while processing your request.',
    });
  }
};


const updateDoctorInfo = async (req, res, next) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user || !user.role.includes('isDoctor')) {
      return res.status(403).json({
        status: 'failed',
        message: 'User not found or is not authorized as a doctor.',
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
      allergies: req.body.allergies,
    };

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      userUpdateData,
      { new: true }
    );

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
      { upsert: true }
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

////// update doctors account information
const updateDoctorAccountInfo = async (req, res, next) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user || !user.role.includes('isDoctor')) {
      return res.status(403).json({
        status: 'failed',
        message: 'User not found or is not authorized as a doctor.',
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
      { upsert: true }
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

///// view doctorinfo only using userId
const viewDoctor = async (req, res, next) => {
  const { userId } = req.params;

  try {
    // Find the user by ID and check if they have the 'isDoctor' role
    const user = await User.findById(userId);
    if (!user || !user.role.includes('isDoctor')) {
      return res.status(403).json({
        status: 'failed',
        message: 'User not found or is not authorized as a doctor.',
      });
    }

    // Find the doctor information using the user ID
    const doctorInfo = await DoctorInfo.findOne({ user: userId });

    if (!doctorInfo) {
      return res.status(404).json({
        status: 'failed',
        message: 'Doctor information not found.',
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Doctor information found.',
      data: {
        user,
        doctorInfo,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while processing your request.',
    });
  }
};


//////// view full doctor;'s info for one doctor
const viewDoctorInfo = async (req, res) => {
  const { userId } = req.params;

  try {
    // Check if the user exists and is a doctor
    const user = await User.findById(userId);
    if (!user || !user.isDoctor) {
      return res.status(404).json({
        status: 'failed',
        message: 'Doctor not found. Please enter a valid doctor userId.',
      });
    }

    // Use the aggregate method to perform a lookup and merge data from both collections
    const doctorInfo = await User.aggregate([
      // Match the user with the specified userId
      { $match: { _id: mongoose.Types.ObjectId(userId) } },

      // Perform a left outer join with the DoctorInfo collection
      {
        $lookup: {
          from: 'doctorinfos',
          localField: '_id',
          foreignField: 'user',
          as: 'doctorInfo',
        },
      },

      // Unwind the doctorInfo array to get a single object
      { $unwind: { path: '$doctorInfo', preserveNullAndEmptyArrays: true } },
    ]);

    if (!doctorInfo || doctorInfo.length === 0 || !doctorInfo[0].doctorInfo) {
      return res.status(404).json({
        status: 'failed',
        message: 'Doctor information not found.',
      });
    }

    // Return the merged data
    return res.status(200).json({
      status: 'success',
      message: 'Doctor information found.',
      data: doctorInfo[0], // doctorInfo is an array, but we know there's only one element
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while processing your request.',
    });
  }
};



    const fetchDoctorsWithFullInfo = async (req, res) => {
      try {
        // Use the aggregate pipeline to perform a lookup between User and DoctorInfo models
        const doctors = await User.aggregate([
          {
            // Match only users with the role 'isDoctor'
            $match: { role: 'isDoctor' }
          },
          {
            // Perform a left outer join with DoctorInfo model using the 'user' field
            $lookup: {
              from: 'doctorinfos', // The collection name for DoctorInfo model
              localField: '_id',
              foreignField: 'user',
              as: 'doctorInfo'
            }
          },
          {
            // Unwind the 'doctorInfo' array to get individual doctor information
            $unwind: {
              path: '$doctorInfo',
              preserveNullAndEmptyArrays: true // Handle the case where a doctor may not have DoctorInfo
            }
          },
          {
            // Project only the fields you need from both User and DoctorInfo models
            $project: {
              _id: 1,
              firstName: 1,
              lastName: 1,
              email: 1,
              phoneNumber: 1,
              qualification: { $ifNull: ['$doctorInfo.qualification', null] },
              placeOfWork: { $ifNull: ['$doctorInfo.placeOfWork', null] },
              specialty: { $ifNull: ['$doctorInfo.specialty', null] },
              yearOfExperience: { $ifNull: ['$doctorInfo.yearOfExperience', null] },
              rate: { $ifNull: ['$doctorInfo.rate', null] },
              bio: { $ifNull: ['$doctorInfo.bio', null] }
              // Add more fields as needed from both User and DoctorInfo models
            }
          }
        ]);
    
        return res.status(200).json({
          status: 'success',
          message: 'Doctors information fetched successfully.',
          data: doctors,
        });
      } catch (error) {
        console.log(error);
        return res.status(500).json({
          status: 'failed',
          message: 'An error occurred while fetching doctors information.',
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
            status: 'failed',
            message: 'User not found. Please enter a valid user ID.',
          });
        }
    
        // Check if the user has the role 'isDoctor'
        if (user.role.includes('isDoctor')) {
          // Remove the 'isDoctor' role from the user and update their role to 'isUser'
          user.role = user.role.filter((role) => role !== 'isDoctor');
          user.role.push('isUser');
          await user.save();
    
          return res.status(200).json({
            status: 'success',
            message: 'Doctor role removed successfully.',
            data: user,
          });
        } else {
          return res.status(400).json({
            status: 'failed',
            message: 'The user is not a doctor.',
          });
        }
      } catch (error) {
        console.log(error);
        return res.status(500).json({
          status: 'failed',
          message: 'An error occurred while processing your request.',
        });
      }
    };
    

module.exports = {
  fetchDoctorsWithFullInfo,
  signUpAsDoctor,
  viewDoctor,
  updateDoctorInfo,
  updateDoctorAccountInfo,
  viewDoctorInfo,
  removeDoctorRole
};
