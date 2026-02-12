const express = require('express');
const router = express.Router();
const { recordPayment, getPaymentAllocations } = require('../controllers/paymentController');
const authenticateToken = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.post('/', recordPayment);
router.get('/allocations', getPaymentAllocations);

module.exports = router;
