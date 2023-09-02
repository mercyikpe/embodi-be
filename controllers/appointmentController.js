const moment = require("moment");
const Appointment = require("../models/Appointment");
const DoctorInfo = require("../models/DoctorInfo");
const User = require("../models/User");
const Patient = require("../models/User");
const transporter = require("../utilities/transporter");
//const moment = require('moment');
const mongoose = require("mongoose");
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

      // Check if there's an existing appointment for the same date and time
      const existingAppointment = await Appointment.findOne({
        doctor: doctorId,
        date,
        "schedule.startTime": schedule[0].startTime,
      });

      if (existingAppointment) {
        return {
          success: false,
          message: "Appointment date and time already exist",
        };
      }

      // Create a new appointment associated with the doctor
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

      // Add the created appointment to the array
      createdAppointments.push(createdAppointment);
    }

    return {
      success: true,
      message: "Appointments created successfully",
      appointments: createdAppointments,
    };
  } catch (error) {
    console.error("Error creating appointments:", error.message);
    return { success: false, message: "Internal server error" };
  }
};

////// i just suspended this this night 08 21 - 146am
const createAppointments = async (doctorId, date, appointments) => {
  try {
    const doctorInfo = await DoctorInfo.findById(doctorId).populate("user");

    if (!doctorInfo) {
      return { error: "Doctor not found" };
    }

    const startTimeFormatted = moment(
      `${date} ${appointments[0].startTime}`,
      "YYYY-MM-DD HH:mm"
    ).toISOString();
    const endTimeFormatted = moment(
      `${date} ${appointments[0].endTime}`,
      "YYYY-MM-DD HH:mm"
    ).toISOString();

    // Check if the new appointment conflicts with existing appointments
    const existingAppointments = await Appointment.find({
      doctor: doctorId,
      date,
      "appointments.startTime": { $lt: endTimeFormatted },
      "appointments.endTime": { $gt: startTimeFormatted },
    });

    if (existingAppointments.length > 0) {
      const errors = [];
      for (const appointment of existingAppointments) {
        const appointmentStartTime = moment(
          appointment.appointments[0].startTime,
          "HH:mm"
        ).toISOString();
        const appointmentEndTime = moment(
          appointment.appointments[0].endTime,
          "HH:mm"
        ).toISOString();

        const startTimeOverlaps =
          moment(startTimeFormatted).isBefore(appointmentEndTime) &&
          moment(startTimeFormatted).isSameOrAfter(appointmentStartTime);
        const endTimeOverlaps =
          moment(endTimeFormatted).isAfter(appointmentStartTime) &&
          moment(endTimeFormatted).isSameOrBefore(appointmentEndTime);

        if (startTimeOverlaps || endTimeOverlaps) {
          errors.push({
            type: "overlapping",
            message:
              "The requested time slot overlaps with another appointment.",
          });
        }
      }

      if (errors.length > 0) {
        return {
          error: "The requested time slot is not available.",
          details: errors,
        };
      }
    }

    const appointment = await Appointment.findOneAndUpdate(
      {
        doctor: doctorId,
        date,
        $nor: [
          {
            "appointments.startTime": { $eq: startTimeFormatted },
          },
          {
            "appointments.endTime": { $eq: endTimeFormatted },
          },
        ],
      },
      {
        $push: { appointments: appointments[0] },
      },
      { new: true }
    );

    if (!appointment) {
      const newAppointmentData = {
        date,
        doctor: doctorInfo.user,
        appointments,
      };

      const newAppointment = new Appointment(newAppointmentData);
      await newAppointment.save();

      const appointmentId = newAppointment._id;

      // Update the doctor's availableTimeSlots field
      doctorInfo.availableTimeSlots.push({
        date,
        startTime: moment(startTimeFormatted).format("HH:mm"),
        endTime: moment(endTimeFormatted).format("HH:mm"),
        status: "Scheduled",
        //patientId
      });
      await doctorInfo.save();

      //// APPOINTMENT ID

      // Get the doctor's email address from the User model
      const doctorEmail = doctorInfo.user.email;
      const doctorId = doctorInfo._id;
      const doctorName = `${doctorInfo.user.firstName} ${doctorInfo.user.lastName}`;
      const doctorPhone = doctorInfo.user.phoneNumber;
      const doctorGender = doctorInfo.user.gender;
      const doctorSpecialty = doctorInfo.specialty;
      const doctorRate = doctorInfo.rate;

      // Send email to doctor to confirm appointment creation
      const doctorMailOptions = {
        from: process.env.AUTH_EMAIL,
        to: doctorEmail,
        subject: `Appointment Created For ${doctorName}`,
        html: `
          <h1>Appointment Created </h1>
          <p> Hi ${doctorName}, An appointment has been created for you on ${date} from ${moment(
          startTimeFormatted
        ).format("HH:mm")} to ${moment(endTimeFormatted).format("HH:mm")}.</p>
        `,
      };

      transporter.sendMail(doctorMailOptions, (error, info) => {
        if (error) {
          console.log(error);
        } else {
          console.log("Doctor email sent to: " + doctorName, "|", doctorEmail);
        }
      });

      const doctorDetails = {
        appointmentId,
        doctorId,
        doctorName,
        doctorEmail,
        doctorPhone,
        doctorGender,
        doctorSpecialty,
        doctorRate,
      };

      return {
        success: true,
        appointmentId,
        appointment: newAppointment,
        doctorDetails,
        appointmentId,
      };
      console.log(newAppointment, doctorDetails, appointmentId);
    }

    return { success: true, appointment };
  } catch (error) {
    console.error("Error:", error);
    return {
      error: "An error occurred while processing the appointment request.",
    };
  }
};

