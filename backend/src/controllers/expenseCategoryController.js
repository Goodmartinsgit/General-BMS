const { pool } = require('../config/db');

const getAllExpenseCategories = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM expense_categories WHERE is_active = TRUE ORDER BY category_name ASC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching expense categories:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const createExpenseCategory = async (req, res) => {
    try {
        const { category_name, description } = req.body;
        const result = await pool.query(
            'INSERT INTO expense_categories (category_name, description) VALUES ($1, $2) RETURNING *',
            [category_name, description]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating expense category:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getAllExpenseCategories, createExpenseCategory };
