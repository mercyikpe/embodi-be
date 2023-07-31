// src/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const diseaseController = require('../controllers/diseaseController');

router.get('/', (req, res)=>{
    res.send('  DISEASES IS SHOWS UP HERE')
}
)

// update doctor's user information fields and addtional information
router.post('/createdisease', diseaseController.createDisease);




module.exports = router;
