const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  provider: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: ['food-drink', 'entertainment', 'venue', 'organization'],
    required: true
  },
  subcategory: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please provide a service name']
  },
  description: String,
  images: [String],
  basePrice: {
    type: Number,
    required: true
  },
  minGuests: Number,
  maxGuests: Number,
  duration: Number, // in hours
  extraHourPrice: Number,
  serviceArea: Number, // in km
  distanceFee: Number, // per km beyond service area
  ageGroups: {
    childMin: Number,
    childMax: Number,
    childPrice: Number
  },
  alcoholOptions: {
    available: Boolean,
    pricePerPerson: Number
  },
  restrictions: String,
  availability: [{
    date: Date,
    booked: Boolean
  }],
  seasonalPricing: [{
    month: Number,
    multiplier: Number
  }],
  specialDates: [{
    date: Date,
    multiplier: Number
  }],
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Service', ServiceSchema);