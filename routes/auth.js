// src/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// User registration route
router.post('register', authController.register);

// User login route
router.post('login', authController.login);

// User Google sign-in route
router.post('google-signin', authController.googleSignIn);

module.exports = router;
