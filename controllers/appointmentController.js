const moment = require("moment");
const Appointment = require("../models/Appointment");
const DoctorInfo = require("../models/DoctorInfo");
const User = require("../models/User");
const Patient = require("../models/User");
const transporter = require("../utilities/transporter");
//const moment = require('moment');
const mongoose = require("mongoose");

const createAppointmentNotification = require("./doctor/createAppointmentNotification");
const generateBookingId = require("../utilities/bookingId");
//const { populateDoctorFields, populatePatientFields } = require('../middleware/populateFields');

const createAppointment = async (doctorId, appointments) => {
  try {
    if (
      !doctorId ||
      !Array.isArray(appointments) ||
      appointments.length === 0
    ) {
      return { success: false, message: "Invalid input data" };
    }

    // Check if the doctor exists
    const doctor = await DoctorInfo.findOne({ user: doctorId });

    if (!doctor) {
      return { success: false, message: "Doctor not found" };
    }

    // Create an array to store created appointments
    const createdAppointments = [];

    for (const appointmentData of appointments) {
      const { date, schedule } = appointmentData;

      if (!date || !Array.isArray(schedule) || schedule.length === 0) {
        return { success: false, message: "Invalid appointment data" };
      }

      // Check if there's an existing appointment for the same date
      const existingAppointment = await Appointment.findOne({
        doctor: doctorId,
        date,
      });

      if (existingAppointment) {
        // If an appointment for the same date exists, check for duplicate startTime
        const duplicateStartTime = schedule.some((newSchedule) =>
          existingAppointment.schedule.some(
            (existingSchedule) =>
              existingSchedule.startTime === newSchedule.startTime
          )
        );

        if (duplicateStartTime) {
          return {
            success: false,
            message: "Duplicate startTime in the same schedule",
          };
        }

        // Add the new schedule to the existing appointment
        existingAppointment.schedule.push(...schedule);

        // Save the updated appointment
        await existingAppointment.save();

        // Add the updated appointment to the createdAppointments array
        createdAppointments.push(existingAppointment);
      } else {
        // If no appointment for the same date exists, create a new appointment
        const newAppointment = new Appointment({
          doctor: doctorId,
          date,
          schedule,
        });

        // Save the new appointment
        const createdAppointment = await newAppointment.save();

        // Add the appointment's _id to the doctor's appointments array
        doctor.appointments.push(createdAppointment._id);
        await doctor.save();

        // Add the created appointment to the createdAppointments array
        createdAppointments.push(createdAppointment);
      }
    }

    return {
      success: true,
      message: "Appointments created/updated successfully",
      appointments: createdAppointments,
    };
  } catch (error) {
    console.error("Error creating/updating appointments:", error.message);
    return { success: false, message: "Internal server error" };
  }
};

///////// USER TO BOOK APPOINTMENT
//const { populateDoctorFields, populatePatientFields } = require('../middleware/populateFields');
// Middleware to populate doctor and patient details
const populateDoctorFields = async (req, res, next) => {
  const { doctorId } = req.params;

  try {
    const doctor = await DoctorInfo.findById(doctorId).populate("user");
    if (!doctor) {
      return res
        .status(404)
        .json({ message: `Doctor with ID ${doctorId} not found.` });
    }

    req.doctor = {
      id: doctor._id,
      userIdOfDoctor: doctor.user._id,
      firstName: doctor.user.firstName,
      lastName: doctor.user.lastName,
      doctorEmail: doctor.user.email,
      gender: doctor.user.gender,
      role: doctor.user.role,
      status: doctor.user.status,
      specialty: doctor.specialty,
      rate: doctor.rate,
      // ... add more fields as needed
    };

    next();
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "An error occurred while populating doctor fields." });
  }
};

