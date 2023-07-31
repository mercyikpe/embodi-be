// src/routes/authRoutes.js

const express = require('express');
const router = express.Router();
//const questionaire = require('../controllers/authController');
const questionaire = require('../models/Questionaire')

router.get('/', (req, res)=>{
    res.send('  QUESTIONAIRE IS  here')
}
)

// Create a new questionnaire
router.post('/create', async (req, res) => {
    const questionaire = new Questionaire({
      title: req.body.title,
      options: req.body.options,
    });
    await questionaire.save();
    res.json(questionaire);
  });



module.exports = router;
