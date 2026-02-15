const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');

router.post('/', driverController.createDriver);
router.put('/:id/location', driverController.updateLocation);

module.exports = router;
