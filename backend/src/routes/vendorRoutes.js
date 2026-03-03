const express = require('express');
const router = express.Router();
const { getVendors, getVendorById, createVendor, updateVendor, deleteVendor, getVendorBills } = require('../controllers/vendorController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

router.use(authenticateToken);

router.get('/', authorize('view_vendors'), getVendors);
router.get('/:id', authorize('view_vendors'), getVendorById);
router.get('/:id/bills', authorize('view_vendors'), getVendorBills);
router.post('/', authorize('manage_vendors'), createVendor);
router.put('/:id', authorize('manage_vendors'), updateVendor);
router.delete('/:id', authorize('manage_vendors'), deleteVendor);

module.exports = router;