/// recent commentented to test something
const createAppointmentddd = async (doctorId, date, appointments) => {
  try {
    const doctorInfo = await DoctorInfo.findOne({ user: doctorId });

    if (!doctorInfo) {
      return { error: "Doctor not found" };
    }

    const startTimeFormatted = moment(
      `${date} ${appointments[0].startTime}`,
      "YYYY-MM-DD HH:mm"
    ).toISOString();
    const endTimeFormatted = moment(
      `${date} ${appointments[0].endTime}`,
      "YYYY-MM-DD HH:mm"
    ).toISOString();

    // Check if the date already exists in the Appointment collection
    const existingAppointments = await Appointment.find({
      doctor: doctorId,
      date,
    });

    if (existingAppointments.length === 0) {
      // The date does not exist, create a new document
      const newAppointmentData = {
        date,
        doctor: doctorInfo.user,
        appointments,
      };

      const newAppointment = new Appointment(newAppointmentData);
      await newAppointment.save();

      // Add the new appointment to the doctor's available time slots
      const updatedAvailableTimeSlots = doctorInfo.availableTimeSlots.concat({
        date,
        startTime: moment(startTimeFormatted).format("HH:mm"),
        endTime: moment(endTimeFormatted).format("HH:mm"),
      });

      // Update the doctor's availableTimeSlots field
      doctorInfo.availableTimeSlots = updatedAvailableTimeSlots;
      await doctorInfo.save();

      // Get the doctor's email address from the User model
      const doctorEmail = doctorInfo.user.email;

      // Send email to doctor to confirm appointment creation
      const doctorMailOptions = {
        from: process.env.AUTH_EMAIL,
        to: doctorEmail,
        subject: "Appointment Created",
        html: `
          <h1>Appointment Created</h1>
          <p>An appointment has been created for you on ${date} from ${moment(
          startTimeFormatted
        ).format("HH:mm")} to ${moment(endTimeFormatted).format("HH:mm")}.</p>
        `,
      };

      transporter.sendMail(doctorMailOptions, (error, info) => {
        if (error) {
          console.log(error);
        } else {
          console.log("Doctor email sent: " + info.response);
        }
      });

      return { success: true, appointment: newAppointment };
    } else {
      // The date exists, find the existing document
      const existingAppointment = existingAppointments[0];

      // Push the new appointment to the existing document
      existingAppointment.appointments.push(appointments[0]);

      // Save the updated document
      await existingAppointment.save();

      return { success: true, appointment: existingAppointment };
    }
  } catch (error) {
    console.error("Error:", error);
    return {
      error: "An error occurred while processing the appointment request.",
    };
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
  const { appointmentId, appointments } = req.body;
  const patientId = appointments[0].patientId;

  // Generate a new bookingId using the generateBookingId function
  function generateBookingId() {
    const min = 1000000000; // Minimum 10-digit number
    const max = 9999999999; // Maximum 10-digit number
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  const newBookingId = generateBookingId();

  try {
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        message: `Appointment with ID ${appointmentId} not found.`,
      });
    }

    const foundAppointment = appointment.appointments.find(
      (appointment) => appointment.startTime === appointments[0].startTime
    );

    // Check if foundAppointment is defined
    if (foundAppointment) {
      // Check if appointment is already booked
      if (!foundAppointment.bookingId) {
        // Generate a new bookingId
        foundAppointment.newBookingId = newBookingId;
        foundAppointment.bookingId = newBookingId;
        foundAppointment.status = "Booked";
        foundAppointment.patient = patientId;

        // Populate doctor and patient fields using middleware
        await populateDoctorFields(req, res, async () => {
          await populatePatientFields(req, res, async () => {
            const doctorInfo = req.doctor; // Populated doctor details
            const patient = req.patient;

            // Update the appointment logic here, if needed

            await appointment.save();

            // Find the specific appointment index
            const appointmentIndex = appointment.appointments.findIndex(
              (appt) => appt.startTime === foundAppointment.startTime
            );

            /*
            // Send email notifications to doctor and patient
    const doctorMailOptions = {
      from: process.env.AUTH_EMAIL,
      to: doctorEmail,
      subject: 'Appointment Booked',
      html: `
        <h1>Appointment Booked</h1>
        <p> Hi, Dr. ${doctorName}, A Patient ${patient.firstName} ${patient.lastName} has booked an appointment with you  on ${appointment.date} from ${appointment.timeSlot.startTime} to ${appointment.timeSlot.endTime}.</p>
      `,
    };

    transporter.sendMail(doctorMailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log('Doctor email sent: ' + info.response);
      }
    });

    const patientMailOptions = {
      from: process.env.AUTH_EMAIL,
      to: patient.email,
      subject: 'Appointment Booked',
      html: `
        <h1> Appointment Succesfully Booked</h1>
        <p> Hi, ${patient.lastName} You have successfully booked an appointment with Dr. ${doctorName} on ${appointment.date} from ${appointment.timeSlot.startTime} to ${appointment.timeSlot.endTime}.</p>
      `,
    };

    transporter.sendMail(patientMailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log('Patient email sent: ' + info.response);
      }
    });

    */

            // Return the updated appointment model
            return res.status(200).json({
              message: `Appointment booked successfully.`,
              appointment: {
                _id: appointment._id,
                date: appointment.date,
                doctorId: appointment.doctor,
                appointments: appointment.appointments,
              },
              appointmentIndex, // Include the appointmentIndex
              doctor: doctorInfo,
              patient,
            });
          });
        });
      } else {
        // Appointment is already booked
        return res.status(400).json({
          message: `This appointment is already booked.`,
        });
      }
    } else {
      // Appointment does not exist
      return res.status(404).json({
        message: `Appointment with startTime ${appointments[0].startTime} does not exist.`,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: `An error occurred while booking the appointment.`,
    });
  }
};

// ... other code ...

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

  bookAppointment,
  populateDoctorFields,
  populatePatientFields,

  //deleteAppointment,
  //viewAppointments,
};
