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
  markQuestionnaireCompleted,
} = require("../controllers/questionaireController");
const {
} = require("../controllers/doctor/appointment");

router.get("/", (req, res) => {
  res.send("questionnaire");
});

router.get("/questionnaires", viewAllQuestionnaires);

router.post(
  "/add/:userId/:diseaseId",
  diseaseController.createQuestionnaireForDisease
);
router.patch(
  "/completed/:adminId/:questionnaireId",
  verifyAdmin,
  markQuestionnaireCompleted
);

module.exports = router;
