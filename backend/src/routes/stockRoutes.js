const express = require('express');
const router = express.Router();
const {
    createStockTransfer,
    getAllStockTransfers,
    getStockTransfer,
    approveStockTransfer,
    completeStockTransfer,
    cancelStockTransfer,
    getStockTransferStats,
    recordStockDamage,
    getAllStockDamages,
    getStockDamageStatistics,
    getStockActivity,
    createStockAdjustment
} = require('../controllers/stockController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

router.use(authenticateToken);

// ============================================================================
// STOCK TRANSFER ROUTES
// ============================================================================

// Get stock transfer statistics
router.get('/stats', authorize('view_stock'), getStockTransferStats);

// Get all stock transfers with filtering
router.get('/transfers', authorize('view_stock'), getAllStockTransfers);

// Get single stock transfer
router.get('/transfers/:id', authorize('view_stock'), getStockTransfer);

// Create new stock transfer
router.post('/transfers', authorize('manage_stock'), createStockTransfer);

// Approve stock transfer
router.post('/transfers/:id/approve', authorize('approve_stock_transfers'), approveStockTransfer);

// Complete stock transfer (execute the transfer)
router.post('/transfers/:id/complete', authorize('approve_stock_transfers'), completeStockTransfer);

// Cancel stock transfer
router.post('/transfers/:id/cancel', authorize('approve_stock_transfers'), cancelStockTransfer);

// ============================================================================
// STOCK DAMAGE ROUTES
// ============================================================================

// Get all stock damages with filtering
router.get('/damages', authorize('view_stock'), getAllStockDamages);

// Get damage statistics
router.get('/damages/statistics', authorize('view_stock'), getStockDamageStatistics);

// Record new stock damage
router.post('/damages', authorize('manage_stock'), recordStockDamage);

// ============================================================================
// STOCK ACTIVITY ROUTES
// ============================================================================

// Get stock activity log
router.get('/activity', authorize('view_stock'), getStockActivity);

// ============================================================================
// STOCK ADJUSTMENT ROUTES
// ============================================================================

// Create manual stock adjustment
router.post('/adjustments', authorize('manage_stock'), createStockAdjustment);

module.exports = router;
