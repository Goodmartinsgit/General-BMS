const express = require('express');
const router = express.Router();
const {
    getBranchDashboard,
    getBranchSalesReport,
    getBranchInventoryValuation,
    getBranchLowStockReport,
    getBranchPLReport,
    compareBranches,
    getBranchStaffPerformance,
    getBranchCustomerAnalytics
} = require('../controllers/branchAnalyticsController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

router.use(authenticateToken);

// ============================================================================
// BRANCH COMPARISON ROUTES
// ============================================================================

// Compare all branches
router.get('/comparison', authorize('view_analytics'), compareBranches);

// ============================================================================
// BRANCH-SPECIFIC ANALYTICS ROUTES
// ============================================================================

// Get branch performance dashboard
router.get('/:branchId/dashboard', authorize('view_analytics'), getBranchDashboard);

// Get branch sales report
router.get('/:branchId/sales-report', authorize('view_analytics'), getBranchSalesReport);

// Get branch inventory valuation
router.get('/:branchId/inventory-valuation', authorize('view_analytics'), getBranchInventoryValuation);

// Get branch low stock report
router.get('/:branchId/low-stock', authorize('view_analytics'), getBranchLowStockReport);

// Get branch P&L report
router.get('/:branchId/pl-report', authorize('view_analytics'), getBranchPLReport);

// Get branch staff performance
router.get('/:branchId/staff-performance', authorize('view_analytics'), getBranchStaffPerformance);

// Get branch customer analytics
router.get('/:branchId/customer-analytics', authorize('view_analytics'), getBranchCustomerAnalytics);

module.exports = router;
