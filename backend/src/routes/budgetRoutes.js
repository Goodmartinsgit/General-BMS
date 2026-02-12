const express = require('express');
const router = express.Router();
const { createBudget, getBudgets, getBudgetDetails } = require('../controllers/budgetController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

router.use(authenticateToken);

router.post('/', authorize('manage_budgets'), createBudget);
router.get('/', authorize('view_budgets'), getBudgets);
router.get('/:id', authorize('view_budgets'), getBudgetDetails);

module.exports = router;
