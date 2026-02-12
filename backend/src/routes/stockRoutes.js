const express = require('express');
const router = express.Router();
const {
    createStockTransfer,
    getAllStockTransfers,
    getStockTransfer,
    approveStockTransfer,
    completeStockTransfer,
    cancelStockTransfer,
    recordStockDamage,
    getAllStockDamages,
    getStockDamageStatistics,
    getStockActivity,
    createStockAdjustment
} = require('../controllers/stockController');
const authenticateToken = require('../middleware/authMiddleware');

router.use(authenticateToken);

// ============================================================================
// STOCK TRANSFER ROUTES
// ============================================================================

// Get all stock transfers with filtering
router.get('/transfers', getAllStockTransfers);

// Get single stock transfer
router.get('/transfers/:id', getStockTransfer);

// Create new stock transfer
router.post('/transfers', createStockTransfer);

// Approve stock transfer
router.post('/transfers/:id/approve', approveStockTransfer);

// Complete stock transfer (execute the transfer)
router.post('/transfers/:id/complete', completeStockTransfer);

// Cancel stock transfer
router.post('/transfers/:id/cancel', cancelStockTransfer);

// ============================================================================
// STOCK DAMAGE ROUTES
// ============================================================================

// Get all stock damages with filtering
router.get('/damages', getAllStockDamages);

// Get damage statistics
router.get('/damages/statistics', getStockDamageStatistics);

// Record new stock damage
router.post('/damages', recordStockDamage);

// ============================================================================
// STOCK ACTIVITY ROUTES
// ============================================================================

// Get stock activity log
router.get('/activity', getStockActivity);

// ============================================================================
// STOCK ADJUSTMENT ROUTES
// ============================================================================

// Create manual stock adjustment
router.post('/adjustments', createStockAdjustment);

module.exports = router;
