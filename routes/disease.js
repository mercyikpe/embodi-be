
const express = require('express');
const router = express.Router();
const questionnaire = require('../controllers/questionaireController');
const diseaseController = require('../controllers/diseaseController');
const { createDisease } = require('../controllers/diseaseController')
const { verifyToken, verifyDoctor , verifyUser, verifyAdmin} = require('../middleware/authMiddleware');

const upload = require("../middleware/diseasePhoto");

router.get('/', (req, res)=>{
    res.send('  DISEASES IS SHOWS UP HERE')
}
)



// CREATE DISEASE 
router.post('/createdisease', upload.single('photo'),  diseaseController.createDiseases);

//UPDATE DISEASE   ///// put disease ID
router.put('/update/:diseaseId', upload.single('photo'), diseaseController.updateDisease);

//// VIEW ALL DISEASES
router.get('/viewAll', diseaseController.getDiseases);

/// view popular 
router.get('/viewPopular', diseaseController.getPopularDiseases);

router.delete('/delete/:diseaseId', diseaseController.handleDiseaseDelete);

/////// view disease  with highest engagement
router.get('/mostengaged', diseaseController.getDiseaseWithHighestEngagement);

///// get questionaire with questionnaire id viewQuestionnaireWithDisease
router.get('/viewqandd', diseaseController.viewQuestionnaireWithDisease);

//// VIEW ALL DISEASES
router.get('/:diseaseId', diseaseController.getDiseaseDetails);





/*
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
