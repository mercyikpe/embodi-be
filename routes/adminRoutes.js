//////// A

const express = require('express');
const router = express.Router();
const admin = require('../controllers/adminController');
const userController = require('../controllers/adminController');



// Route for a protected admin-only endpoint
router.get('/', (req, res)=>{
    res.send('admin MICROPHONE')
} );


///// update admin
router.put('/update/:id', admin.updateAdmin )

// View all admin users
router.get('/admins', async (req, res) => {
  try {
    const admins = await userController.viewAllAdmins();

    return res.status(200).json({
      status: 'success',
      message: 'Admin users retrieved successfully.',
      admins,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while processing the request.',
    });
  }
});

module.exports = router;





// Other user routes

module.exports = router;
