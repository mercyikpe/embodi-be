const User = require("../../models/User");
const Appointment = require("../../models/Appointment");
const {Types} = require("mongoose");
const mongoose = require('mongoose'); // Import mongoose

// Controller to mark an appointment as completed by a doctor
const markAppointmentAsCompleted = async (req, res) => {
  const { doctorId, appointmentId, scheduleId } = req.params;

  try {
    // Find the appointment based on the appointmentId
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    // Find the schedule you want to mark as completed
    const scheduleToMarkAsCompleted = appointment.schedule.find(
      (schedule) => schedule._id.toString() === scheduleId
    );

    // console.log('scheduleToMarkAsCompleted', scheduleToMarkAsCompleted)

    if (!scheduleToMarkAsCompleted) {
      return res.status(404).json({ message: "Schedule not found." });
    }

    // Retrieve the doctor's information
    const doctor = await User.findById(appointment.doctor);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    // Check if the authenticated doctor owns the appointment
    if (appointment.doctor.toString() !== doctorId) {
      return res
        .status(403)
        .json({ message: "Access denied. You do not own this appointment." });
    }

    // Check if the schedule is already marked as "Completed"
    if (scheduleToMarkAsCompleted.status === "Completed") {
      return res
        .status(400)
        .json({ message: "Schedule is already marked as completed." });
    }

    // // Retrieve the patient's information from the schedule
    // const patientId = scheduleToMarkAsCompleted.patient;
    //
    // const patient = await User.findById(patientId);
    //
    // console.log('patient', patient)
    //
    // if (!patient) {
    //   return res.status(404).json({ message: "Patient not found." });
    // }

    // Update the status of the schedule to "Completed"
    scheduleToMarkAsCompleted.status = "Completed";

    // Save the updated appointment
    await appointment.save();

    // Add the completed appointment to the doctor's and patient's past appointments
    const completedAppointment = appointment._id; // Use the ObjectId of the appointment

    doctor.pastAppointments.push(completedAppointment);
    // patient.pastAppointments.push(completedAppointment);

    // Save the updated doctor and patient data
    await doctor.save();
    // await patient.save();

    // Respond with a success message
    return res
      .status(200)
      .json({ message: "Appointment marked as completed." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "An error occurred while marking the appointment as completed.",
    });
  }
};


const getBookedAndCompletedAppointments = async (req, res, next) => {
  const { doctorId } = req.params;

  try {
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
      path: 'schedule.patient',
      select: 'firstName lastName', // Select the fields you want to populate
    });

    // Extract and group schedule objects by status
    const groupedSchedules = {
      upcoming: [],
      completed: [],
    };

    doctorAppointments.forEach((appointment) => {
      appointment.schedule.forEach((schedule) => {
        if (schedule.status === 'Booked') {
          groupedSchedules.upcoming.push(schedule);
        } else if (schedule.status === 'Completed') {
          groupedSchedules.completed.push(schedule);
        }
      });
    });

    res.status(200).json({
      status: 200,
      message: 'Doctor appointments retrieved successfully.',
      data: groupedSchedules,
    });
  } catch (error) {
    next(error);
  }

};



const getBookedAndCompletedAppointmentsd = async (req, res, next) => {
  try {
    const bookedAppointments = await Appointment.aggregate([
      {
        $match: {
          'schedule.status': 'Booked',
        },
      },
      {
        $unwind: '$schedule',
      },
      {
        $match: {
          'schedule.status': 'Booked',
        },
      },
      {
        $lookup: {
          from: 'users', // Replace with the actual collection name for patients
          localField: 'schedule.patient',
          foreignField: '_id',
          as: 'patientDetails',
        },
      },
      {
        $project: {
          'patientDetails.firstName': 1,
          'patientDetails.lastName': 1,
          'schedule.startTime': 1,
          'schedule.endTime': 1,
          'schedule.status': 1,
        },
      },
    ]);

    const completedAppointments = await Appointment.aggregate([
      {
        $match: {
          'schedule.status': 'Completed',
        },
      },
      {
        $unwind: '$schedule',
      },
      {
        $match: {
          'schedule.status': 'Completed',
        },
      },
      {
        $lookup: {
          from: 'users', // Replace with the actual collection name for patients
          localField: 'schedule.patient',
          foreignField: '_id',
          as: 'patientDetails',
        },
      },
      {
        $project: {
          'patientDetails.firstName': 1,
          'patientDetails.lastName': 1,
          'schedule.startTime': 1,
          'schedule.endTime': 1,
          'schedule.status': 1,
        },
      },
    ]);

    res.status(200).json({
      status: 200,
      message: 'Booked and completed appointments retrieved successfully.',
      data: {
        bookedAppointments,
        completedAppointments,
      },
    });
  } catch (error) {
    next(error);
  }
};





const completedAndUpcomingAppointments = async (req, res, next) => {
  try {
    // Fetch booked and completed appointments for a specific doctor
    const doctorId = req.params.doctorId;

    const doctor = await User.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({
        status: 404,
        message: "Doctor not found.",
        data: null,
      });
    }

    const completedAppointments = await Appointment.aggregate([
      {
        $match: {
          doctor: doctor._id,
          "schedule.status": "Completed",
        },
      },
      {
        $project: {
          schedule: {
            $filter: {
              input: "$schedule",
              as: "slot",
              cond: { $eq: ["$$slot.status", "Completed"] },
            },
          },
        },
      },
      {
        $match: {
          "schedule.0": { $exists: true }, // Filter out appointments with no completed slots
        },
      },
    ]);

    const bookedAppointments = await Appointment.aggregate([
      {
        $match: {
          doctor: doctor._id,
          "schedule.status": "Booked",
        },
      },
      {
        $project: {
          schedule: {
            $filter: {
              input: "$schedule",
              as: "slot",
              cond: { $eq: ["$$slot.status", "Booked"] },
            },
          },
        },
      },
      {
        $match: {
          "schedule.0": { $exists: true }, // Filter out appointments with no booked slots
        },
      },
    ]);

    res.json({
      status: 200,
      message: "Booked and completed appointments retrieved successfully.",
      data: {
        completedAppointments,
        bookedAppointments,
      },
    });
  } catch (error) {
    next(error);
  }
};







module.exports = {
  markAppointmentAsCompleted,
  completedAndUpcomingAppointments,
  getBookedAndCompletedAppointments
};
