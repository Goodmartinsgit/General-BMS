const express = require('express');
const router = express.Router();
const { getAdminConfig, updateConfig } = require('../controllers/storeConfigController');
const authenticateToken = require('../middleware/authMiddleware');

// Admin only
router.get('/', authenticateToken, getAdminConfig);
router.put('/', authenticateToken, updateConfig);

module.exports = router;
