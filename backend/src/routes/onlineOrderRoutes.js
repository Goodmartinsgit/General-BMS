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
router.put('/:id/status', authenticateToken, authorize('process_online_orders'), ctrl.updateOrderStatus);
router.put('/:id/tracking', authenticateToken, authorize('update_order_tracking'), ctrl.updateTracking);
router.put('/:id/notes', authenticateToken, authorize('edit_order_notes'), ctrl.updateAdminNotes);

// Payment management
router.put('/:id/confirm-payment', authenticateToken, authorize('verify_order_payment'), ctrl.confirmPayment);
router.put('/:id/reject-payment', authenticateToken, authorize('verify_order_payment'), ctrl.rejectPayment);

module.exports = router;
