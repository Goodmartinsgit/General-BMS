const express = require('express');
const router = express.Router();
const { getAdminConfig, updateConfig, getCompanySettingsForStore } = require('../controllers/storeConfigController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

// Admin only
router.get('/company-settings', authenticateToken, authorize('view_online_store'), getCompanySettingsForStore);
router.get('/', authenticateToken, authorize('view_online_store'), getAdminConfig);
router.put('/', authenticateToken, authorize('manage_online_store'), updateConfig);

module.exports = router;
