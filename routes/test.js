// src/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/authController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Route for a protected admin-only endpoint
router.get('/admin', verifyToken, isAdmin, userController.adminEndpoint);

// Other user routes

module.exports = router;
