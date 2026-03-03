const express = require('express');
const router = express.Router();
const { getInventoryByBranch, getAllInventory, updateStock, getStockMovements } = require('../controllers/inventoryController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

router.use(authenticateToken);

router.get('/', authorize('view_inventory'), getAllInventory);
router.get('/movements', authorize('view_inventory'), getStockMovements);
router.get('/:branchId', authorize('view_inventory'), getInventoryByBranch);
router.post('/update', authorize('manage_inventory'), updateStock);

module.exports = router;
