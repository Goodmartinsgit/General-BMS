const { pool } = require('../config/db');
const { recordCashFlow } = require('./bankController');

const createExpense = async (req, res) => {
    const client = await pool.connect();
    try {
        const { branch_id, category, amount, description, expense_date, channel_id } = req.body;
        const recorded_by = req.user.id;

        await client.query('BEGIN');

        const result = await client.query(
            `INSERT INTO expenses (branch_id, category, amount, description, expense_date, recorded_by, channel_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [branch_id, category, amount, description, expense_date || 'NOW()', recorded_by, channel_id]
        );

        const expense = result.rows[0];

        // Record Cash Flow if channel_id provided
        if (channel_id) {
            await recordCashFlow(client, {
                channel_id,
                type: 'outflow',
                amount: amount,
                source: 'expense',
                reference_id: expense.id,
                reference_number: `EXP-${expense.id}`,
                description: `Expense: ${category} - ${description}`,
                performed_by: recorded_by
            });
        }

        await client.query('COMMIT');
        res.status(201).json(expense);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};


const getAllExpenses = async (req, res) => {
    try {
        const { branchId, category, startDate, endDate } = req.query;
        let q = `SELECT e.*, b.branch_name, u.full_name as recorder 
                 FROM expenses e 
                 JOIN branches b ON e.branch_id = b.id 
                 JOIN users u ON e.recorded_by = u.id 
                 WHERE e.deleted_at IS NULL`;
        const params = [];

        if (branchId) {
            params.push(branchId);
            q += ` AND e.branch_id = $${params.length}`;
        }
        if (category) {
            params.push(category);
            q += ` AND e.category = $${params.length}`;
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
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE expenses SET deleted_at = NOW() WHERE id = $1', [id]);
        res.json({ message: 'Expense deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { createExpense, getAllExpenses, deleteExpense };
