const express = require('express');
const router = express.Router();
const brandingController = require('../controllers/brandingController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

// Public - needed for login page branding
router.get('/', brandingController.getBrandingConfig);

// Protected - admin only
router.put('/', authenticateToken, authorize('manage_settings'), brandingController.updateBrandingConfig);

module.exports = router;
