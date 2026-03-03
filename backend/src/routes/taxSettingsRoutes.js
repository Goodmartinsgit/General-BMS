const express = require('express');
const router = express.Router();
const taxSettingsController = require('../controllers/taxSettingsController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

router.use(authenticateToken);

router.get('/', authorize('view_settings'), taxSettingsController.getTaxSettings);
router.put('/', authorize('manage_settings'), taxSettingsController.updateTaxSettings);

module.exports = router;
