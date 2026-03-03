const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const receiptController = require('../controllers/receiptController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

// Public routes (accessible without login)
router.get('/company', settingsController.getCompanyInfo);

// Protected routes (require login)
router.use(authenticateToken);

// General settings - get all
router.get('/', authorize('view_settings'), settingsController.getSettings);

// General settings - update all
router.put('/', authorize('manage_settings'), settingsController.updateSettings);

// Company info
router.put('/company', authorize('manage_settings'), settingsController.updateCompanyInfo);

// Receipt template (delegated to receiptController)
router.get('/receipt-template', authorize('view_settings'), receiptController.getReceiptConfig);
router.put('/receipt-template', authorize('manage_settings'), receiptController.updateReceiptConfig);

// Setting categories (tax, payment, etc.) - must be after specific routes
router.get('/:category', authorize('view_settings'), settingsController.getSettingCategory);
router.put('/:category', authorize('manage_settings'), settingsController.updateSettingCategory);

module.exports = router;
