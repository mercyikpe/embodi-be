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
    const user = await User.findById(userId);
    if (!user || !user.role.includes('isDoctor')) {
      return res.status(403).json({
        status: 'failed',
        message: 'User not found or is not authorized as a doctor.',
      });
    }

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
      data: doctorInfo,
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
  

    /*
    // Otherwise, map through the doctors array to fetch full information from both models
    const doctorsWithFullInfo = await Promise.all(
      doctors.map(async (doctor) => {
        // Find the doctor's information from the DoctorInfo model
        const doctorInfo = await DoctorInfo.findOne({ user: doctor._id });

        // Return the full information of the doctor
        return {
          user: {
            _id: doctor._id,
            firstName: doctor.firstName,
            lastName: doctor.lastName,
            email: doctor.email,
            phoneNumber: doctor.phoneNumber,
            // Add other user fields as needed
          },

          doctorInfo: {
            qualification: doctorInfo.qualification,
            placeOfWork: doctorInfo.placeOfWork,
            specialty: doctorInfo.specialty,
            yearOfExperience: doctorInfo.yearOfExperience,
            rate: doctorInfo.rate,
            bio: doctorInfo.bio,
            // Add other doctorInfo fields as needed
          },
        };
      })
    );

    // Return the list of doctors with full information
    return res.status(200).json({
      status: 'success',
      message: 'Doctors with full information fetched successfully.',
      data: doctorsWithFullInfo,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while fetching doctors with full information.',
    });
  }
};
*/










///////odl codes below
/*

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
/*
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
*/

/*
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
        // The user is not a doctor, so we cannot view their DoctorInfo
        return res.status(400).json({
          status: 'failed',
          message: 'User is not a doctor. Cannot view DoctorInfo.',
        });
      }
  
      // Get the doctor information
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
        data: doctorInfo,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: 'failed',
        message: 'An error occurred while processing your request.',
      });
    }
  };

/*
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
*/
/*
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
  /*
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
*/
/*
const getAllDoctorsPaginated = async (req, res) => {
  // Get the page number from the request
  const pageNumber = req.query.pageNumber || 1;

  // Get the doctors for the page
  const doctors = await User.find({
    isDoctor: true,
  })
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
  /////// search for doctors
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

*/

module.exports = {
  fetchDoctorsWithFullInfo,
  signUpAsDoctor,
  viewDoctor,
  updateDoctorInfo,
  updateDoctorAccountInfo,
  viewDoctorInfo
};
