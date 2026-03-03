const express = require('express');
const router = express.Router();
const { createExpense, getAllExpenses, updateExpense, deleteExpense } = require('../controllers/expenseController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

router.use(authenticateToken);

router.get('/', authorize('view_expenses'), getAllExpenses);
router.post('/', authorize('manage_expenses'), createExpense);
router.put('/:id', authorize('manage_expenses'), updateExpense);
router.delete('/:id', authorize('delete_expenses'), deleteExpense);

module.exports = router;