const populatePatientFields = async (req, res, next) => {
  const { patientId } = req.params;

  try {
    const patient = await User.findById(patientId).select(
      "firstName lastName dob phone email allergies phoneNumber role"
    );
    if (!patient) {
      return res
        .status(404)
        .json({ message: `Patient with ID ${patientId} not found.` });
    }

    req.patient = {
      id: patient._id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      dob: patient.dob,
      phoneNumber: patient.phone,
      patientEmail: patient.email,
      allergies: patient.allergies,
      role: patient.role,
      // ... add more fields as needed
    };

    next();
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "An error occurred while populating patient fields." });
  }
};

const bookAppointment = async (req, res) => {
  const { doctorId, patientId } = req.params;
  const { appointmentId, startTime } = req.body;

  try {
    // Find the doctor
    const doctor = await User.findById(doctorId);

    if (!doctor || doctor.role !== "isDoctor") {
      return res.status(404).json({ message: `Doctor not found.` });
    }

    // Find the patient (user)
    const patient = await User.findById(patientId).select("firstName lastName");

    if (!patient) {
      return res.status(404).json({ message: `Account not found.` });
    }

    // Find the appointment
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: `Appointment not found.` });
    }

    // Check if the specified startTime exists in the appointment's schedule
    const scheduleSlot = appointment.schedule.find(
        (slot) => slot.startTime === startTime
    );

    if (!scheduleSlot) {
      return res.status(400).json({ message: "Invalid appointment time." });
    }

    // Check if the appointment slot is already booked
    if (scheduleSlot.status === "Booked") {
      return res
          .status(400)
          .json({ message: "This appointment slot is already booked." });
    }

    // Create a copy of the original schedule slot status
    const originalStatus = scheduleSlot.status;

    // Update the schedule slot status, assign patientId and bookingId
    scheduleSlot.status = "Booked";
    scheduleSlot.patient = patientId;
    scheduleSlot.bookingId = generateBookingId();

    // Save the updated appointment
    await appointment.save();

    // Call the function to create a notification
    await createAppointmentNotification(doctorId, patientId, {
      date: appointment.date, // Pass the 'date' property
      startTime: startTime, // Pass the appointment startTime
    });

    // Only update the appointment status if the booking was successful
    if (originalStatus !== "Booked") {
      appointment.status = "Booked";
      await appointment.save();
    }

    return res.status(200).json({
      message: "Appointment booked successfully.",
      appointment: {
        _id: appointment._id,
        date: appointment.date,
        doctorId: appointment.doctor,
        bookedAppointment: scheduleSlot, // Return the booked appointment slot
      },
    });
  } catch (error) {
    // console.error(error);
    return res
        .status(500)
        .json({ message: "An error occurred while booking the appointment." });
  }
};


