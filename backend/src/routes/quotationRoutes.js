const express = require('express');
const router = express.Router();
const quotationController = require('../controllers/quotationController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

router.use(authenticateToken);

router.post('/', authorize('manage_quotations'), quotationController.createQuotation);
router.get('/', authorize('view_quotations'), quotationController.getAllQuotations);
router.get('/:id', authorize('view_quotations'), quotationController.getQuotationById);
router.post('/:id/convert', authorize('manage_quotations'), quotationController.convertToSale);

module.exports = router;
