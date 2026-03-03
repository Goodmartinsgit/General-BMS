'use strict';

const express = require('express');
const router = express.Router({ mergeParams: true });
const ctrl = require('../controllers/storeCheckoutController');
const { optionalStoreAuth } = require('../middleware/storeAuthMiddleware');
const sessionMiddleware = require('../middleware/sessionMiddleware');
const upload = require('../middleware/upload');

// Place an order (authenticated or guest)
router.post('/', sessionMiddleware, optionalStoreAuth, ctrl.checkout);

// Verify Paystack payment by reference
router.get('/verify', ctrl.verifyPayment);

// Upload proof of payment for a bank-transfer order
router.post(
  '/proof-of-payment/:orderId',
  sessionMiddleware,
  optionalStoreAuth,
  upload.single('proof'),
  ctrl.uploadProofOfPayment
);

module.exports = router;
