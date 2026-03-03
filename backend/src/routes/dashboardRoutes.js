const express = require('express');
const router = express.Router();
const { getDashboardStats, getActivityFeed, getQuickActionCounts } = require('../controllers/dashboardController');
const authenticateToken = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/stats', getDashboardStats);
router.get('/activity-feed', getActivityFeed);
router.get('/quick-actions', getQuickActionCounts);

module.exports = router;
