const express = require('express');
const router = express.Router();
const { getBills, getBillById, createBill, updateBill, deleteBill, recordPayment, getAPAging } = require('../controllers/billController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

router.use(authenticateToken);

router.get('/', authorize('view_bills'), getBills);
router.get('/reports/aging', authorize('view_bills'), getAPAging);
router.get('/:id', authorize('view_bills'), getBillById);
router.post('/', authorize('manage_bills'), createBill);
router.put('/:id', authorize('manage_bills'), updateBill);
router.delete('/:id', authorize('manage_bills'), deleteBill);
router.post('/:id/payments', authorize('manage_bills'), recordPayment);

module.exports = router;
