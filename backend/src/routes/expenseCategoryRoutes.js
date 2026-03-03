const express = require('express');
const router = express.Router();
const { getAllExpenseCategories, createExpenseCategory } = require('../controllers/expenseCategoryController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

router.use(authenticateToken);

router.get('/', authorize('view_expenses'), getAllExpenseCategories);
router.post('/', authorize('manage_expenses'), createExpenseCategory);

module.exports = router;
