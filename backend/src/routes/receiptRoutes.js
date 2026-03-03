const express = require('express');
const router = express.Router();
const {
    getReceiptConfig,
    updateReceiptConfig,
    generateReceiptPDF,
    getReceiptData,
    emailReceipt,
    whatsappReceipt,
    printReceipt,
    getReceiptTemplates,
    getCustomerReceipts
} = require('../controllers/receiptController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

router.use(authenticateToken);

// ============================================================================
// RECEIPT CONFIGURATION ROUTES
// ============================================================================

// Get receipt configuration
router.get('/config', authorize('view_receipts'), getReceiptConfig);

// Update receipt configuration
router.put('/config', authorize('manage_receipts'), updateReceiptConfig);

// ============================================================================
// RECEIPT TEMPLATE ROUTES
// ============================================================================

// Get available receipt templates
router.get('/templates', authorize('view_receipts'), getReceiptTemplates);

// ============================================================================
// RECEIPT GENERATION ROUTES
// ============================================================================

// Get receipt data for preview
router.get('/:saleId/data', authorize('view_receipts'), getReceiptData);

// Generate PDF receipt
router.get('/:saleId/pdf', authorize('view_receipts'), generateReceiptPDF);

// Format receipt for printing (thermal printer)
router.get('/:saleId/print', authorize('view_receipts'), printReceipt);

// ============================================================================
// RECEIPT DELIVERY ROUTES
// ============================================================================

// Email receipt to customer
router.post('/:saleId/email', authorize('manage_receipts'), emailReceipt);

// Send receipt via WhatsApp
router.post('/:saleId/whatsapp', authorize('manage_receipts'), whatsappReceipt);

// ============================================================================
// RECEIPT HISTORY ROUTES
// ============================================================================

// Get customer receipt history
router.get('/customer/:customerId/history', authorize('view_receipts'), getCustomerReceipts);

module.exports = router;
