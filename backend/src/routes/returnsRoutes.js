const express = require('express');
const router = express.Router();
const returnsController = require('../controllers/returnsController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

router.use(authenticateToken);

// ============================================================================
// RETURN REASONS ROUTES
// ============================================================================

// Get all return reasons
router.get('/reasons', authorize('view_returns'), returnsController.getReturnReasons);

// ============================================================================
// RETURNS ROUTES
// ============================================================================

// Get all returns with filtering
router.get('/', authorize('view_returns'), returnsController.getAllReturns);

// Get statistics (support both /stats and /statistics for compatibility)
router.get('/stats', authorize('view_returns'), returnsController.getReturnStatistics);
router.get('/statistics', authorize('view_returns'), returnsController.getReturnStatistics);

// Get single return
router.get('/:id', authorize('view_returns'), returnsController.getReturn);

// Create new return
router.post('/', authorize('manage_returns'), returnsController.createReturn);

// Approve return
router.post('/:id/approve', authorize('manage_returns'), returnsController.approveReturn);

// Complete return (process refund)
router.post('/:id/complete', authorize('manage_returns'), returnsController.completeReturn);

// Reject return
router.post('/:id/reject', authorize('manage_returns'), returnsController.rejectReturn);

// ============================================================================
// EXCHANGE ROUTES
// ============================================================================

// Create exchange
router.post('/:id/exchange', authorize('manage_returns'), returnsController.createExchange);

module.exports = router;
