'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/onlineOrderController');
const authenticateToken = require('../middleware/authMiddleware');

// Stats first (before /:id to avoid route shadowing)
router.get('/stats', authenticateToken, ctrl.getOrderStats);

// Order listing and detail
router.get('/', authenticateToken, ctrl.getAllOrders);
router.get('/:id', authenticateToken, ctrl.getOrderById);

// Order management
router.put('/:id/status', authenticateToken, ctrl.updateOrderStatus);
router.put('/:id/tracking', authenticateToken, ctrl.updateTracking);
router.put('/:id/notes', authenticateToken, ctrl.updateAdminNotes);

// Payment management
router.put('/:id/confirm-payment', authenticateToken, ctrl.confirmPayment);
router.put('/:id/reject-payment', authenticateToken, ctrl.rejectPayment);

module.exports = router;
