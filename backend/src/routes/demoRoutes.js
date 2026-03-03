const express = require('express');
const router = express.Router();
const demoController = require('../controllers/demoController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

router.use(authenticateToken);

router.get('/', authorize('view_settings'), demoController.getDemoSettings);
router.put('/', authorize('manage_settings'), demoController.updateDemoSettings);

module.exports = router;
