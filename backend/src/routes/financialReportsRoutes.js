const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/financialReportsController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

router.use(authenticateToken);

router.get('/income-statement', authorize('view_reports'), reportsController.getIncomeStatement);
router.get('/balance-sheet', authorize('view_reports'), reportsController.getBalanceSheet);
router.get('/trial-balance', authorize('view_reports'), reportsController.getTrialBalance);
router.get('/cash-flow', authorize('view_reports'), reportsController.getCashFlowReport);
router.get('/ar-aging', authorize('view_reports'), reportsController.getARAgingReport);
router.get('/ap-aging', authorize('view_reports'), reportsController.getAPAgingReport);
router.get('/branch-pl/:branchId', authorize('view_reports'), reportsController.getBranchPL);
router.get('/consolidated-pl', authorize('view_reports'), reportsController.getConsolidatedPL);
router.get('/inventory-valuation', authorize('view_reports'), reportsController.getInventoryValuation);
router.get('/sales-book', authorize('view_reports'), reportsController.getSalesBook);

module.exports = router;
