const express = require('express');
const router = express.Router();
const { getDashboardStats, getInventoryReport } = require('../controllers/reportController');
const authenticateToken = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/dashboard-stats', getDashboardStats);
router.get('/inventory', getInventoryReport);

module.exports = router;
