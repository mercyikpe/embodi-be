const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const User = require('../models/User');
//onst { AppError } = require('../utilities/createError'); 
const OtpCode = require('../models/OtpCode');
const bodyParser = require('body-parser');
const cookie = require('cookie');
//const createError = require('http-errors');
const createError = require('../utilities/createError');
const dotenv = require('dotenv');

dotenv.config();

app.use(cookieParser());
app.use(express.json()); // Middleware to parse JSON request bodies


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
  const bearerHeader = req.headers['authorization'];

  if (typeof bearerHeader === 'undefined') {
    return res.status(403).json({
      status: 403,
      message: "You are not authenticated"
    });
  }

  const bearer = bearerHeader.split(' ');
  const bearerToken = bearer[1];
  req.token = bearerToken;

  try {
    const user = jwt.verify(req.token, process.env.JWT_SEC_KEY);
    req.user = user;
    next();
  } catch (err) {
    return next(new createError('Token is not valid or expired', 403));
  }
};


const verifyDoctor = (req, res, next) => {
  verifyToken(req, res, async (err) => {
    if (err) {
      return next(err);
    }

    const user = await User.findById(req.user.id);

    if (user && user.roles) {

      const doctorInfo = await DoctorInfo.findOne({ user: user._id });
      if (doctorInfo) {
        user.roles = ['isDoctor'];
      } else {
        user.roles = ['isUser'];
      }
      next();
    } else {
      return next(new AppError('You are not a verified DOCTOR or ADMIN', 401));
    }
  });
}
  
  const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, async (err) => {
  if (err) {
  return next(err);
  }
  
  const user = await User.findById(req.user.id);
  
  if (user && (user.roles.includes('isAdmin') || user.roles.includes('isUser'))) {
    next();
  } else {
    return next(new AppError('You are not an ADMIN or USER', 401));
  }
  });
  };
  
  const verifyUser = (req, res, next) => {
  verifyToken(req, res, async (err) => {
  if (err) {
  return next(err);
  }
  
  const user = await User.findById(req.user.id);
  
  if (user && user.roles.includes('isUser')) {
    next();
  } else {
    return next(new AppError('You are not a verified USER', 401));
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

