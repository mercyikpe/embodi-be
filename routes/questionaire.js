const express = require('express');
const router = express.Router();
const diseaseController = require('../controllers/questionaireController');



// // Add questions to a questionnaire using disease id
router.post('/add/:diseaseId', diseaseController.createQuestionnaireForDisease);


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
