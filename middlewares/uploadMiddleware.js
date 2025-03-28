const multer = require('multer');
const path = require('path');
const AppError = require('../utils/appError');

// Storage configurations
const userPhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/img/users');
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split('/')[1];
    const filename = `user-${req.user ? req.user.id : 'new'}-${Date.now()}.${ext}`;
    cb(null, filename);
  }
});

const chatAttachmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/chat/attachments');
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split('/')[1];
    const filename = `chat-${req.params.bookingId}-${Date.now()}.${ext}`;
    cb(null, filename);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image') || 
      file.mimetype.startsWith('application/pdf') ||
      file.mimetype.includes('document') ||
      file.mimetype.includes('spreadsheet')) {
    cb(null, true);
  } else {
    cb(new AppError('Only images, PDFs and documents are allowed!', 400), false);
  }
};

// Configure uploads
exports.uploadUserPhoto = multer({
  storage: userPhotoStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
}).single('photo');

exports.uploadChatAttachments = multer({
  storage: chatAttachmentStorage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
}).single('attachment');

// Error handling middleware
exports.handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return next(new AppError(err.message, 400));
  } else if (err) {
    return next(new AppError(err.message, 500));
  }
  next();
};