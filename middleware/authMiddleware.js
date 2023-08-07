
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const getSecret = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SEC_KEY);
  } catch (err) {
    throw new AppError('Token is not valid or expired', 403);
  }
};

const verifyToken = (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return next(new AppError('Access denied. Token missing.', 401));
  }

  try {
    const decoded = getSecret(token);
    req.user = decoded.user;
    next();
  } catch (err) {
    return next(new AppError('Invalid token.', 401));
  }
};

const verifyDoctor = async (req, res, next) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user || !user.role.includes('isDoctor')) {
      return next(new AppError('User not found or is not authorized as a doctor.', 403));
    }

    next();
  } catch (error) {
    return next(new AppError('An error occurred while processing your request.', 500));
  }
};

module.exports = {
  AppError,
  verifyToken,
  verifyDoctor,
};


/*
const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const User = require('../models/User')
const OtpCode = require('../models/OtpCode');
const cookieParser = require ('cookie-parser');
const bodyParser = require('body-parser');
const cookie = require('cookie');
//const createError = require('http-errors');
const createError = require('../utilities/createError');
///const AppError = require('../utilities/createError');
app.use(cookieParser());
const dotenv = require('dotenv');
dotenv.config();

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const verifyToken = (req, res, next) => {
  //const token = req.cookies.token ||  ;  //////// stores cookie in browser
  const token = process.env.TToken || req.headers.authorization || req.headers.cookie; /////// Incase of third party request

  if (!token) {
    return next(new AppError(401, 'This user is not authenticated'));
  }

  jwt.verify(token, process.env.JWT_SEC_KEY, (err, user) => {
    if (err) {
      return next(new AppError(403, 'Token is not valid or expired'));
    }

    req.user = user;
    next();
  });
};


const verifyUser = (req, res, next) => {
  verifyToken(req, res, (err) => {
    if (req.user.id === req.params.id || req.user.role === 'isAdmin' || req.user.role === 'isDoctor' || req.user.role === 'isUser') {
      next();
    } else {
      return next(AppError(401, 'You are not authorized'));
    }
  });
};

const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, (err) => {
    if (req.user.role === 'isAdmin') {
      next();
    } else {
      return next(AppError(401, 'You are not an ADMIN'));
    }
  });
};

const verifyDoctor = (req, res, next) => {
  verifyToken(req, res, (err) => {
    if (req.user.role === 'isDoctor') {
      next();
    } else {
      return next(AppError(401, 'You are not a verified DOCTOR'));
    }
  });
};

module.exports = {
  AppError,
  verifyToken,
  verifyUser,
  verifyAdmin,
  verifyDoctor,
};

*/