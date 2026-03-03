'use strict';

const express = require('express');
const router = express.Router({ mergeParams: true });
const ctrl = require('../controllers/storeOrderController');
const { storeAuth } = require('../middleware/storeAuthMiddleware');
const upload = require('../middleware/upload');

// Public order tracking — must be declared before /:orderId to avoid conflict
router.get('/track/:orderNumber', ctrl.trackOrder);

router.get('/', storeAuth, ctrl.getOrders);
router.get('/:orderId', storeAuth, ctrl.getOrderById);
router.post('/:orderId/cancel', storeAuth, ctrl.cancelOrder);
router.post('/:orderId/proof-of-payment', storeAuth, upload.single('proof'), ctrl.uploadProofOfPayment);

module.exports = router;
