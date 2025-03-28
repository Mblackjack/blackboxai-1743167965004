const Event = require('../models/Event');
const Booking = require('../models/Booking');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.createEvent = catchAsync(async (req, res, next) => {
  const { theme, occasion, date, location, startTime, endTime, guests } = req.body;
  
  // Validate required fields
  if (!theme || !occasion || !date || !location || !startTime || !endTime || !guests) {
    return next(new AppError('Please provide all required event details', 400));
  }

  const event = await Event.create({
    client: req.user.id,
    theme,
    occasion,
    date,
    location,
    startTime,
    endTime,
    guests
  });

  res.status(201).json({
    status: 'success',
    data: {
      event
    }
  });
});

exports.getEvent = catchAsync(async (req, res, next) => {
  const event = await Event.findById(req.params.id)
    .populate('services.provider')
    .populate('client');

  if (!event) {
    return next(new AppError('No event found with that ID', 404));
  }

  // Check if user is authorized to view this event
  if (event.client._id.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to view this event', 403));
  }

  res.status(200).json({
    status: 'success',
    data: {
      event
    }
  });
});

exports.updateEvent = catchAsync(async (req, res, next) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return next(new AppError('No event found with that ID', 404));
  }

  // Check if user is authorized to update this event
  if (event.client.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to update this event', 403));
  }

  const updatedEvent = await Event.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    status: 'success',
    data: {
      event: updatedEvent
    }
  });
});

exports.deleteEvent = catchAsync(async (req, res, next) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return next(new AppError('No event found with that ID', 404));
  }

  // Check if user is authorized to delete this event
  if (event.client.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to delete this event', 403));
  }

  await Event.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.getUserEvents = catchAsync(async (req, res, next) => {
  const events = await Event.find({ client: req.user.id })
    .sort('-createdAt')
    .populate('services.provider');

  res.status(200).json({
    status: 'success',
    results: events.length,
    data: {
      events
    }
  });
});

exports.getProviderEvents = catchAsync(async (req, res, next) => {
  const events = await Event.find({ 
    'services.provider': req.user.id,
    status: { $ne: 'cancelled' }
  })
  .sort('-date')
  .populate('client');

  res.status(200).json({
    status: 'success',
    results: events.length,
    data: {
      events
    }
  });
});

exports.getAllEvents = catchAsync(async (req, res, next) => {
  const events = await Event.find()
    .sort('-createdAt')
    .populate('client')
    .populate('services.provider');

  res.status(200).json({
    status: 'success',
    results: events.length,
    data: {
      events
    }
  });
});
