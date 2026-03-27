'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/onlineOrderController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

// Stats first (before /:id to avoid route shadowing)
router.get('/stats', authenticateToken, authorize('view_online_orders'), ctrl.getOrderStats);

// Order listing and detail
router.get('/', authenticateToken, authorize('view_online_orders'), ctrl.getAllOrders);
router.get('/:id', authenticateToken, authorize('view_online_orders'), ctrl.getOrderById);

// Order management
router.put('/:id/status', authenticateToken, authorize('manage_online_orders'), ctrl.updateOrderStatus);
router.put('/:id/tracking', authenticateToken, authorize('manage_online_orders'), ctrl.updateTracking);
router.put('/:id/notes', authenticateToken, authorize('manage_online_orders'), ctrl.updateAdminNotes);

// Payment management
router.put('/:id/confirm-payment', authenticateToken, authorize('manage_online_orders'), ctrl.confirmPayment);
router.put('/:id/reject-payment', authenticateToken, authorize('manage_online_orders'), ctrl.rejectPayment);

module.exports = router;
