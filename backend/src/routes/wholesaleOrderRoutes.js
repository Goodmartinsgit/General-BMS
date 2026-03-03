const express = require('express');
const router = express.Router();
const { createWholesaleOrder, getAllWholesaleOrders, updateWholesaleOrderStatus, getWholesaleOrderById } = require('../controllers/wholesaleOrderController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

router.use(authenticateToken);

router.get('/', authorize('view_wholesale_orders'), getAllWholesaleOrders);
router.get('/:id', authorize('view_wholesale_orders'), getWholesaleOrderById);
router.post('/', authorize('manage_wholesale_orders'), createWholesaleOrder);
router.patch('/:id/status', authorize('manage_wholesale_orders'), updateWholesaleOrderStatus);

module.exports = router;
