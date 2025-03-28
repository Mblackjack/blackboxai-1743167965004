const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  theme: {
    type: String,
    required: [true, 'Please provide the event theme']
  },
  occasion: {
    type: String,
    enum: ['birthday', 'wedding', 'corporate', 'other'],
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  location: {
    address: String,
    city: String,
    state: String,
    coordinates: [Number], // [longitude, latitude]
    description: String,
    restrictions: String
  },
  startTime: Date,
  endTime: Date,
  guests: {
    total: Number,
    adults: Number,
    children: Number,
    guestList: [{
      name: String,
      age: Number,
      drinksAlcohol: Boolean
    }]
  },
  services: [{
    provider: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    category: String,
    subcategory: String,
    basePrice: Number,
    distanceFee: Number,
    extraHours: Number,
    totalPrice: Number,
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending'
    }
  }],
  totalPrice: Number,
  status: {
    type: String,
    enum: ['draft', 'pending', 'confirmed', 'completed', 'cancelled'],
    default: 'draft'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Event', EventSchema);