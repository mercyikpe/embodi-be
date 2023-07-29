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


/*
const verifyToken = (req, res, next) => {
  //const token = req.cookies.access_token;  //////// stores cookie in browser
  const token = req.headers.authorization; /////// Incase of third party request

  if (!token) {
    return next(createError(401, 'This user is not authenticated'));
  }

  jwt.verify(token, process.env.JWT_SEC_KEY, (err, user) => {
    if (err) {
      return next(createError(403, 'Token is not valid or expired'));
    }

    req.user = user;
    next();
  });
};
*/


const verifyToken = (req, res, next) => {
  const token = req.cookies.access_token;  //////// stores cookie in browser
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
    if (req.user.id === req.params.id || req.user.isAdmin || req.user.isDoctor) {
      next();
    } else {
      return next(createError(401, 'You are not authorized'));
    }
  });
};

const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, (err) => {
    if (req.user.isAdmin) {
      next();
    } else {
      return next(createError(401, 'You are not an ADMIN'));
    }
  });
};

const verifyDoctor = (req, res, next) => {
  verifyToken(req, res, (err) => {
    if (req.user.isDoctor) {
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



/**** 
// Generate a cookie value
const cookieOptions = {
  httpOnly: true, // The cookie is accessible only through the HTTP protocol
  secure: false, // The cookie is sent only over HTTPS
  maxAge: 3600, // The maximum age of the cookie in seconds (1 hour in this example)
  sameSite: 'strict', // The cookie is sent only for requests to the same site
};

const accessToken =  process.env.JWT_SEC_KEY   // token saved on env process.env.JWT_SEC_KEY
const cookieValue = cookie.serialize('access_token', accessToken, cookieOptions);
//console.log(cookieValue);


const verifyToken = (req, res, next) => {
  const token = cookieValue;

  if (!token) {
    return next(createError(401, 'This user is not authenticated'));
  }

  jwt.verify(token, process.env.JWT_TOKEN, (err, user) => {
    if (err) {
      return next(createError(403, 'Token is not valid or expired'));
    }

    req.user = user;
    next();
  });
};

const verifyUser = (req, res, next) => {
  verifyToken(req, res, (err) => {
    if (req.user.id === req.params.id || req.user.isAdmin || req.user.isDoctor) {
      next();
    } else {
      return next(createError(401, 'You are not authorized'));
    }
  });
};

const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, (err) => {
    isAdmin = req.body.isAdmin
    console.log(isAdmin)
    if (isAdmin = true) {
      next();
    } else {
      return next(createError(401, 'You are not an ADMIN'));
    }
  });
};

const verifyDoctor = (req, res, next) => {
  verifyToken(req, res, (err) => {
    if (req.user.isDoctor) {
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

*/
