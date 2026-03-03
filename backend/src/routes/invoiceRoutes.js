const express = require('express');
const router = express.Router();
const { getInvoices, getInvoiceById, createInvoice, createFromSale, updateInvoice, deleteInvoice, recordPayment, writeOff, getARAging, getCustomerStatement } = require('../controllers/invoiceController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

router.use(authenticateToken);

router.get('/', authorize('view_invoices'), getInvoices);
router.get('/reports/aging', authorize('view_invoices'), getARAging);
router.get('/customer-statement/:customerId', authorize('view_invoices'), getCustomerStatement);
router.get('/:id', authorize('view_invoices'), getInvoiceById);
router.post('/', authorize('manage_invoices'), createInvoice);
router.post('/from-sale', authorize('manage_invoices'), createFromSale);
router.put('/:id', authorize('manage_invoices'), updateInvoice);
router.delete('/:id', authorize('manage_invoices'), deleteInvoice);
router.post('/:id/payments', authorize('manage_invoices'), recordPayment);
router.post('/:id/write-off', authorize('manage_invoices'), writeOff);

module.exports = router;
