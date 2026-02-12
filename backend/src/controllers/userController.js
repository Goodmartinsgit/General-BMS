const { query } = require('../config/db');
const bcrypt = require('bcrypt');

const getAllUsers = async (req, res) => {
    try {
        const result = await query(
            `SELECT u.id, u.email, u.full_name, u.phone_number, u.is_active, r.role_name 
             FROM users u 
             LEFT JOIN roles r ON u.role_id = r.id 
             ORDER BY u.created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const createUser = async (req, res) => {
    try {
        const { email, password, full_name, phone_number, role_id } = req.body;

        // Check if user exists
        const userCheck = await query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await query(
            `INSERT INTO users (email, password_hash, full_name, phone_number, role_id) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING id, email, full_name, is_active`,
            [email, hashedPassword, full_name, phone_number, role_id]
        );

        res.status(201).json(newUser.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, phone_number, role_id, is_active } = req.body;

        const result = await query(
            `UPDATE users 
             SET full_name = $1, phone_number = $2, role_id = $3, is_active = $4, updated_at = NOW() 
             WHERE id = $5 
             RETURNING id, full_name, email`,
            [full_name, phone_number, role_id, is_active, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Soft delete
        const result = await query(
            'UPDATE users SET deleted_at = NOW(), is_active = false WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getRoles = async (req, res) => {
    try {
        const result = await query('SELECT id, role_name FROM roles ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getAllUsers, createUser, updateUser, deleteUser, getRoles };
