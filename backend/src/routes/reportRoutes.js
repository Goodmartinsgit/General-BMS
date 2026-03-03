const express = require('express');
const router = express.Router();
const { getDashboardStats, getInventoryReport } = require('../controllers/reportController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

router.use(authenticateToken);

router.get('/dashboard-stats', authorize('view_reports'), getDashboardStats);
router.get('/inventory', authorize('view_reports'), getInventoryReport);

module.exports = router;
