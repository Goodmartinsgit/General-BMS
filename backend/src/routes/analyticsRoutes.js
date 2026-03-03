const express = require('express');
const router = express.Router();
const {
    getSalesAnalytics,
    getSalesTrend,
    getInventoryValue,
    getLowStockItems,
    getStockMovementSummary,
    getInventoryTurnover,
    getTopCustomers,
    getCustomerGrowth,
    getCustomerRetention
} = require('../controllers/analyticsController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

router.use(authenticateToken);

// Sales analytics
router.get('/sales', authorize('view_analytics'), getSalesAnalytics);
router.get('/sales/trend', authorize('view_analytics'), getSalesTrend);

// Inventory analytics
router.get('/inventory/value', authorize('view_analytics'), getInventoryValue);
router.get('/inventory/low-stock', authorize('view_analytics'), getLowStockItems);
router.get('/inventory/movements', authorize('view_analytics'), getStockMovementSummary);
router.get('/inventory/turnover', authorize('view_analytics'), getInventoryTurnover);

// Customer analytics
router.get('/customers/top', authorize('view_analytics'), getTopCustomers);
router.get('/customers/growth', authorize('view_analytics'), getCustomerGrowth);
router.get('/customers/retention', authorize('view_analytics'), getCustomerRetention);

module.exports = router;
