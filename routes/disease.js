
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


//// VIEW ALL DISEASES
router.get('/viewAll', diseaseController.getDiseases);

/// view popular 
router.get('/viewPopular', diseaseController.getPopularDiseases);


/////// view diseas  with hifgest enagement
router.get('/mostengaged', diseaseController.getDiseaseWithHighestEngagement);



/*
//UPDATE DISEASE 
router.put('/update/:diseaseId', diseaseController.updateDisease);

// DELETE
router.delete('/delete/:diseaseId', diseaseController.deleteDisease);




// VIEW ALL DISEASE
router.get('/viewall', diseaseController.viewDisease);

//   viewDiseasesByPopularity
router.get('/popularity/:diseaseId', diseaseController.makeDiseasePopular);


// viewDiseasesByCategory,
//router.get('/categories', diseaseController.viewDiseasesByCategory);

//   setPopularity,
//router.get('/setpopularity', diseaseController.createDisease);
*/



module.exports = router;
