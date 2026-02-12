const express = require('express');
const router = express.Router();
const { getInventoryByBranch, getAllInventory, updateStock, getStockMovements } = require('../controllers/inventoryController');
const authenticateToken = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/', getAllInventory);
router.get('/movements', getStockMovements);
router.get('/:branchId', getInventoryByBranch);
router.post('/update', updateStock);

module.exports = router;
