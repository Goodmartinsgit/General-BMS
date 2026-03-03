const { pool } = require('../config/db');

const getVendors = async (req, res) => {
    try {
        const { search, type, is_active } = req.query;
        const conditions = [];
        const params = [];

        if (is_active !== undefined) {
            params.push(is_active === 'true');
            conditions.push(`v.is_active = $${params.length}`);
        } else {
            conditions.push(`v.is_active = TRUE`);
        }

        if (search) {
            params.push(`%${search}%`);
            conditions.push(`(v.name ILIKE $${params.length} OR v.code ILIKE $${params.length} OR v.email ILIKE $${params.length})`);
        }

        if (type) {
            params.push(type);
            conditions.push(`v.type = $${params.length}`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const result = await pool.query(
            `SELECT v.*,
                COALESCE((SELECT SUM(b.balance_due) FROM bills b WHERE b.vendor_id = v.id AND b.status NOT IN ('paid', 'cancelled', 'draft')), 0) as outstanding_balance
             FROM vendors v
             ${whereClause}
             ORDER BY v.name ASC`,
            params
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching vendors:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getVendorById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT v.*,
                COALESCE((SELECT SUM(b.balance_due) FROM bills b WHERE b.vendor_id = v.id AND b.status NOT IN ('paid', 'cancelled', 'draft')), 0) as outstanding_balance,
                COALESCE((SELECT COUNT(*) FROM bills b WHERE b.vendor_id = v.id), 0) as total_bills
             FROM vendors v
             WHERE v.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching vendor:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const createVendor = async (req, res) => {
    try {
        const {
            name, code: providedCode, type, contact_person, email, phone,
            address, city, tax_id, payment_terms, notes
        } = req.body;

        // Auto-generate vendor code if not provided
        let code = providedCode;
        if (!code) {
            const countResult = await pool.query(`SELECT COUNT(*) as count FROM vendors`);
            const nextNum = parseInt(countResult.rows[0].count) + 1;
            code = `VEN-${String(nextNum).padStart(3, '0')}`;

            // Ensure uniqueness
            const existing = await pool.query(`SELECT id FROM vendors WHERE code = $1`, [code]);
            if (existing.rows.length > 0) {
                const maxResult = await pool.query(
                    `SELECT code FROM vendors WHERE code LIKE 'VEN-%' ORDER BY code DESC LIMIT 1`
                );
                if (maxResult.rows.length > 0) {
                    const lastNum = parseInt(maxResult.rows[0].code.split('-')[1]);
                    code = `VEN-${String(lastNum + 1).padStart(3, '0')}`;
                }
            }
        }

        const result = await pool.query(
            `INSERT INTO vendors (name, code, type, contact_person, email, phone, address, city, tax_id, payment_terms, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
            [name, code, type || 'supplier', contact_person, email, phone, address, city, tax_id, payment_terms || 30, notes]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating vendor:', err);
        if (err.code === '23505') {
            return res.status(400).json({ message: 'Vendor code or email already exists' });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

const updateVendor = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, type, contact_person, email, phone,
            address, city, tax_id, payment_terms, notes
        } = req.body;

        const result = await pool.query(
            `UPDATE vendors SET
                name = COALESCE($1, name),
                type = COALESCE($2, type),
                contact_person = COALESCE($3, contact_person),
                email = COALESCE($4, email),
                phone = COALESCE($5, phone),
                address = COALESCE($6, address),
                city = COALESCE($7, city),
                tax_id = COALESCE($8, tax_id),
                payment_terms = COALESCE($9, payment_terms),
                notes = COALESCE($10, notes),
                updated_at = NOW()
             WHERE id = $11 AND is_active = TRUE RETURNING *`,
            [name, type, contact_person, email, phone, address, city, tax_id, payment_terms, notes, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating vendor:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteVendor = async (req, res) => {
    try {
        const { id } = req.params;

        const billCheck = await pool.query(
            `SELECT COUNT(*) as count FROM bills WHERE vendor_id = $1 AND status IN ('pending', 'partially_paid')`,
            [id]
        );

        if (parseInt(billCheck.rows[0].count) > 0) {
            return res.status(400).json({ message: 'Cannot deactivate vendor with outstanding bills' });
        }

        await pool.query(
            'UPDATE vendors SET is_active = FALSE, updated_at = NOW() WHERE id = $1',
            [id]
        );

        res.json({ message: 'Vendor deactivated successfully' });
    } catch (err) {
        console.error('Error deleting vendor:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getVendorBills = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.query;

        let q = `SELECT b.*,
                    (SELECT COUNT(*) FROM bill_items bi WHERE bi.bill_id = b.id) as item_count
                 FROM bills b
                 WHERE b.vendor_id = $1`;
        const params = [id];

        if (status) {
            params.push(status);
            q += ` AND b.status = $${params.length}`;
        }

        q += ` ORDER BY b.bill_date DESC`;

        const result = await pool.query(q, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching vendor bills:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getVendors,
    getVendorById,
    createVendor,
    updateVendor,
    deleteVendor,
    getVendorBills
};
