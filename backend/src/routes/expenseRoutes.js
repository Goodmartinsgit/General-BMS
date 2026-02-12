const express = require('express');
const router = express.Router();
const { createExpense, getAllExpenses, deleteExpense } = require('../controllers/expenseController');
const authenticateToken = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/', getAllExpenses);
router.post('/', createExpense);
router.delete('/:id', deleteExpense);

module.exports = router;
