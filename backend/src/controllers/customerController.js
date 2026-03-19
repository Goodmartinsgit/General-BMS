const bcrypt = require('bcryptjs');
const { query, pool } = require('../config/db');

const getAllCustomers = async (req, res) => {
    try {
        const { type, source } = req.query;
        let q = `SELECT c.*, pt.tier_name,
                        ca.is_email_verified, ca.is_verified, ca.last_login_at, ca.whatsapp_number
                 FROM customers c
                 LEFT JOIN price_tiers pt ON c.price_tier_id = pt.id
                 LEFT JOIN customer_auth ca ON ca.customer_id = c.id
                 WHERE c.deleted_at IS NULL`;
        const params = [];

        if (type) {
            params.push(type);
            q += ` AND c.customer_type = $${params.length}`;
        }
        if (source && source !== 'all') {
            params.push(source);
            q += ` AND c.source = $${params.length}`;
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
            `SELECT c.*, pt.tier_name, ca.whatsapp_number, ca.is_email_verified, ca.is_verified
             FROM customers c
             LEFT JOIN price_tiers pt ON c.price_tier_id = pt.id
             LEFT JOIN customer_auth ca ON ca.customer_id = c.id
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
    const client = await pool.connect();
    try {
        const {
            customer_number, customer_type, customer_name, contact_person,
            email, phone_number, alternative_phone, address, city, state,
            country, tax_id, price_tier_id, credit_limit, payment_terms_days,
            source, whatsapp_number,
            // Store account fields
            create_store_account, password
        } = req.body;

        const customerSource = source || 'shop';

        await client.query('BEGIN');

        // Insert customer
        const result = await client.query(
            `INSERT INTO customers (
                customer_number, customer_type, customer_name, contact_person,
                email, phone_number, alternative_phone, address, city, state,
                country, tax_id, price_tier_id, credit_limit, payment_terms_days,
                source, is_active_online
            )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
             RETURNING *`,
            [
                customer_number, customer_type, customer_name, contact_person,
                email, phone_number, alternative_phone, address, city, state,
                country, tax_id, price_tier_id || null, credit_limit, payment_terms_days,
                customerSource, customerSource === 'online'
            ]
        );
        const customer = result.rows[0];

        // If online source and store account requested, create customer_auth
        if (customerSource === 'online' && create_store_account && email && password) {
            // Check email uniqueness in customer_auth
            const emailCheck = await client.query(
                `SELECT id FROM customer_auth WHERE email = LOWER($1)`,
                [email]
            );
            if (emailCheck.rows.length > 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ message: 'A store account with this email already exists' });
            }

            // Check WhatsApp uniqueness if provided
            if (whatsapp_number) {
                const waCheck = await client.query(
                    `SELECT id FROM customer_auth WHERE whatsapp_number = $1`,
                    [whatsapp_number]
                );
                if (waCheck.rows.length > 0) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ message: 'A store account with this WhatsApp number already exists' });
                }
            }

            const passwordHash = await bcrypt.hash(password, 10);

            // Admin-created accounts are pre-verified — no OTP needed
            await client.query(
                `INSERT INTO customer_auth
                   (customer_id, email, password_hash, is_email_verified, is_verified, whatsapp_number)
                 VALUES ($1, $2, $3, true, true, $4)`,
                [customer.id, email.toLowerCase(), passwordHash, whatsapp_number || null]
            );
        }

        await client.query('COMMIT');

        res.status(201).json(customer);
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        if (err.code === '23505') {
            return res.status(400).json({ message: 'Customer number already exists' });
        }
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};

const updateCustomer = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const {
            customer_type, customer_name, contact_person, email, phone_number,
            alternative_phone, address, city, state, country, tax_id,
            price_tier_id, credit_limit, payment_terms_days, is_active,
            suspended, suspension_reason, whatsapp_number
        } = req.body;

        await client.query('BEGIN');

        const result = await client.query(
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
                price_tier_id || null, credit_limit, payment_terms_days, is_active,
                suspended, suspension_reason, id
            ]
        );

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Update whatsapp_number in customer_auth if it exists
        if (whatsapp_number !== undefined) {
            const authExists = await client.query(
                `SELECT id FROM customer_auth WHERE customer_id = $1`,
                [id]
            );
            if (authExists.rows.length > 0) {
                // Check uniqueness if setting a new number
                if (whatsapp_number) {
                    const waCheck = await client.query(
                        `SELECT id FROM customer_auth WHERE whatsapp_number = $1 AND customer_id != $2`,
                        [whatsapp_number, id]
                    );
                    if (waCheck.rows.length > 0) {
                        await client.query('ROLLBACK');
                        return res.status(400).json({ message: 'This WhatsApp number is used by another account' });
                    }
                }
                await client.query(
                    `UPDATE customer_auth SET whatsapp_number = $1 WHERE customer_id = $2`,
                    [whatsapp_number || null, id]
                );
            }
        }

        // Also update email in customer_auth if it exists and email changed
        if (email) {
            await client.query(
                `UPDATE customer_auth SET email = LOWER($1) WHERE customer_id = $2`,
                [email, id]
            );
        }

        await client.query('COMMIT');

        res.json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
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
