//////// A

const express = require('express');
const router = express.Router();


// Route for a protected admin-only endpoint
router.get('/', (req, res)=>{
    res.send('admin MICROPHONE')
} );

// Other user routes

module.exports = router;
