const express = require('express');
const router = express.Router();
const purchaseOrderController = require('../controllers/purchaseOrderController');

// ============================================================================
// PURCHASE ORDER ROUTES
// ============================================================================

// Get all purchase orders with filtering
router.get('/', purchaseOrderController.getAllPurchaseOrders);

// Get statistics
router.get('/statistics', purchaseOrderController.getPurchaseOrderStatistics);

// Get single purchase order
router.get('/:id', purchaseOrderController.getPurchaseOrder);

// Create new purchase order
router.post('/', purchaseOrderController.createPurchaseOrder);

// Update purchase order
router.put('/:id', purchaseOrderController.updatePurchaseOrder);

// Approve purchase order
router.post('/:id/approve', purchaseOrderController.approvePurchaseOrder);

// Cancel purchase order
router.post('/:id/cancel', purchaseOrderController.cancelPurchaseOrder);

// ============================================================================
// GOODS RECEIVED NOTES (GRN) ROUTES
// ============================================================================

// Receive goods (create GRN)
router.post('/:id/receive', purchaseOrderController.receiveGoods);

// Get GRNs for a purchase order
router.get('/:id/grns', purchaseOrderController.getPurchaseOrderGRNs);

// ============================================================================
// GRN DETAILS ROUTE
// ============================================================================

// Get GRN details
router.get('/grns/:id', purchaseOrderController.getGRNDetails);

module.exports = router;
