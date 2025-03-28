const express = require('express');
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

// Client booking routes
router.post('/',
  authController.restrictTo('client'),
  bookingController.createBooking
);

router.get('/my-bookings',
  authController.restrictTo('client'),
  bookingController.getClientBookings
);

// Provider booking management routes
router.get('/provider',
  authController.restrictTo('provider'),
  bookingController.getProviderBookings
);

router.patch('/:id/confirm',
  authController.restrictTo('provider'),
  bookingController.confirmBooking
);

router.patch('/:id/cancel',
  authController.restrictTo('provider', 'client'),
  bookingController.cancelBooking
);

// Admin booking routes
router.get('/admin',
  authController.restrictTo('admin'),
  bookingController.getAllBookings
);

module.exports = router;