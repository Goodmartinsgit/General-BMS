const { query } = require('../config/db');

const getAllBranches = async (req, res) => {
    try {
        const result = await query(
            `SELECT b.*, o.organization_name, u.full_name as manager_name 
             FROM branches b 
             LEFT JOIN organizations o ON b.organization_id = o.id 
             LEFT JOIN users u ON b.manager_user_id = u.id 
             WHERE b.deleted_at IS NULL 
             ORDER BY b.created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getBranchById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            `SELECT b.*, o.organization_name, u.full_name as manager_name 
             FROM branches b 
             LEFT JOIN organizations o ON b.organization_id = o.id 
             LEFT JOIN users u ON b.manager_user_id = u.id 
             WHERE b.id = $1 AND b.deleted_at IS NULL`,
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Branch not found' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const createBranch = async (req, res) => {
    try {
        const { organization_id, branch_code, branch_name, address, city, state, country, phone_number, email, manager_user_id, is_warehouse } = req.body;

        const result = await query(
            `INSERT INTO branches (organization_id, branch_code, branch_name, address, city, state, country, phone_number, email, manager_user_id, is_warehouse) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
             RETURNING *`,
            [organization_id, branch_code, branch_name, address, city, state, country, phone_number, email, manager_user_id, is_warehouse]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') { // Unique violation
            return res.status(400).json({ message: 'Branch code already exists' });
        }
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateBranch = async (req, res) => {
    try {
        const { id } = req.params;
        const { branch_name, address, city, state, country, phone_number, email, manager_user_id, is_warehouse, is_active } = req.body;

        const result = await query(
            `UPDATE branches 
             SET branch_name = $1, address = $2, city = $3, state = $4, country = $5, 
                 phone_number = $6, email = $7, manager_user_id = $8, is_warehouse = $9, 
                 is_active = $10, updated_at = NOW() 
             WHERE id = $11 AND deleted_at IS NULL 
             RETURNING *`,
            [branch_name, address, city, state, country, phone_number, email, manager_user_id, is_warehouse, is_active, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Branch not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteBranch = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            'UPDATE branches SET deleted_at = NOW(), is_active = false WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Branch not found' });
        }

        res.json({ message: 'Branch deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getOrganizations = async (req, res) => {
    try {
        const result = await query('SELECT id, organization_name FROM organizations WHERE is_active = true');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getAllBranches, getBranchById, createBranch, updateBranch, deleteBranch, getOrganizations };
