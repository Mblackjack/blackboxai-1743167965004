const express = require('express');
const chatController = require('../controllers/chatController');
const authController = require('../controllers/authController');

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

// Get chat messages
router.get('/:bookingId', 
  chatController.verifyBookingAccess,
  chatController.getChatMessages
);

// Send new message
router.post('/:bookingId/send',
  chatController.verifyBookingAccess,
  chatController.sendMessage
);

// Upload chat attachments
router.post('/:bookingId/upload',
  authController.restrictTo('client', 'provider'),
  chatController.verifyBookingAccess,
  uploadMiddleware.uploadChatAttachments,
  uploadMiddleware.handleUploadErrors,
  chatController.uploadAttachment
);

module.exports = router;