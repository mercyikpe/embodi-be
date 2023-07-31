// src/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const diseaseController = require('../controllers/diseaseController');

router.get('/', (req, res)=>{
    res.send('  DISEASES IS SHOWS UP HERE')
}
)

// CREATE DISEASE 
router.post('/createdisease', diseaseController.createDisease);

//UPDATE DISEASE 
router.put('/updatedisease', diseaseController.updateDisease);

// DELETE
router.delete('/deletedisease', diseaseController.deleteDisease);

// VIEW
router.get('/viewdisease', diseaseController.viewDisease);

// viewDiseasesByCategory,
router.get('/categories', diseaseController.viewDiseasesByCategory);

//   setPopularity,
router.get('/setpopularity', diseaseController.createDisease);

//   viewDiseasesByPopularity
router.get('/popularity', diseaseController.viewDiseasesByPopularity);




module.exports = router;
