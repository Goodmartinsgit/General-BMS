const { pool } = require('../config/db');

const createExpense = async (req, res) => {
    try {
        const { branch_id, category_id, amount, description, expense_date, status, receipt_url } = req.body;
        const submitted_by = req.user.id;

        // Generate expense number
        const expense_number = `EXP-${Date.now().toString().slice(-8)}`;

        const result = await pool.query(
            `INSERT INTO expenses (expense_number, branch_id, category_id, amount, description, expense_date, status, receipt_url, submitted_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [expense_number, branch_id, category_id, amount, description, expense_date || new Date(), status || 'pending', receipt_url, submitted_by]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating expense:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAllExpenses = async (req, res) => {
    try {
        const { branchId, categoryId, status, startDate, endDate } = req.query;
        let q = `SELECT e.*, b.branch_name, ec.category_name, u.full_name as submitted_by_name,
                        a.full_name as approved_by_name
                 FROM expenses e
                 JOIN branches b ON e.branch_id = b.id
                 LEFT JOIN expense_categories ec ON e.category_id = ec.id
                 JOIN users u ON e.submitted_by = u.id
                 LEFT JOIN users a ON e.approved_by = a.id
                 WHERE 1=1`;
        const params = [];

        if (branchId) {
            params.push(branchId);
            q += ` AND e.branch_id = $${params.length}`;
        }
        if (categoryId) {
            params.push(categoryId);
            q += ` AND e.category_id = $${params.length}`;
        }
        if (status) {
            params.push(status);
            q += ` AND e.status = $${params.length}`;
        }
        if (startDate) {
            params.push(startDate);
            q += ` AND e.expense_date >= $${params.length}`;
        }
        if (endDate) {
            params.push(endDate);
            q += ` AND e.expense_date <= $${params.length}`;
        }

        q += ` ORDER BY e.expense_date DESC`;

        const result = await pool.query(q, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching expenses:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const { category_id, amount, description, expense_date, status, receipt_url, approved_by } = req.body;

        const result = await pool.query(
            `UPDATE expenses SET
                category_id = $1, amount = $2, description = $3, expense_date = $4,
                status = $5, receipt_url = $6, approved_by = $7, updated_at = NOW()
             WHERE id = $8 RETURNING *`,
            [category_id, amount, description, expense_date, status, receipt_url, approved_by, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating expense:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM expenses WHERE id = $1', [id]);
        res.json({ message: 'Expense deleted successfully' });
    } catch (err) {
        console.error('Error deleting expense:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { createExpense, getAllExpenses, updateExpense, deleteExpense };
