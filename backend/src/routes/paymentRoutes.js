const express = require('express');
const router = express.Router();
const { recordPayment, getPaymentAllocations } = require('../controllers/paymentController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

router.use(authenticateToken);

router.post('/', authorize('manage_payments'), recordPayment);
router.get('/allocations', authorize('view_payments'), getPaymentAllocations);

module.exports = router;
