const express = require('express');
const router = express.Router();
const { getCostCenters, getCostCenterById, createCostCenter, updateCostCenter, deleteCostCenter } = require('../controllers/costCenterController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

router.use(authenticateToken);

router.get('/', authorize('view_accounting'), getCostCenters);
router.get('/:id', authorize('view_accounting'), getCostCenterById);
router.post('/', authorize('manage_accounting'), createCostCenter);
router.put('/:id', authorize('manage_accounting'), updateCostCenter);
router.delete('/:id', authorize('manage_accounting'), deleteCostCenter);

module.exports = router;
