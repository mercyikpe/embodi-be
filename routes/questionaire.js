const express = require("express");
const router = express.Router();
const diseaseController = require("../controllers/questionaireController");
const {
  verifyToken,
  verifyDoctor,
  verifyUser,
  verifyAdmin,
} = require("../middleware/authMiddleware");
const {
  viewAllQuestionnaires,
} = require("../controllers/questionaireController");

router.get("/", (req, res) => {
  res.send("questionnaire");
});

router.get("/questionnaires", viewAllQuestionnaires);

router.post(
  "/add/:userId/:diseaseId",
  diseaseController.createQuestionnaireForDisease
);

module.exports = router;
