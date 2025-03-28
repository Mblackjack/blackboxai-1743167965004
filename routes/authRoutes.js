const express = require('express');
const authController = require('../controllers/authController');
const uploadMiddleware = require('../middlewares/uploadMiddleware');

const router = express.Router();

// Client registration with photo upload
router.post('/register/client', 
  uploadMiddleware.uploadUserPhoto,
  uploadMiddleware.handleUploadErrors,
  authController.validateClientRegistration,
  authController.register
);

// Provider registration with photo upload
router.post('/register/provider',
  uploadMiddleware.uploadUserPhoto,
  uploadMiddleware.handleUploadErrors,
  authController.validateProviderRegistration,
  authController.register
);

// Login for all user types
router.post('/login', authController.login);

// Protected test route
router.get('/protected',
  authController.protect,
  authController.restrictTo('client', 'provider', 'admin'),
  (req, res) => {
    res.status(200).json({
      status: 'success',
      data: {
        user: req.user
      }
    });
  }
);

module.exports = router;