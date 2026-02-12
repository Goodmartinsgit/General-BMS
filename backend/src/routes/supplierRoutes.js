const express = require('express');
const router = express.Router();
const { createSupplier, getAllSuppliers, updateSupplier, deleteSupplier } = require('../controllers/supplierController');
const authenticateToken = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/', getAllSuppliers);
router.post('/', createSupplier);
router.put('/:id', updateSupplier);
router.delete('/:id', deleteSupplier);

module.exports = router;
