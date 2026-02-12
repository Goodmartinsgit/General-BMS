const express = require('express');
const router = express.Router();
const serialTrackingController = require('../controllers/serialTrackingController');

// ============================================================================
// SERIAL NUMBER ROUTES
// ============================================================================

// Get all serial numbers with filtering
router.get('/serial-numbers', serialTrackingController.getAllSerialNumbers);

// Get warranty expiring soon
router.get('/serial-numbers/warranty-expiring', serialTrackingController.getWarrantyExpiringSoon);

// Get single serial number
router.get('/serial-numbers/:serialNumber', serialTrackingController.getSerialNumber);

// Register new serial number
router.post('/serial-numbers', serialTrackingController.registerSerialNumber);

// Bulk register serial numbers
router.post('/serial-numbers/bulk', serialTrackingController.bulkRegisterSerialNumbers);

// Update serial number
router.put('/serial-numbers/:serialNumber', serialTrackingController.updateSerialNumber);

// Mark serial as sold
router.post('/serial-numbers/:serialNumber/sell', serialTrackingController.markSerialAsSold);

// ============================================================================
// BATCH ROUTES
// ============================================================================

// Get all batches with filtering
router.get('/batches', serialTrackingController.getAllBatches);

// Get batches expiring soon
router.get('/batches/expiring-soon', serialTrackingController.getBatchesExpiringSoon);

// Get single batch
router.get('/batches/:batchNumber', serialTrackingController.getBatch);

// Create new batch
router.post('/batches', serialTrackingController.createBatch);

// Adjust batch quantity
router.post('/batches/:batchNumber/adjust', serialTrackingController.adjustBatchQuantity);

// Recall batch
router.post('/batches/:batchNumber/recall', serialTrackingController.recallBatch);

// ============================================================================
// ANALYTICS ROUTES
// ============================================================================

// Get statistics
router.get('/statistics', serialTrackingController.getSerialTrackingStatistics);

module.exports = router;
