const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { verifyToken,verifyDoctor, verifyUser, verifyAdmin } = require('../middleware/authMiddleware');

router.get('/', verifyDoctor, (req, res)=>{
    res.send(' DOCTORS SIDE')
});


////// sign uo doctor 
router.post('/signupdoctor',  doctorController.signUpAsDoctors);

// update doctor's user information fields and addtional information
router.put('/:userId/info', doctorController.updateDoctorInfo);

///update doctor's Account information
router.put('/account/:userId', doctorController.updateDoctorAccountInfo);

/// VIEW DOCTOR WITH ID
router.get('/view/:userId', doctorController.viewDoctor);

///////VIEW ALL DOCTOR viewDoctorInfo
router.get('/viewone/:userId', doctorController.viewDoctorInfo);

////fetchDoctorsWithFullInfo
router.get('/doctors', doctorController.fetchDoctorsWithFullInfo);

//// remove doctor and keep as user removeDoctorRole
router.put('/removedoctor/:userId', doctorController.removeDoctorRole);

////fetchDoctor detils by id
const { populateDoctorFields } = require('../middleware/populateFields');

// Route to get doctor details
router.get('/get/:doctorId', populateDoctorFields, (req, res) => {
  const doctor = req.doctor;
  return res.status(200).json({ doctor });
});




module.exports = router;