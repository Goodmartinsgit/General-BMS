const { query } = require('../config/db');

const getAllReferrers = async (req, res) => {
    try {
        const q = `SELECT * FROM referrers WHERE is_deleted = false ORDER BY created_at DESC`;
        const result = await query(q);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getReferrerById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            `SELECT * FROM referrers WHERE id = $1 AND is_deleted = false`,
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Referrer not found' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const createReferrer = async (req, res) => {
    try {
        const { 
            referrer_code, full_name, phone, email, 
            address, city, state, commission_rate, 
            commission_type, fixed_commission_amount,
            bank_name, account_number, account_name, notes
        } = req.body;

        const result = await query(
            `INSERT INTO referrers (
                referrer_code, full_name, phone, email, 
                address, city, state, commission_rate, 
                commission_type, fixed_commission_amount,
                bank_name, account_number, account_name, notes
            ) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
             RETURNING *`,
            [
                referrer_code, full_name, phone, email, 
                address, city, state, commission_rate, 
                commission_type, fixed_commission_amount,
                bank_name, account_number, account_name, notes
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ message: 'Referrer code or phone number already exists' });
        }
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateReferrer = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            full_name, phone, email, address, city, state, 
            commission_rate, commission_type, fixed_commission_amount,
            bank_name, account_number, account_name, is_active, notes
        } = req.body;

        const result = await query(
            `UPDATE referrers 
             SET full_name = $1, phone = $2, email = $3, address = $4, 
                 city = $5, state = $6, commission_rate = $7, 
                 commission_type = $8, fixed_commission_amount = $9,
                 bank_name = $10, account_number = $11, account_name = $12,
                 is_active = $13, notes = $14, updated_at = NOW() 
             WHERE id = $15 AND is_deleted = false 
             RETURNING *`,
            [
                full_name, phone, email, address, city, state, 
                commission_rate, commission_type, fixed_commission_amount,
                bank_name, account_number, account_name, is_active, notes, id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Referrer not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteReferrer = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            'UPDATE referrers SET is_deleted = true, is_active = false WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Referrer not found' });
        }

        res.json({ message: 'Referrer deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getReferrerCommissions = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            `SELECT * FROM commission_payments WHERE referrer_id = $1 ORDER BY payment_date DESC`,
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const payCommission = async (req, res) => {
    try {
        const { referrer_id, amount, payment_method, reference_number, notes } = req.body;
        
        // Use a transaction
        await query('BEGIN');
        
        const payment_code = `CPAY-${Date.now()}`;
        
        const paymentResult = await query(
            `INSERT INTO commission_payments (
                payment_code, referrer_id, amount, payment_method, 
                reference_number, status, notes
            ) VALUES ($1, $2, $3, $4, $5, 'completed', $6) RETURNING *`,
            [payment_code, referrer_id, amount, payment_method, reference_number, notes]
        );
        
        // Update referrer balance
        await query(
            `UPDATE referrers 
             SET total_commission_paid = total_commission_paid + $1,
                 commission_balance = commission_balance - $1
             WHERE id = $2`,
            [amount, referrer_id]
        );
        
        await query('COMMIT');
        
        res.status(201).json(paymentResult.rows[0]);
    } catch (err) {
        await query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { 
    getAllReferrers, getReferrerById, createReferrer, 
    updateReferrer, deleteReferrer, getReferrerCommissions,
    payCommission 
};
