const User = require("../../models/User");
const Appointment = require("../../models/Appointment");

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

    // Retrieve the patient's information from the schedule
    const patientId = scheduleToMarkAsCompleted.patient;
    const patient = await User.findById(patientId);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found." });
    }

    // Update the status of the schedule to "Completed"
    scheduleToMarkAsCompleted.status = "Completed";

    // Save the updated appointment
    await appointment.save();

    // Add the completed appointment to the doctor's and patient's past appointments
    const completedAppointment = appointment._id; // Use the ObjectId of the appointment

    doctor.pastAppointments.push(completedAppointment);
    patient.pastAppointments.push(completedAppointment);

    // Save the updated doctor and patient data
    await doctor.save();
    await patient.save();

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

module.exports = {
  markAppointmentAsCompleted,
};
