const User = require("../../models/User");
const Appointment = require("../../models/Appointment");
const DoctorInfo = require("../../models/DoctorInfo");

// Controller to mark an appointment as completed by a doctor
const markAppointmentAsCompleted = async (req, res) => {
  const { doctorId, scheduleId } = req.params;

  try {
    // Find the appointment that contains the schedule with the specified scheduleId
    const appointment = await Appointment.findOne({
      doctor: doctorId,
      "schedule._id": scheduleId,
    });

    if (!appointment) {
      return res.status(404).json({ message: "Schedule not found." });
    }

    // Retrieve the schedule within the appointment based on scheduleId
    const scheduleToMarkAsCompleted = appointment.schedule.find(
      (schedule) => schedule._id.toString() === scheduleId
    );

    if (!scheduleToMarkAsCompleted) {
      return res.status(404).json({ message: "Schedule not found." });
    }

    // Check if the schedule is already marked as "Completed"
    if (scheduleToMarkAsCompleted.status === "Completed") {
      return res
        .status(400)
        .json({ message: "Schedule is already marked as completed." });
    }

    // Retrieve the doctor's information
    const doctor = await DoctorInfo.findOne({ user: doctorId }).select(
      "rate overallEarnings monthlyEarnings pastAppointments"
    );

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    // Add these logs to check the values
    console.log("doctor.rate:", doctor.rate);

    // Check if monthlyEarnings is defined
    if (!doctor.monthlyEarnings) {
      doctor.monthlyEarnings = [];
    }

    // Check if pastAppointments is defined
    if (!doctor.pastAppointments) {
      doctor.pastAppointments = [];
    }

    // Get the current month and year
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Check if the doctor has monthlyEarnings for the current month and year
    const monthlyEarning = doctor.monthlyEarnings.find(
      (entry) => entry.month === currentMonth && entry.year === currentYear
    );

    if (!monthlyEarning) {
      // Create a new MonthlyEarning entry for the current month and year
      doctor.monthlyEarnings.push({
        month: currentMonth,
        year: currentYear,
        patientCount: 0,
        earnings: 0,
      });
    }

    // Calculate earnings for the completed appointment
    const appointmentFee = doctor.rate || 200; // Use default value if rate is undefined
    doctor.overallEarnings += appointmentFee; // Update overall earnings
    console.log("appointmentFee:", appointmentFee);

    // Update monthly earnings
    const updatedMonthlyEarning = doctor.monthlyEarnings.find(
      (entry) => entry.month === currentMonth && entry.year === currentYear
    );

    if (updatedMonthlyEarning) {
      updatedMonthlyEarning.patientCount += 1;
      updatedMonthlyEarning.earnings += appointmentFee;
    } else {
      // If no entry for the current month, create a new entry
      doctor.monthlyEarnings.push({
        month: currentMonth,
        year: currentYear,
        patientCount: 1,
        earnings: appointmentFee,
      });
    }

    // Add the completed appointment to the doctor's past appointments
    const completedAppointment = appointment._id;
    doctor.pastAppointments.push(completedAppointment);

    // Save the updated doctor data
    await doctor.save();

    // Update the patientCount in the doctorInfo model
    const doctorInfo = await DoctorInfo.findOne({ user: doctorId });
    if (doctorInfo) {
      doctorInfo.patientCount += 1; // Increment the patientCount
      await doctorInfo.save();
    }

    // Update the status of the schedule to "Completed"
    scheduleToMarkAsCompleted.status = "Completed";

    // Save the updated appointment
    await appointment.save();

    // Respond with a success message
    return res.status(200).json({ message: "Schedule marked as completed." });
  } catch (error) {
    return res.status(500).json({
      message: "An error occurred while marking the schedule as completed.",
    });
  }
};

const getBookedAndCompletedAppointments = async (req, res) => {
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
      path: "schedule.patient",
      select: "firstName lastName", // Select the fields you want to populate
    });

    // Extract and group schedule objects by status
    const groupedSchedules = {
      upcoming: [],
      completed: [],
    };

    doctorAppointments.forEach((appointment) => {
      appointment.schedule.forEach((schedule) => {
        if (schedule.status === "Booked") {
          groupedSchedules.upcoming.push(schedule);
        } else if (schedule.status === "Completed") {
          groupedSchedules.completed.push(schedule);
        }
      });
    });

    res.status(200).json({
      status: 200,
      message: "Doctor appointments retrieved successfully.",
      data: groupedSchedules,
    });
  } catch (error) {
    return res.status(500).json({
      message: "An error occurred while getting appointments.",
    });
  }
};

module.exports = {
  markAppointmentAsCompleted,
  getBookedAndCompletedAppointments,
};