const deleteAppointmentByID = async (req, res) => {
  const { scheduleId } = req.params;

  try {
    // Find and delete the appointment by schedule ID
    const deletedAppointment = await Appointment.findOneAndDelete({ "schedule._id": scheduleId });

    if (!deletedAppointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    res.status(200).json({ message: "Appointment deleted successfully." });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};





///////UPDATE  PPOINTMENT
const updateAppointment = async (req, res) => {
  const { doctorId, appointmentId, bookingId } = req.params;
  const { startTime, endTime, status } = req.body;

  try {
    // Find the doctor
    const doctor = await DoctorInfo.findById(doctorId);

    if (!doctor) {
      return res
        .status(404)
        .json({ message: `Doctor with ID ${doctorId} not found.` });
    }

    // Find the appointment index in the doctor's availableTimeSlots array
    const appointmentIndex = doctor.availableTimeSlots.findIndex(
      (appointment) =>
        appointment._id.toString() === appointmentId &&
        appointment.bookingId.toString() === bookingId
    );

    if (appointmentIndex === -1) {
      return res.status(404).json({ message: `Appointment not found.` });
    }

    const updatedAppointment = doctor.availableTimeSlots[appointmentIndex];

    // Update fields if provided
    if (startTime) {
      updatedAppointment.startTime = startTime;
    }
    if (endTime) {
      updatedAppointment.endTime = endTime;
    }
    if (status) {
      updatedAppointment.status = status;
    }

    // Update the updatedAt timestamp
    updatedAppointment.updatedAt = new Date();

    // Update the appointment in the doctor's availableTimeSlots array
    doctor.availableTimeSlots[appointmentIndex] = updatedAppointment;

    // Update the appointment in the patient's bookedAppointments field
    const patient = await User.findOne({
      "bookedAppointments._id": appointmentId,
    });
    if (patient) {
      const patientAppointmentIndex = patient.bookedAppointments.findIndex(
        (appointment) => appointment._id.toString() === appointmentId
      );
      if (patientAppointmentIndex !== -1) {
        patient.bookedAppointments[patientAppointmentIndex] =
          updatedAppointment;
        await patient.save();
      }
    }

    // Save the doctor's changes
    await doctor.save();

    return res.status(200).json({
      message: `Appointment updated successfully.`,
      updatedAppointment,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: `An error occurred while updating the appointment.` });
  }
};

const getDoctorScheduledAppointments = async (req, res) => {
  const { doctorId } = req.params;

  try {
    const doctorAppointments = await Appointment.find({
      doctor: doctorId,
      "appointments.status": "Scheduled",
    });

    const formattedAppointments = doctorAppointments.map((appointment) => {
      const appointmentInfo = appointment.appointments[0];

      return {
        date: appointment.date,
        doctor: appointment.doctor,
        startTime: appointmentInfo.startTime,
        endTime: appointmentInfo.endTime,
        status: appointmentInfo.status,
        createdAt: appointmentInfo.createdAt,
        updatedAt: appointmentInfo.updatedAt,
      };
    });

    return res.status(200).json(formattedAppointments);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "An error occurred while fetching doctor appointments.",
    });
  }
};

///// new: GET ALL BOOKED APPOINTMENTS
const fetchBookedAppointments = async (req, res) => {
  try {
    const bookedAppointments = await Appointment.find({
      "appointments.bookingId": { $ne: null },
    })
      .populate("doctor")
      .populate({
        path: "appointments.patient",
        model: "User", // Assuming the model name is 'User'
        select: "firstName lastName email phoneNumber", // Select the fields you want to populate
      });

    const formattedAppointments = bookedAppointments.map((appointment) => {
      return {
        _id: appointment._id,
        date: appointment.date,
        doctorId: appointment.doctor ? appointment.doctor._id : null,
        doctorName: appointment.doctor
          ? `${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`
          : null,
        doctorSpecialty: appointment.doctor
          ? appointment.doctor.specialty
          : null,
        appointments: appointment.appointments.map((appt) => {
          const patientInfo = appt.patient
            ? {
                patientId: appt.patient._id,
                patientName: `${appt.patient.firstName} ${appt.patient.lastName}`,
                patientEmail: appt.patient.email,
                patientPhoneNumber: appt.patient.phoneNumber,
              }
            : null;

          return {
            startTime: appt.startTime,
            endTime: appt.endTime,
            status: appt.status,
            bookingId: appt.bookingId,
            patientId: appt.patient ? appt.patient._id : null,
            createdAt: appt.createdAt,
            updatedAt: appt.updatedAt,
            ...patientInfo,
          };
        }),
      };
    });

    return res.status(200).json(formattedAppointments);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: `An error occurred while fetching booked appointments.`,
    });
  }
};

///// FOR COMPLETED APPOINTMEN
const fetchCompletedAppointments = async (req, res) => {
  try {
    const completedAppointments = await Appointment.find({
      "appointments.status": "Completed",
    })
      .populate("doctor")
      .populate("appointments.patient");

    const formattedAppointments = completedAppointments.map((appointment) => {
      return {
        _id: appointment._id,
        date: appointment.date,
        doctorId: appointment.doctor ? appointment.doctor._id : null,
        doctorName: appointment.doctor
          ? `${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`
          : null,
        doctorSpecialty: appointment.doctor
          ? appointment.doctor.specialty
          : null,
        appointments: appointment.appointments.map((appt) => {
          const patientInfo = appt.patient
            ? {
                patientId: appt.patient._id,
                patientName: `${appt.patient.firstName} ${appt.patient.lastName}`,
                patientEmail: appt.patient.email,
                patientPhoneNumber: appt.patient.phoneNumber,
              }
            : null;

          return {
            startTime: appt.startTime,
            endTime: appt.endTime,
            status: appt.status,
            bookingId: appt.bookingId,
            patientId: appt.patient ? appt.patient._id : null,
            createdAt: appt.createdAt,
            updatedAt: appt.updatedAt,
            ...patientInfo,
          };
        }),
      };
    });

    return res.status(200).json(formattedAppointments);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: `An error occurred while fetching completed appointments.`,
    });
  }
};

