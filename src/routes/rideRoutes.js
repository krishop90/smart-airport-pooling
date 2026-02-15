const express = require('express');
const router = express.Router();
const rideController = require('../controllers/rideController');

router.post('/request', rideController.requestRide);
router.post('/:id/cancel', rideController.cancelRide);
router.get('/:id', rideController.getRideStatus);

module.exports = router;
