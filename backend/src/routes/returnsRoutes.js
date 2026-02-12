const express = require('express');
const router = express.Router();
const returnsController = require('../controllers/returnsController');

// ============================================================================
// RETURN REASONS ROUTES
// ============================================================================

// Get all return reasons
router.get('/reasons', returnsController.getReturnReasons);

// ============================================================================
// RETURNS ROUTES
// ============================================================================

// Get all returns with filtering
router.get('/', returnsController.getAllReturns);

// Get statistics
router.get('/statistics', returnsController.getReturnStatistics);

// Get single return
router.get('/:id', returnsController.getReturn);

// Create new return
router.post('/', returnsController.createReturn);

// Approve return
router.post('/:id/approve', returnsController.approveReturn);

// Complete return (process refund)
router.post('/:id/complete', returnsController.completeReturn);

// Reject return
router.post('/:id/reject', returnsController.rejectReturn);

// ============================================================================
// EXCHANGE ROUTES
// ============================================================================

// Create exchange
router.post('/:id/exchange', returnsController.createExchange);

module.exports = router;
