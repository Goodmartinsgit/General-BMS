const { pool } = require('../config/db');

const getCostCenters = async (req, res) => {
    try {
        const { type, search } = req.query;
        let q = `SELECT cc.*, u.full_name as manager_name, p.name as parent_name
                 FROM cost_centers cc
                 LEFT JOIN users u ON cc.manager_id = u.id
                 LEFT JOIN cost_centers p ON cc.parent_id = p.id
                 WHERE cc.is_active = TRUE`;
        const params = [];
        let idx = 1;

        if (type) { params.push(type); q += ` AND cc.type = $${idx++}`; }
        if (search) { params.push(`%${search}%`); q += ` AND (cc.name ILIKE $${idx} OR cc.code ILIKE $${idx})`; idx++; }

        q += ` ORDER BY cc.code ASC`;
        const result = await pool.query(q, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching cost centers:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getCostCenterById = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT cc.*, u.full_name as manager_name FROM cost_centers cc
             LEFT JOIN users u ON cc.manager_id = u.id WHERE cc.id = $1`, [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Cost center not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching cost center:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const createCostCenter = async (req, res) => {
    try {
        const { code, name, type, manager_id, parent_id, description, branch_id } = req.body;
        const result = await pool.query(
            `INSERT INTO cost_centers (code, name, type, manager_id, parent_id, description, branch_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [code, name, type || 'cost', manager_id, parent_id, description, branch_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating cost center:', err);
        if (err.code === '23505') return res.status(400).json({ message: 'Cost center code already exists' });
        res.status(500).json({ message: 'Server error' });
    }
};

const updateCostCenter = async (req, res) => {
    try {
        const { code, name, type, manager_id, parent_id, description } = req.body;
        const result = await pool.query(
            `UPDATE cost_centers SET code = COALESCE($1, code), name = COALESCE($2, name),
             type = COALESCE($3, type), manager_id = $4, parent_id = $5,
             description = $6, updated_at = NOW() WHERE id = $7 AND is_active = TRUE RETURNING *`,
            [code, name, type, manager_id, parent_id, description, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Cost center not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating cost center:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteCostCenter = async (req, res) => {
    try {
        await pool.query('UPDATE cost_centers SET is_active = FALSE, updated_at = NOW() WHERE id = $1', [req.params.id]);
        res.json({ message: 'Cost center deactivated' });
    } catch (err) {
        console.error('Error deleting cost center:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getCostCenters, getCostCenterById, createCostCenter, updateCostCenter, deleteCostCenter };
