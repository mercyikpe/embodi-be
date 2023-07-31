const express = require('express');
const router = express.Router();
const diseaseController = require('../controllers/questionaireController');

// ... Your other routes ...

// Create a new questionnaire for a disease
router.post('/createQuestionnaire', diseaseController.createQuestionnaire);

// Update a questionnaire for a disease
router.put('/update/:diseaseId/:questionnaireId', diseaseController.updateQuestionnaire);

// View questionnaire for a disease
router.get('/view/:diseaseId', diseaseController.viewQuestionnaire);

module.exports = router;
