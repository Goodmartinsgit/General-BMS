const express = require('express');
const router = express.Router();
const { trackOrder } = require('../controllers/storeCatalogController');

// Public order tracking (no slug needed)
router.get('/track-order', trackOrder);

module.exports = router;
