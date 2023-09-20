////// SCHEMA MODELS
const User = require("../models/User");
const DoctorInfo = require("../models/DoctorInfo");
const OtpCode = require("../models/OtpCode");
const Appointment = require("../models/Appointment");
const Disease = require("../models/Disease");
const Questionnaire = require("../models/Questionnaire");
const EventLog = require("../models/EventLog");

///////  MIDDLEWARES

//////  CONTROLLERS
const userController = require("../controllers/userController");

//////UPDATE ADMIN PROFILE
const updateAdminProfile = async (userId, updateData) => {
  try {
    // Find the admin user with the given userId and role "isAdmin"
    const admin = await User.findOne({ _id: userId, role: "isAdmin" });

    if (!admin) {
      throw new Error("Admin user not found or not authorized.");
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
      return { success: false, message: "User not found." };
    }

    if (!user.role === "isAdmin") {
      return { success: false, message: "User is not authorized as an admin." };
    }

    user.phoneNumber = phoneNumber || user.phoneNumber;
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;

    await user.save();

    return {
      success: true,
      message: "User information updated successfully.",
      user,
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: "An error occurred while updating user information.",
    };
  }
};

const viewAllAdmins = async () => {
  try {
    const admins = await User.find({ role: "isAdmin" }).select(
      "firstName lastName email"
    );
    return admins;
  } catch (error) {
    throw error; // Rethrow the error to be caught in the calling function
  }
};

const viewDoctorDetails = async (req, res, next) => {
  try {
    const { doctorId } = req.params;

    // Find the doctor by ID
    const doctor = await User.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({
        status: 404,
        message: "Doctor not found.",
        data: null,
      });
    }

    // Find the doctor's appointments
    const doctorAppointments = await Appointment.find({ doctor: doctorId });

    if (!doctorAppointments) {
      return res.status(404).json({
        status: 404,
        message: "Doctor's appointments not found.",
        data: null,
      });
    }

    // Populate patient details if the patient field exists
    await Appointment.populate(doctorAppointments, {
      path: "schedule.patient",
      select: "firstName lastName", // Select the fields you want to populate
    });

    // Extract and group schedule objects by status
    const groupedSchedules = {
      booked: [],
      completed: [],
    };

    doctorAppointments.forEach((appointment) => {
      appointment.schedule.forEach((schedule) => {
        if (schedule.status === "Booked") {
          groupedSchedules.booked.push(schedule);
        } else if (schedule.status === "Completed") {
          groupedSchedules.completed.push(schedule);
        }
      });
    });

    // Return the doctor's details and grouped schedules
    res.status(200).json({
      status: 200,
      message: "Doctor details retrieved successfully.",
      data: {
        doctor: {
          firstName: doctor.firstName,
          lastName: doctor.lastName,
          // Include other doctor details here
        },
        schedules: groupedSchedules,
      },
    });
  } catch (error) {
    next(error);
  }
};


// Function to retrieve all appointments (both completed and scheduled)
const getAllAppointments = async (req, res) => {
  try {
    // Retrieve all appointments
    const appointments = await Appointment.find();

    // Initialize empty arrays for scheduled and completed schedules
    const scheduledSchedules = [];
    const completedSchedules = [];

    // Iterate through appointments and separate schedules based on their status
    appointments.forEach((appointment) => {
      appointment.schedule.forEach((schedule) => {
        if (schedule.status === "Scheduled") {
          scheduledSchedules.push(schedule);
        } else if (schedule.status === "Completed") {
          completedSchedules.push(schedule);
        }
      });
    });

    return res.status(200).json({
      status: "success",
      message: "All appointments retrieved.",
      data: {
        scheduledSchedules,
        completedSchedules,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "failed",
      message: "An error occurred while retrieving appointments.",
    });
  }
};


module.exports = {
  updateAdminProfile,
  updateUserByAdmin,
  viewAllAdmins,
  viewDoctorDetails,
  getAllAppointments
};
