'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/changeRequestController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

// Admin routes (requires BMS auth)
router.get('/', authenticateToken, authorize('manage_online_orders'), ctrl.listChangeRequests);
router.patch('/:id/approve', authenticateToken, authorize('manage_online_orders'), ctrl.approveChangeRequest);
router.patch('/:id/reject', authenticateToken, authorize('manage_online_orders'), ctrl.rejectChangeRequest);

module.exports = router;
