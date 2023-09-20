const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointmentController");
const {
  createAppointment,
  bookAppointment,
  deleteAppointmentByID,
} = require("../controllers/appointmentController");
const {
  verifyToken,
  verifyDoctor,
  verifyUser,
  verifyAdmin,
} = require("../middleware/authMiddleware");
const patient = require("../models/User");
const {
  markAppointmentAsCompleted,
  getBookedAndCompletedAppointments,
} = require("../controllers/doctor/appointment");
const { getAllAppointments } = require("../controllers/adminController");

router.use(express.json());

router.get("/", (req, res) => {
  res.send("THIS IS APPOINTMENT");
});

router.post("/create/:userId", async (req, res) => {
  try {
    const { doctorId, appointments } = req.body;

    if (!doctorId || !appointments) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Call the createAppointment function and await its result
    const result = await appointmentController.createAppointment(
      doctorId,
      appointments
    );

    if (result.success) {
      return res.status(201).json(result);
    } else {
      return res.status(400).json({ error: result.message });
    }
  } catch (error) {
    console.error("Error in /create/:userId route:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post(
  "/book/:doctorId/:patientId",
  appointmentController.bookAppointment
);

//FETCH ALL THE BOOKED APPOINTMENT FOR ALL THE DOCTORS
router.get("/bookedAppointment", appointmentController.fetchBookedAppointments);

router.put("/updatestatus/:doctorId/:appointmentId/:bookingId");

////get completed appointment for all the doctors get All CompletedAppointments
router.get(
  "/getAllTheAppointment",
  appointmentController.fetchCompletedAppointments
);

///// FETCH BOOKED APPOINTMENT FOR INDIVIDUAL DOCTOR
router.get(
  "/bookedAppointment/:doctorId/view",
  appointmentController.fetchBookedAppointmentsByDoctor
);

//// get complete appointment for each doctor getCompletedAppointments
router.get("/getAppointmentById/:appointmentId");



//// get scheduled appointmet getDoctorScheduledAppointments
router.get(
  "/scheduledAppointment/:doctorId",
  appointmentController.getDoctorScheduledAppointments
);

router.delete("/delete/:doctorId/:scheduleId", deleteAppointmentByID);

router.patch(
  "/completed/:doctorId/:appointmentId/:scheduleId",
  markAppointmentAsCompleted
);

router.get(
  "/completed-upcoming/:doctorId",
  verifyDoctor,
  getBookedAndCompletedAppointments
);



// ADMIN
//// get all appointment
router.get(
    "/view-all/:adminId",
    verifyAdmin,
    getAllAppointments
);
module.exports = router;
