const express = require('express');
const router = express.Router();
const serialTrackingController = require('../controllers/serialTrackingController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

router.use(authenticateToken);

// ============================================================================
// SERIAL NUMBER ROUTES
// ============================================================================

// Get all serial numbers with filtering
router.get('/serial-numbers', authorize('view_products'), serialTrackingController.getAllSerialNumbers);

// Get warranty expiring soon
router.get('/serial-numbers/warranty-expiring', authorize('view_products'), serialTrackingController.getWarrantyExpiringSoon);

// Get single serial number
router.get('/serial-numbers/:serialNumber', authorize('view_products'), serialTrackingController.getSerialNumber);

// Register new serial number
router.post('/serial-numbers', authorize('manage_products'), serialTrackingController.registerSerialNumber);

// Bulk register serial numbers
router.post('/serial-numbers/bulk', authorize('manage_products'), serialTrackingController.bulkRegisterSerialNumbers);

// Update serial number
router.put('/serial-numbers/:serialNumber', authorize('manage_products'), serialTrackingController.updateSerialNumber);

// Mark serial as sold
router.post('/serial-numbers/:serialNumber/sell', authorize('manage_products'), serialTrackingController.markSerialAsSold);

// ============================================================================
// BATCH ROUTES
// ============================================================================

// Get all batches with filtering
router.get('/batches', authorize('view_products'), serialTrackingController.getAllBatches);

// Get batches expiring soon
router.get('/batches/expiring-soon', authorize('view_products'), serialTrackingController.getBatchesExpiringSoon);

// Get single batch
router.get('/batches/:batchNumber', authorize('view_products'), serialTrackingController.getBatch);

// Create new batch
router.post('/batches', authorize('manage_products'), serialTrackingController.createBatch);

// Adjust batch quantity
router.post('/batches/:batchNumber/adjust', authorize('manage_products'), serialTrackingController.adjustBatchQuantity);

// Recall batch
router.post('/batches/:batchNumber/recall', authorize('manage_products'), serialTrackingController.recallBatch);

// ============================================================================
// ANALYTICS ROUTES
// ============================================================================

// Get statistics
router.get('/statistics', authorize('view_products'), serialTrackingController.getSerialTrackingStatistics);

module.exports = router;
