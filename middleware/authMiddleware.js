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
const AppError = require('../utilities/createError');
app.use(cookieParser());
const dotenv = require('dotenv');
dotenv.config();


const verifyToken = (req, res, next) => {
  const token = req.cookies.Token;  //////// stores cookie in browser
  //const token = req.headers.authorization; /////// Incase of third party request

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
      return next(createError(401, 'You are not authorized'));
    }
  });
};

const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, (err) => {
    if (req.user.role === 'isAdmin') {
      next();
    } else {
      return next(createError(401, 'You are not an ADMIN'));
    }
  });
};

const verifyDoctor = (req, res, next) => {
  verifyToken(req, res, (err) => {
    if (req.user.role === 'isDoctor') {
      next();
    } else {
      return next(createError(401, 'You are not a verified DOCTOR'));
    }
  });
};

module.exports = {
  verifyToken,
  verifyUser,
  verifyAdmin,
  verifyDoctor,
};