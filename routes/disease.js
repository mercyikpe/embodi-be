
const express = require('express');
const router = express.Router();
const questionnaire = require('../controllers/questionaireController');
const diseaseController = require('../controllers/diseaseController');
const { createDisease } = require('../controllers/diseaseController')

router.get('/', (req, res)=>{
    res.send('  DISEASES IS SHOWS UP HERE')
}
)



// CREATE DISEASE 
router.post('/createdisease', diseaseController.createDiseases);

//UPDATE DISEASE 
router.put('/update/:diseaseId', diseaseController.updateDisease);

// DELETE
router.delete('/delete/:diseaseId', diseaseController.deleteDisease);

// VIEW
router.get('/view/:diseaseId', diseaseController.viewDisease);


// VIEW ALL DISEASE
router.get('/viewall', diseaseController.viewDisease);

//   viewDiseasesByPopularity
router.get('/popularity/:diseaseId', diseaseController.makeDiseasePopular);


// viewDiseasesByCategory,
//router.get('/categories', diseaseController.viewDiseasesByCategory);

//   setPopularity,
//router.get('/setpopularity', diseaseController.createDisease);




module.exports = router;
