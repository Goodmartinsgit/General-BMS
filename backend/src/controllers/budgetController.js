const { pool } = require('../config/db');

const createBudget = async (req, res) => {
    try {
        const { branch_id, name, total_amount, month, year, line_items } = req.body;
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            const budgetRes = await client.query(
                `INSERT INTO budgets (branch_id, name, total_amount, month, year) 
                 VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                [branch_id, name, total_amount, month, year]
            );
            const budgetId = budgetRes.rows[0].id;

            if (line_items && line_items.length > 0) {
                for (const item of line_items) {
                    await client.query(
                        `INSERT INTO budget_line_items (budget_id, expense_category_id, allocated_amount) 
                         VALUES ($1, $2, $3)`,
                        [budgetId, item.expense_category_id, item.allocated_amount]
                    );
                }
            }

            await client.query('COMMIT');
            res.status(201).json({ message: 'Budget created successfully', budgetId });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getBudgets = async (req, res) => {
    try {
        const { branch_id, year } = req.query;
        let q = `SELECT b.*, br.branch_name 
                 FROM budgets b 
                 JOIN branches br ON b.branch_id = br.id 
                 WHERE 1=1`;
        const params = [];

        if (branch_id) {
            params.push(branch_id);
            q += ` AND b.branch_id = $${params.length}`;
        }
        if (year) {
            params.push(year);
            q += ` AND b.year = $${params.length}`;
        }

        q += ` ORDER BY b.year DESC, b.month DESC`;
        const result = await pool.query(q, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getBudgetDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const budgetRes = await pool.query(
            `SELECT b.*, br.branch_name FROM budgets b JOIN branches br ON b.branch_id = br.id WHERE b.id = $1`,
            [id]
        );
        if (budgetRes.rows.length === 0) return res.status(404).json({ message: 'Budget not found' });

        const itemsRes = await pool.query(
            `SELECT bli.*, ec.category_name 
             FROM budget_line_items bli 
             JOIN expense_categories ec ON bli.expense_category_id = ec.id 
             WHERE bli.budget_id = $1`,
            [id]
        );

        res.json({
            ...budgetRes.rows[0],
            line_items: itemsRes.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { createBudget, getBudgets, getBudgetDetails };
