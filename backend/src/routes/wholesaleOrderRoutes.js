const express = require('express');
const router = express.Router();
const { createWholesaleOrder, getAllWholesaleOrders, updateWholesaleOrderStatus, getWholesaleOrderById } = require('../controllers/wholesaleOrderController');
const authenticateToken = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/', getAllWholesaleOrders);
router.get('/:id', getWholesaleOrderById);
router.post('/', createWholesaleOrder);
router.patch('/:id/status', updateWholesaleOrderStatus);

module.exports = router;
