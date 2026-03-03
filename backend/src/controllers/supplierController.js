const { pool } = require('../config/db');

const createSupplier = async (req, res) => {
    try {
        const { supplier_name, contact_person, email, phone_number, whatsapp_number, address, payment_terms, notes } = req.body;

        const result = await pool.query(
            `INSERT INTO suppliers (supplier_name, contact_person, email, phone_number, whatsapp_number, address, payment_terms, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [supplier_name, contact_person, email, phone_number, whatsapp_number, address, payment_terms, notes]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating supplier:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAllSuppliers = async (req, res) => {
    try {
        const { search } = req.query;
        let q = `SELECT * FROM suppliers WHERE is_active = TRUE`;
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            q += ` AND (supplier_name ILIKE $1 OR contact_person ILIKE $1 OR email ILIKE $1)`;
        }

        q += ` ORDER BY supplier_name ASC`;

        const result = await pool.query(q, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching suppliers:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const { supplier_name, contact_person, email, phone_number, whatsapp_number, address, payment_terms, notes } = req.body;

        const result = await pool.query(
            `UPDATE suppliers SET
                supplier_name = $1, contact_person = $2, email = $3,
                phone_number = $4, whatsapp_number = $5, address = $6, payment_terms = $7, notes = $8, updated_at = NOW()
             WHERE id = $9 AND is_active = TRUE RETURNING *`,
            [supplier_name, contact_person, email, phone_number, whatsapp_number, address, payment_terms, notes, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Supplier not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating supplier:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE suppliers SET is_active = FALSE, updated_at = NOW() WHERE id = $1', [id]);
        res.json({ message: 'Supplier deactivated successfully' });
    } catch (err) {
        console.error('Error deleting supplier:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { createSupplier, getAllSuppliers, updateSupplier, deleteSupplier };
