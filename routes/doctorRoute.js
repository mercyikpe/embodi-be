const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');

router.get('/', (req, res)=>{
    res.send(' DOCTORS SIDE')
});


////// sign uo doctor 
router.post('/signupdoctor', doctorController.signUpAsDoctor);

// update doctor's user information fields and addtional information
router.put('/:userId/info', doctorController.updateDoctorInfo);

///update doctor's Account information
router.put('/account/:userId', doctorController.updateDoctorAccountInfo);

/// VIEW DOCTOR WITH ID
router.get('/view/:userId', doctorController.viewDoctor);

//// VIEW DOCTOR BY SECIALTY

////view doctor on paginated
router.get('/view', doctorController.getAllDoctorsPaginated);



///////view all the doctors getAllDoctors
router.get('/viewalldoctors', doctorController.getAllDoctors);

////seach for doctors searchDoctors
router.get('/searchdoctors', doctorController.searchDoctors);


module.exports = router;
