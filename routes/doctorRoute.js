const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');

router.get('/', (req, res)=>{
    res.send(' DOCTORS SIDE')
});


////// sign uo doctor 
router.post('/signupdoctor', doctorController.signUpAsDoctors);

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




module.exports = router;
