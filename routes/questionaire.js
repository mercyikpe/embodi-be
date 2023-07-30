// src/routes/authRoutes.js

const express = require('express');
const router = express.Router();
//const authController = require('../controllers/authController');

router.get('/', (req, res)=>{
    res.send('  QUESTIONAIRE IS  here')
}
)





module.exports = router;
