//////// A

const express = require('express');
const router = express.Router();
const admin = require('../controllers/adminController');


// Route for a protected admin-only endpoint
router.get('/', (req, res)=>{
    res.send('admin MICROPHONE')
} );


///// update admin
router.put('/update', admin.updateAdmin )

//// view all admins
router.get('/viewall', admin.updateAdmin )


// Other user routes

module.exports = router;