//// view doctor and list of appointment. doctor's profile from user profile, and from doctor's information and times slots
// Controller function to fetch booked appointments for each doctor
const getBookedAppointmentsForDoctors = async (req, res) => {
  try {
    // Fetch all booked appointments
    const bookedAppointments = await Appointment.find({ status: "Booked" })
      .populate({
        path: "doctor",
        model: "DoctorInfo",
        populate: {
          path: "user",
          model: "User",
        },
      })
      .populate("patient") // Populate patient information
      .sort({ date: 1 }); // Sort appointments by date in ascending order

    // Map appointments and format the data
    const formattedAppointments = bookedAppointments.map((appointment) => ({
      doctor: {
        DoctorId: appointment.doctor._id,
        name: `${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`,
        email: appointment.doctor.user.email,
        Phone: appointment.doctor.user.phoneNumber,
        specialty: appointment.doctor.specialty, // Include doctor's specialty
        rate: appointment.doctor.rate, // Include doctor's rate
        // Other doctor's information from DoctorInfo model
        // ...
      },

      /////// fetch patient informtion
      patient: {
        patientId: appointment.patient._id,
        name: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
        email: appointment.patient.email,
        address: appointment.patient.address,
        phoneNumber: appointment.patient.phoneNumber,
        allergies: appointment.patient.allergies,
      },
      // Other appointment information
      AppointmentId: appointment._id,
      date: appointment.date,
      startTime: appointment.timeSlot.startTime,
      endTime: appointment.timeSlot.endTime,
      status: appointment.status,
      Created: appointment.createdAt,
      Updated: appointment.updatedAt,
      // ...
    }));

    // Return the formatted data
    return res.status(200).json({
      status: "success",
      message: "Fetched booked appointments successfully.",
      data: formattedAppointments,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "failed",
      message: "An error occurred while fetching booked appointments.",
    });
  }
};

///////// FET COMPLETED APPOINTENT FOR EACH DOCTOR (ASIN ONE DOCTOR SEEING ALL HIS COMLETED APPOINTMENT)
const getCompletedAppointmentsForDoctor = async (req, res) => {
  const doctorId = req.params.doctorId;

  try {
    // Fetch all completed appointments for the specific doctor
    const completedAppointments = await Appointment.find({
      doctor: doctorId,
      status: "completed",
    })
      .populate({
        path: "doctor",
        model: "DoctorInfo",
        populate: {
          path: "user",
          model: "User",
        },
      })
      .populate("patient")
      .sort({ date: 1 });

    // Map appointments and format the data
    const formattedAppointments = completedAppointments.map((appointment) => {
      if (!appointment.doctor || !appointment.patient) {
        return null;
      }

      const doctor = appointment.doctor;
      const patient = appointment.patient;

      return {
        doctor: {
          DoctorId: doctor._id,
          name: `${doctor.user.firstName} ${doctor.user.lastName}`,
          email: doctor.user.email,
          Phone: doctor.user.phoneNumber,
          specialty: doctor.specialty,
          rate: doctor.rate,
          // Other doctor's information from DoctorInfo model
          // ...
        },
        patient: {
          patientId: patient._id,
          name: `${patient.firstName} ${patient.lastName}`,
          email: patient.email,
          address: patient.address,
          phoneNumber: patient.phoneNumber,
          allergies: patient.allergies,
          // ...
        },
        AppointmentId: appointment._id,
        date: appointment.date,
        startTime: appointment.timeSlot.startTime,
        endTime: appointment.timeSlot.endTime,
        status: appointment.status,
        Created: appointment.createdAt,
        Updated: appointment.updatedAt,
        // ...
      };
    });

    // Remove any null entries
    const validAppointments = formattedAppointments.filter(
      (appointment) => appointment !== null
    );

    // Return the formatted data
    return res.status(200).json({
      status: "success",
      message:
        "Fetched completed appointments for the specific doctor successfully.",
      data: validAppointments,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "failed",
      message:
        "An error occurred while fetching completed appointments for the specific doctor.",
    });
  }
};

