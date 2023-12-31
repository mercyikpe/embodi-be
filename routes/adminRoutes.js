const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const userController = require("../controllers/adminController");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

// Route for a protected admin-only endpoint
router.get("/", verifyToken, verifyAdmin, (req, res) => {
  res.send("admin MICROPHONE");
});

// Update user information by admin
router.put("/updateUser/:userId", async (req, res) => {
  const { userId } = req.params;
  const { phoneNumber, firstName, lastName } = req.body;

  const result = await userController.updateUserByAdmin(
    userId,
    phoneNumber,
    firstName,
    lastName
  );

  if (result.success) {
    return res.status(200).json({
      status: "success",
      message: result.message,
      data: result.user,
    });
  } else {
    return res.status(500).json({
      status: "failed",
      message: result.message,
    });
  }
});

// View all admin users
router.get("/admins", async (req, res) => {
  try {
    const admins = await userController.viewAllAdmins();

    return res.status(200).json({
      status: "success",
      message: "Admin users retrieved successfully.",
      admins,
    });
  } catch (error) {
    return res.status(500).json({
      status: "failed",
      message: "An error occurred while processing the request.",
    });
  }
});


// Get all users, doctors and admin
router.get('/all-users', adminController.getAllUsersInDB);

// Update admin profile
router.patch("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    const updatedAdmin = await userController.updateAdminProfile(
        userId,
        updateData
    );

    return res.status(200).json({
      status: "success",
      message: "Admin profile updated successfully.",
      updatedAdmin,
    });
  } catch (error) {
    return res.status(500).json({
      status: "failed",
      message: "An error occurred while processing the request.",
    });
  }
});

// Get admin by ID
router.get('/:id', adminController.getAdminByID);

module.exports = router;
