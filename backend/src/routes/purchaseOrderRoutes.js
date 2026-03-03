const express = require('express');
const router = express.Router();
const purchaseOrderController = require('../controllers/purchaseOrderController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

router.use(authenticateToken);

// ============================================================================
// PURCHASE ORDER ROUTES
// ============================================================================

// Get all purchase orders with filtering
router.get('/', authorize('view_purchase_orders'), purchaseOrderController.getAllPurchaseOrders);

// Get statistics
router.get('/statistics', authorize('view_purchase_orders'), purchaseOrderController.getPurchaseOrderStatistics);

// Get single purchase order
router.get('/:id', authorize('view_purchase_orders'), purchaseOrderController.getPurchaseOrder);

// Create new purchase order
router.post('/', authorize('manage_purchase_orders'), purchaseOrderController.createPurchaseOrder);

// Update purchase order
router.put('/:id', authorize('manage_purchase_orders'), purchaseOrderController.updatePurchaseOrder);

// Approve purchase order
router.post('/:id/approve', authorize('manage_purchase_orders'), purchaseOrderController.approvePurchaseOrder);

// Cancel purchase order
router.post('/:id/cancel', authorize('manage_purchase_orders'), purchaseOrderController.cancelPurchaseOrder);

// ============================================================================
// GOODS RECEIVED NOTES (GRN) ROUTES
// ============================================================================

// Receive goods (create GRN)
router.post('/:id/receive', authorize('manage_purchase_orders'), purchaseOrderController.receiveGoods);

// Get GRNs for a purchase order
router.get('/:id/grns', authorize('view_purchase_orders'), purchaseOrderController.getPurchaseOrderGRNs);

// ============================================================================
// GRN DETAILS ROUTE
// ============================================================================

// Get GRN details
router.get('/grns/:id', authorize('view_purchase_orders'), purchaseOrderController.getGRNDetails);

module.exports = router;
