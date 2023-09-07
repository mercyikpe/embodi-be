// middleware/checkDoctorRole.js
//const User = require('../models/User');

const checkDoctorRole = (req, res, next) => {
    const { role } = req.user;
  
    if (role !== 'isDoctor') {
      return res.status(403).json({
        status: 'failed',
        message: 'Only doctors are allowed to create appointments.',
      });
    }
  
    next();
  };
  
 /// module.exports = checkDoctorRole;
  