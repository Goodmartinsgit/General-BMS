const express = require('express');
const router = express.Router();
const { getAdminConfig, updateConfig, getCompanySettingsForStore } = require('../controllers/storeConfigController');
const authenticateToken = require('../middleware/authMiddleware');

// Admin only
router.get('/company-settings', authenticateToken, getCompanySettingsForStore);
router.get('/', authenticateToken, getAdminConfig);
router.put('/', authenticateToken, updateConfig);

module.exports = router;
