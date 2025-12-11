const express = require('express');
const router = express.Router();
const controller = require('../controllers/bookingController');

router.post('/', controller.createBooking);
router.post('/:id/confirm', controller.confirmBooking);
router.get('/:id', controller.getBooking);
router.get('/slot/:slotId', controller.listBookingsForSlot);

module.exports = router;
