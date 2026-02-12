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

router.use(authenticateToken);

// ============================================================================
// BRANCH COMPARISON ROUTES
// ============================================================================

// Compare all branches
router.get('/comparison', compareBranches);

// ============================================================================
// BRANCH-SPECIFIC ANALYTICS ROUTES
// ============================================================================

// Get branch performance dashboard
router.get('/:branchId/dashboard', getBranchDashboard);

// Get branch sales report
router.get('/:branchId/sales-report', getBranchSalesReport);

// Get branch inventory valuation
router.get('/:branchId/inventory-valuation', getBranchInventoryValuation);

// Get branch low stock report
router.get('/:branchId/low-stock', getBranchLowStockReport);

// Get branch P&L report
router.get('/:branchId/pl-report', getBranchPLReport);

// Get branch staff performance
router.get('/:branchId/staff-performance', getBranchStaffPerformance);

// Get branch customer analytics
router.get('/:branchId/customer-analytics', getBranchCustomerAnalytics);

module.exports = router;
