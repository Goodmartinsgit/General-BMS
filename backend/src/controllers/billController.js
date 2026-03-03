const { pool } = require('../config/db');

const getBills = async (req, res) => {
    try {
        const { status, vendor_id, start_date, end_date, overdue } = req.query;
        let q = `SELECT b.*, v.name as vendor_name, u.full_name as created_by_name
                 FROM bills b
                 LEFT JOIN vendors v ON b.vendor_id = v.id
                 LEFT JOIN users u ON b.created_by = u.id WHERE 1=1`;
        const params = [];
        let idx = 1;

        if (status) { params.push(status); q += ` AND b.status = $${idx++}`; }
        if (vendor_id) { params.push(vendor_id); q += ` AND b.vendor_id = $${idx++}`; }
        if (start_date) { params.push(start_date); q += ` AND b.bill_date >= $${idx++}`; }
        if (end_date) { params.push(end_date); q += ` AND b.bill_date <= $${idx++}`; }
        if (overdue === 'true') { q += ` AND b.due_date < CURRENT_DATE AND b.status NOT IN ('paid', 'cancelled')`; }

        q += ` ORDER BY b.bill_date DESC`;
        const result = await pool.query(q, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching bills:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getBillById = async (req, res) => {
    try {
        const bill = await pool.query(
            `SELECT b.*, v.name as vendor_name FROM bills b
             LEFT JOIN vendors v ON b.vendor_id = v.id WHERE b.id = $1`, [req.params.id]
        );
        if (bill.rows.length === 0) return res.status(404).json({ message: 'Bill not found' });

        const items = await pool.query(
            `SELECT bi.*, ga.name as account_name FROM bill_items bi
             LEFT JOIN gl_accounts ga ON bi.gl_account_id = ga.id WHERE bi.bill_id = $1`, [req.params.id]
        );
        const payments = await pool.query('SELECT * FROM bill_payments WHERE bill_id = $1 ORDER BY payment_date DESC', [req.params.id]);

        res.json({ ...bill.rows[0], items: items.rows, payments: payments.rows });
    } catch (err) {
        console.error('Error fetching bill:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const createBill = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { vendor_id, bill_date, due_date, items, reference, notes, gl_account_id, branch_id } = req.body;

        // Generate bill number
        const now = new Date();
        const prefix = `BILL-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
        const countRes = await client.query(`SELECT COUNT(*) FROM bills WHERE bill_number LIKE $1`, [`${prefix}%`]);
        const num = parseInt(countRes.rows[0].count) + 1;
        const bill_number = `${prefix}-${String(num).padStart(3, '0')}`;

        let subtotal = 0, tax_amount = 0;
        if (items) {
            for (const item of items) {
                subtotal += parseFloat(item.amount) || 0;
                tax_amount += parseFloat(item.tax_amount) || 0;
            }
        }
        const total_amount = subtotal + tax_amount;

        const billRes = await client.query(
            `INSERT INTO bills (bill_number, vendor_id, bill_date, due_date, subtotal, tax_amount,
             total_amount, balance_due, status, reference, notes, gl_account_id, branch_id, created_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
            [bill_number, vendor_id, bill_date, due_date, subtotal, tax_amount, total_amount,
             'pending', reference, notes, gl_account_id, branch_id, req.user.id]
        );

        if (items && items.length > 0) {
            for (const item of items) {
                await client.query(
                    `INSERT INTO bill_items (bill_id, gl_account_id, description, quantity, unit_price, amount, tax_rate, tax_amount)
                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
                    [billRes.rows[0].id, item.gl_account_id, item.description, item.quantity || 1,
                     item.unit_price || 0, item.amount || 0, item.tax_rate || 0, item.tax_amount || 0]
                );
            }
        }

        await client.query('COMMIT');
        res.status(201).json(billRes.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating bill:', err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};

const updateBill = async (req, res) => {
    try {
        const existing = await pool.query('SELECT status FROM bills WHERE id = $1', [req.params.id]);
        if (existing.rows.length === 0) return res.status(404).json({ message: 'Bill not found' });
        if (!['draft', 'pending'].includes(existing.rows[0].status)) {
            return res.status(400).json({ message: 'Can only edit draft or pending bills' });
        }

        const { vendor_id, bill_date, due_date, reference, notes } = req.body;
        const result = await pool.query(
            `UPDATE bills SET vendor_id=COALESCE($1,vendor_id), bill_date=COALESCE($2,bill_date),
             due_date=$3, reference=$4, notes=$5, updated_at=NOW() WHERE id=$6 RETURNING *`,
            [vendor_id, bill_date, due_date, reference, notes, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating bill:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteBill = async (req, res) => {
    try {
        const existing = await pool.query('SELECT status FROM bills WHERE id = $1', [req.params.id]);
        if (existing.rows.length === 0) return res.status(404).json({ message: 'Bill not found' });
        if (existing.rows[0].status !== 'draft') return res.status(400).json({ message: 'Can only delete draft bills' });

        await pool.query('DELETE FROM bills WHERE id = $1', [req.params.id]);
        res.json({ message: 'Bill deleted' });
    } catch (err) {
        console.error('Error deleting bill:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const recordPayment = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { amount, payment_date, payment_method, reference, notes, gl_account_id } = req.body;
        const billId = req.params.id;

        const bill = await client.query('SELECT * FROM bills WHERE id = $1', [billId]);
        if (bill.rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'Bill not found' }); }

        const paymentAmount = parseFloat(amount);
        if (paymentAmount <= 0 || paymentAmount > parseFloat(bill.rows[0].balance_due)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Invalid payment amount' });
        }

        await client.query(
            `INSERT INTO bill_payments (bill_id, amount, payment_date, payment_method, reference, notes, gl_account_id, created_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [billId, paymentAmount, payment_date || new Date(), payment_method, reference, notes, gl_account_id, req.user.id]
        );

        const newPaid = parseFloat(bill.rows[0].amount_paid) + paymentAmount;
        const newBalance = parseFloat(bill.rows[0].total_amount) - newPaid;
        const newStatus = newBalance <= 0 ? 'paid' : 'partially_paid';

        await client.query(
            `UPDATE bills SET amount_paid=$1, balance_due=$2, status=$3, updated_at=NOW() WHERE id=$4`,
            [newPaid, newBalance, newStatus, billId]
        );

        await client.query('COMMIT');
        res.json({ message: 'Payment recorded', amount_paid: newPaid, balance_due: newBalance, status: newStatus });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error recording payment:', err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};

const getAPAging = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT v.name as vendor_name, v.id as vendor_id,
                SUM(CASE WHEN b.due_date >= CURRENT_DATE THEN b.balance_due ELSE 0 END) as current_amount,
                SUM(CASE WHEN b.due_date < CURRENT_DATE AND b.due_date >= CURRENT_DATE - 30 THEN b.balance_due ELSE 0 END) as days_30,
                SUM(CASE WHEN b.due_date < CURRENT_DATE - 30 AND b.due_date >= CURRENT_DATE - 60 THEN b.balance_due ELSE 0 END) as days_60,
                SUM(CASE WHEN b.due_date < CURRENT_DATE - 60 AND b.due_date >= CURRENT_DATE - 90 THEN b.balance_due ELSE 0 END) as days_90,
                SUM(CASE WHEN b.due_date < CURRENT_DATE - 90 THEN b.balance_due ELSE 0 END) as over_90,
                SUM(b.balance_due) as total
            FROM bills b
            JOIN vendors v ON b.vendor_id = v.id
            WHERE b.status NOT IN ('paid', 'cancelled') AND b.balance_due > 0
            GROUP BY v.id, v.name ORDER BY total DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching AP aging:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getBills, getBillById, createBill, updateBill, deleteBill, recordPayment, getAPAging };
