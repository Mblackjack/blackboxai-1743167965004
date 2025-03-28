const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.ObjectId,
    ref: 'Booking',
    required: true
  },
  sender: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Message content cannot be empty']
  },
  attachments: [{
    url: String,
    type: {
      type: String,
      enum: ['image', 'document', 'other']
    }
  }],
  read: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better query performance
MessageSchema.index({ booking: 1 });
MessageSchema.index({ sender: 1 });
MessageSchema.index({ recipient: 1 });
MessageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Message', MessageSchema);