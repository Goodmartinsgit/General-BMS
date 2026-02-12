const express = require('express');
const router = express.Router();
const quotationController = require('../controllers/quotationController');
const authenticateToken = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.post('/', quotationController.createQuotation);
router.get('/', quotationController.getAllQuotations);
router.get('/:id', quotationController.getQuotationById);
router.post('/:id/convert', quotationController.convertToSale);

module.exports = router;