////// get booked appointment for single Doctor
const fetchBookedAppointmentsByDoctor = async (req, res) => {
  try {
    const doctors = await DoctorInfo.find();
    const bookedAppointmentsByDoctor = [];

    for (const doctor of doctors) {
      const bookedAppointments = doctor.availableTimeSlots
        .filter((slot) => slot.status === "Booked")
        .map((slot) => {
          return {
            date: slot.date,
            doctorId: doctor._id,
            doctorName: `${doctor.user.firstName} ${doctor.user.lastName}`,
            appointments: slot.appointments.map((appt) => {
              return {
                startTime: appt.startTime,
                endTime: appt.endTime,
                status: appt.status,
                bookingId: appt.bookingId,
                patientId: appt.patient ? appt.patient._id : null,
                createdAt: appt.createdAt,
                updatedAt: appt.updatedAt,
              };
            }),
          };
        });

      bookedAppointmentsByDoctor.push(...bookedAppointments);
    }

    return res.status(200).json(bookedAppointmentsByDoctor);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: `An error occurred while fetching booked appointments by doctor.`,
    });
  }
};

////// fetch all the appointment for each Doctor
const getBookedAppointmentsForDoctor = async (req, res) => {
  const doctorId = req.params.doctorId; // Extract doctorId from the request parameters

  try {
    // Fetch all booked appointments for the specified doctor
    const bookedAppointments = await Appointment.find({
      doctor: doctorId,
      status: "Booked",
    })
      .populate({
        path: "doctor",
        model: "DoctorInfo",
        populate: {
          path: "user",
          model: "User",
        },
      })
      .populate("patient") // Populate patient information
      .sort({ date: 1 }); // Sort appointments by date in ascending order

    // Map appointments and format the data
    const formattedAppointments = bookedAppointments.map((appointment) => ({
      doctor: {
        name: `${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`,
        email: appointment.doctor.user.email,
        specialty: appointment.doctor.specialty, // Include doctor's specialty
        rate: appointment.doctor.rate, // Include doctor's rate
        // Other doctor's information from DoctorInfo model
        // ...
      },
      patient: {
        name: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
        email: appointment.patient.email,
        address: appointment.patient.address,
        phoneNumber: appointment.patient.phoneNumber,
        allergies: appointment.patient.allergies,
      },
      // Other appointment information

      appointmentId: appointment._id,
      date: appointment.date,
      startTime: appointment.timeSlot.startTime,
      endTime: appointment.timeSlot.endTime,
      Status: appointment.status,
      Created: appointment.createdAt,
      Updated: appointment.updatedAt,
      // ...
    }));

    // Return the formatted data
    return res.status(200).json({
      status: "success",
      message: "Fetched booked appointments for the doctor successfully.",
      data: formattedAppointments,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "failed",
      message:
        "An error occurred while fetching booked appointments for the doctor.",
    });
  }
};

module.exports = {
  createAppointment,
  bookAppointment,
  updateAppointment,
  getDoctorScheduledAppointments,
  getCompletedAppointmentsForDoctor,
  fetchBookedAppointments,
  fetchCompletedAppointments,
  fetchBookedAppointmentsByDoctor,
  populateDoctorFields,
  populatePatientFields,
  deleteAppointmentByID

  //deleteAppointment,
  //viewAppointments,
};
