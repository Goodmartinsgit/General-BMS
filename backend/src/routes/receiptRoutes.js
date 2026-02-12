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

router.use(authenticateToken);

// ============================================================================
// RECEIPT CONFIGURATION ROUTES
// ============================================================================

// Get receipt configuration
router.get('/config', getReceiptConfig);

// Update receipt configuration
router.put('/config', updateReceiptConfig);

// ============================================================================
// RECEIPT TEMPLATE ROUTES
// ============================================================================

// Get available receipt templates
router.get('/templates', getReceiptTemplates);

// ============================================================================
// RECEIPT GENERATION ROUTES
// ============================================================================

// Get receipt data for preview
router.get('/:saleId/data', getReceiptData);

// Generate PDF receipt
router.get('/:saleId/pdf', generateReceiptPDF);

// Format receipt for printing (thermal printer)
router.get('/:saleId/print', printReceipt);

// ============================================================================
// RECEIPT DELIVERY ROUTES
// ============================================================================

// Email receipt to customer
router.post('/:saleId/email', emailReceipt);

// Send receipt via WhatsApp
router.post('/:saleId/whatsapp', whatsappReceipt);

// ============================================================================
// RECEIPT HISTORY ROUTES
// ============================================================================

// Get customer receipt history
router.get('/customer/:customerId/history', getCustomerReceipts);

module.exports = router;
