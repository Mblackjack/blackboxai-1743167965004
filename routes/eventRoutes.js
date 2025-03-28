const express = require('express');
const eventController = require('../controllers/eventController');
const authController = require('../controllers/authController');

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

// Client event management routes
router.route('/')
  .post(eventController.createEvent)
  .get(eventController.getUserEvents);

router.route('/:id')
  .get(eventController.getEvent)
  .patch(eventController.updateEvent)
  .delete(eventController.deleteEvent);

// Provider access to their booked events
router.get('/provider/my-events', 
  authController.restrictTo('provider'),
  eventController.getProviderEvents
);

// Admin access to all events
router.get('/admin/all-events',
  authController.restrictTo('admin'),
  eventController.getAllEvents
);

module.exports = router;