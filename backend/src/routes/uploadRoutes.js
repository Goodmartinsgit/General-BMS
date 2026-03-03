const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');
const upload = require('../middleware/upload');
const { uploadMedia, deleteMedia } = require('../controllers/uploadController');

// All upload routes require authentication
router.use(authenticateToken);

// Category-specific upload endpoints
// Each folder maps to a Cloudinary folder: bms/<category>
router.post('/branding',    authorize('manage_settings'), upload.single('file'), uploadMedia('branding'));
router.post('/products',    authorize('manage_products'), upload.single('file'), uploadMedia('products'));
router.post('/receipts',    authorize('manage_settings'), upload.single('file'), uploadMedia('receipts'));
router.post('/staff',       authorize('manage_users'),    upload.single('file'), uploadMedia('staff'));
router.post('/suppliers',   authorize('manage_suppliers'), upload.single('file'), uploadMedia('suppliers'));
router.post('/categories',  authorize('manage_products'), upload.single('file'), uploadMedia('categories'));
router.post('/promotions',  authorize('manage_promotions'), upload.single('file'), uploadMedia('promotions'));

// Delete any uploaded asset by public_id
router.delete('/', authorize('manage_settings'), deleteMedia);

module.exports = router;
