const Booking = require('../models/Booking');
const Event = require('../models/Event');
const Service = require('../models/Service');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.createBooking = catchAsync(async (req, res, next) => {
  const { eventId, serviceId, bookingDetails } = req.body;

  // 1) Get the event and verify client ownership
  const event = await Event.findById(eventId);
  if (!event || event.client.toString() !== req.user.id) {
    return next(new AppError('Event not found or unauthorized', 404));
  }

  // 2) Get the service and verify provider
  const service = await Service.findById(serviceId);
  if (!service) {
    return next(new AppError('Service not found', 404));
  }

  // 3) Calculate pricing
  const distance = calculateDistance(event.location.coordinates, service.location.coordinates);
  const distanceFee = distance > service.serviceArea ? 
    (distance - service.serviceArea) * service.distanceFee : 0;

  const durationHours = (event.endTime - event.startTime) / (1000 * 60 * 60);
  const extraHours = durationHours > service.duration ? 
    durationHours - service.duration : 0;
  const extraHoursFee = extraHours * service.extraHourPrice;

  const childCount = event.guests.guestList.filter(g => 
    g.age >= service.ageGroups.childMin && 
    g.age <= service.ageGroups.childMax
  ).length;

  const totalPrice = calculateTotalPrice(
    service.basePrice,
    distanceFee,
    extraHoursFee,
    childCount,
    service.ageGroups.childPrice,
    event.date
  );

  // 4) Create booking
  const booking = await Booking.create({
    event: eventId,
    service: serviceId,
    provider: service.provider,
    client: req.user.id,
    bookingDetails: {
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      guestCount: event.guests.total,
      childCount,
      distance,
      extraHours,
      alcoholService: bookingDetails.alcoholService
    },
    pricing: {
      basePrice: service.basePrice,
      distanceFee,
      extraHoursFee,
      alcoholFee: bookingDetails.alcoholService ? 
        event.guests.total * service.alcoholOptions.pricePerPerson : 0,
      subtotal: totalPrice,
      platformFee: calculatePlatformFee(totalPrice),
      total: totalPrice + calculatePlatformFee(totalPrice)
    }
  });

  // 5) Add service to event
  event.services.push({
    provider: service.provider,
    category: service.category,
    subcategory: service.subcategory,
    basePrice: service.basePrice,
    distanceFee,
    extraHours,
    totalPrice: booking.pricing.total,
    status: 'pending'
  });
  await event.save();

  res.status(201).json({
    status: 'success',
    data: {
      booking
    }
  });
});

// Helper functions
function calculateDistance(loc1, loc2) {
  // Implementation using Haversine formula
  const R = 6371; // Earth radius in km
  const dLat = toRad(loc2[0]-loc1[0]);
  const dLon = toRad(loc2[1]-loc1[1]);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(loc1[0])) * Math.cos(toRad(loc2[0])) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

function toRad(Value) {
  return Value * Math.PI / 180;
}

function calculateTotalPrice(basePrice, distanceFee, extraHoursFee, childCount, childPrice, eventDate) {
  // Apply seasonal pricing if applicable
  const month = new Date(eventDate).getMonth() + 1;
  const seasonalMultiplier = service.seasonalPricing.find(s => s.month === month)?.multiplier || 1;
  
  // Apply special date pricing if applicable
  const specialDate = service.specialDates.find(d => 
    new Date(d.date).toDateString() === new Date(eventDate).toDateString()
  );
  const dateMultiplier = specialDate?.multiplier || 1;
  
  return (basePrice + distanceFee + extraHoursFee + (childCount * childPrice)) * seasonalMultiplier * dateMultiplier;
}

function calculatePlatformFee(amount) {
  // Tiered commission structure
  if (amount > 20000) return amount * 0.03; // 3% for large events
  if (amount > 10000) return amount * 0.04; // 4% for medium events
  return amount * 0.05; // 5% for small events
}

exports.confirmBooking = catchAsync(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);
  
  if (!booking || booking.provider.toString() !== req.user.id) {
    return next(new AppError('Booking not found or unauthorized', 404));
  }

  booking.status = 'confirmed';
  await booking.save();

  // Update event service status
  await Event.updateOne(
    { _id: booking.event, 'services.provider': booking.provider },
    { $set: { 'services.$.status': 'confirmed' } }
  );

  res.status(200).json({
    status: 'success',
    data: {
      booking
    }
  });
});

exports.getClientBookings = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find({ client: req.user.id })
    .populate('event')
    .populate('service')
    .populate('provider')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: bookings.length,
    data: {
      bookings
    }
  });
});

exports.getProviderBookings = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find({ provider: req.user.id })
    .populate('event')
    .populate('service')
    .populate('client')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: bookings.length,
    data: {
      bookings
    }
  });
});

exports.getAllBookings = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find()
    .populate('event')
    .populate('service')
    .populate('client')
    .populate('provider')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: bookings.length,
    data: {
      bookings
    }
  });
});

exports.cancelBooking = catchAsync(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);
  
  if (!booking) {
    return next(new AppError('Booking not found', 404));
  }

  // Check authorization
  if (req.user.role === 'client' && booking.client.toString() !== req.user.id) {
    return next(new AppError('Not authorized to cancel this booking', 403));
  }

  if (req.user.role === 'provider' && booking.provider.toString() !== req.user.id) {
    return next(new AppError('Not authorized to cancel this booking', 403));
  }

  booking.status = 'cancelled';
  await booking.save();

  // Update event service status
  await Event.updateOne(
    { _id: booking.event, 'services.provider': booking.provider },
    { $set: { 'services.$.status': 'cancelled' } }
  );

  res.status(200).json({
    status: 'success',
    data: {
      booking
    }
  });
});
