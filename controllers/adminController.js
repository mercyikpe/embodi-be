////// SCHEMA MODELS
const User = require('../models/User');
const DoctorInfo = require('../models/DoctorInfo')
const OtpCode = require('../models/OtpCode')
const Appointment = require('../models/Appointment')
const Disease = require('../models/Disease')
const Questionnaire = require('../models/Questionnaire')
const EventLog = require('../models/EventLog')

///////  MIDDLEWARES
const transporter = require('../utilities/transporter')
const verifyToken = require('../middleware/authMiddleware')


//////// CONTROLLERS
