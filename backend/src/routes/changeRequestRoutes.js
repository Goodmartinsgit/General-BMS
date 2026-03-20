'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/changeRequestController');
const authenticateToken = require('../middleware/authMiddleware');

// Admin routes (requires BMS auth)
router.get('/', authenticateToken, ctrl.listChangeRequests);
router.patch('/:id/approve', authenticateToken, ctrl.approveChangeRequest);
router.patch('/:id/reject', authenticateToken, ctrl.rejectChangeRequest);

module.exports = router;
