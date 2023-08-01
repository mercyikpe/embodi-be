// src/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorControllers');

router.get('/', (req, res)=>{
    res.send(' DOCTORS SIDE')
}
)

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











module.exports = router;
