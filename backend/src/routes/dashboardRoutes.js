const express = require('express');
const router = express.Router();
const { getDashboardStats, getActivityFeed, getQuickActionCounts } = require('../controllers/dashboardController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

router.use(authenticateToken);

router.get('/stats', authorize('view_dashboard'), getDashboardStats);
router.get('/activity-feed', authorize('view_dashboard'), getActivityFeed);
router.get('/quick-actions', authorize('view_dashboard'), getQuickActionCounts);

module.exports = router;
