const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.ObjectId,
    ref: 'Event',
    required: true
  },
  service: {
    type: mongoose.Schema.ObjectId,
    ref: 'Service',
    required: true
  },
  provider: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  client: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  bookingDetails: {
    date: Date,
    startTime: Date,
    endTime: Date,
    guestCount: Number,
    childCount: Number,
    distance: Number,
    extraHours: Number,
    alcoholService: Boolean
  },
  pricing: {
    basePrice: Number,
    distanceFee: Number,
    extraHoursFee: Number,
    alcoholFee: Number,
    seasonalMultiplier: Number,
    specialDateMultiplier: Number,
    subtotal: Number,
    platformFee: Number,
    total: Number
  },
  contract: {
    signed: Boolean,
    signedAt: Date,
    digitalSignature: String
  },
  payment: {
    method: String,
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    paidAt: Date
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  chat: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Message'
  }],
  feedback: {
    rating: Number,
    comment: String,
    createdAt: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for faster querying
BookingSchema.index({ event: 1 });
BookingSchema.index({ provider: 1 });
BookingSchema.index({ client: 1 });

module.exports = mongoose.model('Booking', BookingSchema);