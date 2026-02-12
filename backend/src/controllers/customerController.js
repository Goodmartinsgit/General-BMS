const { query } = require('../config/db');

const getAllCustomers = async (req, res) => {
    try {
        const { type } = req.query;
        let q = `SELECT c.*, pt.tier_name 
                 FROM customers c 
                 LEFT JOIN price_tiers pt ON c.price_tier_id = pt.id 
                 WHERE c.deleted_at IS NULL`;
        const params = [];

        if (type) {
            params.push(type);
            q += ` AND c.customer_type = $${params.length}`;
        }

        q += ` ORDER BY c.created_at DESC`;

        const result = await query(q, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getCustomerById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            `SELECT c.*, pt.tier_name 
             FROM customers c 
             LEFT JOIN price_tiers pt ON c.price_tier_id = pt.id 
             WHERE c.id = $1 AND c.deleted_at IS NULL`,
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const createCustomer = async (req, res) => {
    try {
        const { 
            customer_number, customer_type, customer_name, contact_person, 
            email, phone_number, alternative_phone, address, city, state, 
            country, tax_id, price_tier_id, credit_limit, payment_terms_days 
        } = req.body;

        const result = await query(
            `INSERT INTO customers (
                customer_number, customer_type, customer_name, contact_person, 
                email, phone_number, alternative_phone, address, city, state, 
                country, tax_id, price_tier_id, credit_limit, payment_terms_days
            ) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
             RETURNING *`,
            [
                customer_number, customer_type, customer_name, contact_person, 
                email, phone_number, alternative_phone, address, city, state, 
                country, tax_id, price_tier_id, credit_limit, payment_terms_days
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ message: 'Customer number already exists' });
        }
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            customer_type, customer_name, contact_person, email, phone_number, 
            alternative_phone, address, city, state, country, tax_id, 
            price_tier_id, credit_limit, payment_terms_days, is_active, suspended, suspension_reason
        } = req.body;

        const result = await query(
            `UPDATE customers 
             SET customer_type = $1, customer_name = $2, contact_person = $3, email = $4, 
                 phone_number = $5, alternative_phone = $6, address = $7, city = $8, 
                 state = $9, country = $10, tax_id = $11, price_tier_id = $12, 
                 credit_limit = $13, payment_terms_days = $14, is_active = $15, 
                 suspended = $16, suspension_reason = $17, updated_at = NOW() 
             WHERE id = $18 AND deleted_at IS NULL 
             RETURNING *`,
            [
                customer_type, customer_name, contact_person, email, phone_number, 
                alternative_phone, address, city, state, country, tax_id, 
                price_tier_id, credit_limit, payment_terms_days, is_active, 
                suspended, suspension_reason, id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            'UPDATE customers SET deleted_at = NOW(), is_active = false WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.json({ message: 'Customer deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getAllCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer };
