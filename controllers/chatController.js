const Message = require('../models/Message');
const Booking = require('../models/Booking');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getChatMessages = catchAsync(async (req, res, next) => {
  const booking = await Booking.findById(req.params.bookingId);
  
  // Verify user is part of this booking
  if (!booking || 
      (booking.client.toString() !== req.user.id && 
       booking.provider.toString() !== req.user.id)) {
    return next(new AppError('Not authorized to view this chat', 403));
  }

  const messages = await Message.find({ booking: booking._id })
    .sort('createdAt')
    .populate('sender', 'name role profileImage')
    .populate('recipient', 'name role profileImage');

  res.status(200).json({
    status: 'success',
    results: messages.length,
    data: {
      messages
    }
  });
});

exports.sendMessage = catchAsync(async (req, res, next) => {
  const booking = await Booking.findById(req.params.bookingId);
  
  // Verify user is part of this booking
  if (!booking || 
      (booking.client.toString() !== req.user.id && 
       booking.provider.toString() !== req.user.id)) {
    return next(new AppError('Not authorized to send messages in this chat', 403));
  }

  // Determine recipient
  const recipientId = req.user.id === booking.client.toString() 
    ? booking.provider 
    : booking.client;

  const message = await Message.create({
    booking: booking._id,
    sender: req.user.id,
    recipient: recipientId,
    content: req.body.content,
    attachments: req.body.attachments
  });

  // Populate sender info for real-time response
  await message.populate('sender', 'name role profileImage');

  res.status(201).json({
    status: 'success',
    data: {
      message
    }
  });
});

exports.verifyBookingAccess = catchAsync(async (req, res, next) => {
  const booking = await Booking.findById(req.params.bookingId);
  
  if (!booking || 
      (booking.client.toString() !== req.user.id && 
       booking.provider.toString() !== req.user.id)) {
    return next(new AppError('Not authorized to access this chat', 403));
  }
  
  req.booking = booking;
  next();
});

exports.uploadAttachment = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload a file', 400));
  }

  const attachment = {
    url: req.file.path,
    type: req.file.mimetype.startsWith('image') ? 'image' : 'document'
  };

  res.status(200).json({
    status: 'success',
    data: {
      attachment
    }
  });
});
