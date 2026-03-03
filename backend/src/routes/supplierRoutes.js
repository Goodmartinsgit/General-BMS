const express = require('express');
const router = express.Router();
const { createSupplier, getAllSuppliers, updateSupplier, deleteSupplier } = require('../controllers/supplierController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

router.use(authenticateToken);

router.get('/', authorize('view_suppliers'), getAllSuppliers);
router.post('/', authorize('manage_suppliers'), createSupplier);
router.put('/:id', authorize('manage_suppliers'), updateSupplier);
router.delete('/:id', authorize('manage_suppliers'), deleteSupplier);

module.exports = router;
