const express = require('express');
const router = express.Router();
const diseaseController = require('../controllers/questionaireController');
const { verifyToken, verifyDoctor , verifyUser, verifyAdmin} = require('../middleware/authMiddleware');

router.get('/', (req, res)=>{
    res.send('questionnaire');
})

// // Add questions to a questionnaire using disease id
router.post('/add/:diseaseId', diseaseController.createQuestionnaireForDisease);


/////// view for full information for disease and questionaire using questionre id
router.get('/:questionnaireId', diseaseController.viewQuestionnaireWithDisease);


/// viewall
router.get('/viewAll', diseaseController.viewAllDiseasesWithQuestionnaires)




/*
// Update questions in a questionnaire using diseaseId
router.put('/update/:diseaseId', diseaseController.updateQuestionsInQuestionnaire);

//View questions for a disease (i have to work on this)
router.get('/view/:diseaseId', diseaseController.viewQuestionsForDisease);
// Create a new questionnaire for a disease


///// // Route for creating a new questionnaire for a disease
router.post('/create/Questionnaire/:diseaseId', diseaseController.createQuestionnaire);

// Update a questionnaire
router.put('/update/questionnaires/:questionnaireId', diseaseController.updateQuestionnaire);

/////// delete 
router.delete('/delete/questionnaires/:questionnaireId', diseaseController.deleteQuestionnaire);

// View all questionnaire for a disease
router.get('/view//questionnaires/:questionnaireId', diseaseController.viewQuestionnaire);
*/

module.exports = router;
