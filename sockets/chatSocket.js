const Message = require('../models/Message');
const Booking = require('../models/Booking');
const User = require('../models/User');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('New client connected');

    // Join booking room
    socket.on('joinBooking', async (bookingId) => {
      try {
        const booking = await Booking.findById(bookingId);
        if (booking) {
          socket.join(bookingId);
          console.log(`User joined booking room: ${bookingId}`);
        }
      } catch (err) {
        console.error('Error joining booking room:', err);
      }
    });

    // Handle new messages
    socket.on('sendMessage', async ({ bookingId, senderId, content, attachments = [] }) => {
      try {
        const booking = await Booking.findById(bookingId);
        if (!booking) {
          throw new Error('Booking not found');
        }

        // Verify sender is part of this booking
        if (booking.client.toString() !== senderId && 
            booking.provider.toString() !== senderId) {
          throw new Error('Unauthorized to send message');
        }

        // Determine recipient
        const recipientId = senderId === booking.client.toString() 
          ? booking.provider 
          : booking.client;

        // Create and save message
        const message = await Message.create({
          booking: bookingId,
          sender: senderId,
          recipient: recipientId,
          content,
          attachments
        });

        // Populate sender info
        await message.populate('sender', 'name role profileImage');

        // Broadcast message to booking room
        io.to(bookingId).emit('newMessage', message);

      } catch (err) {
        console.error('Error sending message:', err);
        socket.emit('messageError', err.message);
      }
    });

    // Handle message read receipts
    socket.on('markAsRead', async ({ messageId, userId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message || message.recipient.toString() !== userId) {
          throw new Error('Message not found or unauthorized');
        }

        message.read = true;
        message.readAt = new Date();
        await message.save();

        // Notify sender that message was read
        io.to(message.sender.toString()).emit('messageRead', messageId);

      } catch (err) {
        console.error('Error marking message as read:', err);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });
};