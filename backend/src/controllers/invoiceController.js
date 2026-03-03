const { pool } = require('../config/db');

const getInvoices = async (req, res) => {
    try {
        const { status, customer_id, start_date, end_date } = req.query;
        let q = `SELECT ci.*, c.customer_name, u.full_name as created_by_name
                 FROM customer_invoices ci
                 LEFT JOIN customers c ON ci.customer_id = c.id
                 LEFT JOIN users u ON ci.created_by = u.id WHERE 1=1`;
        const params = [];
        let idx = 1;

        if (status) { params.push(status); q += ` AND ci.status = $${idx++}`; }
        if (customer_id) { params.push(customer_id); q += ` AND ci.customer_id = $${idx++}`; }
        if (start_date) { params.push(start_date); q += ` AND ci.invoice_date >= $${idx++}`; }
        if (end_date) { params.push(end_date); q += ` AND ci.invoice_date <= $${idx++}`; }

        q += ` ORDER BY ci.invoice_date DESC`;
        const result = await pool.query(q, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching invoices:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getInvoiceById = async (req, res) => {
    try {
        const invoice = await pool.query(
            `SELECT ci.*, c.customer_name, c.email as customer_email, c.phone_number as customer_phone
             FROM customer_invoices ci
             LEFT JOIN customers c ON ci.customer_id = c.id WHERE ci.id = $1`, [req.params.id]
        );
        if (invoice.rows.length === 0) return res.status(404).json({ message: 'Invoice not found' });

        const items = await pool.query(
            `SELECT ii.*, p.product_name FROM invoice_items ii
             LEFT JOIN products p ON ii.product_id = p.id WHERE ii.invoice_id = $1`, [req.params.id]
        );
        const payments = await pool.query('SELECT * FROM invoice_payments WHERE invoice_id = $1 ORDER BY payment_date DESC', [req.params.id]);

        res.json({ ...invoice.rows[0], items: items.rows, payments: payments.rows });
    } catch (err) {
        console.error('Error fetching invoice:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const createInvoice = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { customer_id, invoice_date, due_date, items, notes, gl_account_id, branch_id } = req.body;

        const now = new Date();
        const prefix = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
        const countRes = await client.query(`SELECT COUNT(*) FROM customer_invoices WHERE invoice_number LIKE $1`, [`${prefix}%`]);
        const num = parseInt(countRes.rows[0].count) + 1;
        const invoice_number = `${prefix}-${String(num).padStart(3, '0')}`;

        let subtotal = 0, tax_amount = 0, discount_amount = 0;
        if (items) {
            for (const item of items) {
                subtotal += parseFloat(item.amount) || 0;
                tax_amount += parseFloat(item.tax_amount) || 0;
            }
        }
        const total_amount = subtotal + tax_amount - discount_amount;

        const invRes = await client.query(
            `INSERT INTO customer_invoices (invoice_number, customer_id, invoice_date, due_date,
             subtotal, tax_amount, discount_amount, total_amount, balance_due, notes, gl_account_id, branch_id, created_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8,$9,$10,$11,$12) RETURNING *`,
            [invoice_number, customer_id, invoice_date || now, due_date, subtotal, tax_amount,
             discount_amount, total_amount, notes, gl_account_id, branch_id, req.user.id]
        );

        if (items && items.length > 0) {
            for (const item of items) {
                await client.query(
                    `INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price, amount, tax_rate, tax_amount)
                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
                    [invRes.rows[0].id, item.product_id, item.description, item.quantity || 1,
                     item.unit_price || 0, item.amount || 0, item.tax_rate || 0, item.tax_amount || 0]
                );
            }
        }

        await client.query('COMMIT');
        res.status(201).json(invRes.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating invoice:', err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};

const createFromSale = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { sale_id, due_date } = req.body;

        const sale = await client.query(
            `SELECT s.*, c.customer_name FROM sales s LEFT JOIN customers c ON s.customer_id = c.id WHERE s.id = $1`, [sale_id]
        );
        if (sale.rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'Sale not found' }); }

        const existing = await client.query('SELECT id FROM customer_invoices WHERE sale_id = $1', [sale_id]);
        if (existing.rows.length > 0) { await client.query('ROLLBACK'); return res.status(400).json({ message: 'Invoice already exists for this sale' }); }

        const s = sale.rows[0];
        const now = new Date();
        const prefix = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
        const countRes = await client.query(`SELECT COUNT(*) FROM customer_invoices WHERE invoice_number LIKE $1`, [`${prefix}%`]);
        const invoice_number = `${prefix}-${String(parseInt(countRes.rows[0].count) + 1).padStart(3, '0')}`;

        const invRes = await client.query(
            `INSERT INTO customer_invoices (invoice_number, customer_id, sale_id, invoice_date, due_date,
             subtotal, total_amount, balance_due, status, branch_id, created_by)
             VALUES ($1,$2,$3,CURRENT_DATE,$4,$5,$5,$5,'sent',$6,$7) RETURNING *`,
            [invoice_number, s.customer_id, sale_id, due_date, s.total_amount, s.branch_id, req.user.id]
        );

        await client.query('COMMIT');
        res.status(201).json(invRes.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating invoice from sale:', err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};

const updateInvoice = async (req, res) => {
    try {
        const existing = await pool.query('SELECT status FROM customer_invoices WHERE id = $1', [req.params.id]);
        if (existing.rows.length === 0) return res.status(404).json({ message: 'Invoice not found' });
        if (existing.rows[0].status !== 'draft') return res.status(400).json({ message: 'Can only edit draft invoices' });

        const { customer_id, invoice_date, due_date, notes } = req.body;
        const result = await pool.query(
            `UPDATE customer_invoices SET customer_id=COALESCE($1,customer_id), invoice_date=COALESCE($2,invoice_date),
             due_date=$3, notes=$4, updated_at=NOW() WHERE id=$5 RETURNING *`,
            [customer_id, invoice_date, due_date, notes, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating invoice:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteInvoice = async (req, res) => {
    try {
        const existing = await pool.query('SELECT status FROM customer_invoices WHERE id = $1', [req.params.id]);
        if (existing.rows.length === 0) return res.status(404).json({ message: 'Invoice not found' });
        if (existing.rows[0].status !== 'draft') return res.status(400).json({ message: 'Can only delete draft invoices' });

        await pool.query('DELETE FROM customer_invoices WHERE id = $1', [req.params.id]);
        res.json({ message: 'Invoice deleted' });
    } catch (err) {
        console.error('Error deleting invoice:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const recordPayment = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { amount, payment_date, payment_method, reference, notes, gl_account_id } = req.body;
        const invoiceId = req.params.id;

        const inv = await client.query('SELECT * FROM customer_invoices WHERE id = $1', [invoiceId]);
        if (inv.rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'Invoice not found' }); }

        const paymentAmount = parseFloat(amount);
        if (paymentAmount <= 0 || paymentAmount > parseFloat(inv.rows[0].balance_due)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Invalid payment amount' });
        }

        await client.query(
            `INSERT INTO invoice_payments (invoice_id, amount, payment_date, payment_method, reference, notes, gl_account_id, created_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [invoiceId, paymentAmount, payment_date || new Date(), payment_method, reference, notes, gl_account_id, req.user.id]
        );

        const newPaid = parseFloat(inv.rows[0].amount_paid) + paymentAmount;
        const newBalance = parseFloat(inv.rows[0].total_amount) - newPaid;
        const newStatus = newBalance <= 0 ? 'paid' : 'partially_paid';

        await client.query(
            `UPDATE customer_invoices SET amount_paid=$1, balance_due=$2, status=$3, updated_at=NOW() WHERE id=$4`,
            [newPaid, newBalance, newStatus, invoiceId]
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

const writeOff = async (req, res) => {
    try {
        const result = await pool.query(
            `UPDATE customer_invoices SET status = 'written_off', updated_at = NOW()
             WHERE id = $1 AND status NOT IN ('paid', 'cancelled') RETURNING *`, [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Invoice not found or cannot be written off' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error writing off invoice:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getARAging = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.customer_name, c.id as customer_id,
                SUM(CASE WHEN ci.due_date >= CURRENT_DATE THEN ci.balance_due ELSE 0 END) as current_amount,
                SUM(CASE WHEN ci.due_date < CURRENT_DATE AND ci.due_date >= CURRENT_DATE - 30 THEN ci.balance_due ELSE 0 END) as days_30,
                SUM(CASE WHEN ci.due_date < CURRENT_DATE - 30 AND ci.due_date >= CURRENT_DATE - 60 THEN ci.balance_due ELSE 0 END) as days_60,
                SUM(CASE WHEN ci.due_date < CURRENT_DATE - 60 AND ci.due_date >= CURRENT_DATE - 90 THEN ci.balance_due ELSE 0 END) as days_90,
                SUM(CASE WHEN ci.due_date < CURRENT_DATE - 90 THEN ci.balance_due ELSE 0 END) as over_90,
                SUM(ci.balance_due) as total
            FROM customer_invoices ci
            JOIN customers c ON ci.customer_id = c.id
            WHERE ci.status NOT IN ('paid', 'cancelled', 'written_off') AND ci.balance_due > 0
            GROUP BY c.id, c.customer_name ORDER BY total DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching AR aging:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getCustomerStatement = async (req, res) => {
    try {
        const { customerId } = req.params;
        const { start_date, end_date } = req.query;

        const customer = await pool.query('SELECT * FROM customers WHERE id = $1', [customerId]);
        if (customer.rows.length === 0) return res.status(404).json({ message: 'Customer not found' });

        let q = `SELECT ci.invoice_number, ci.invoice_date, ci.due_date, ci.total_amount,
                 ci.amount_paid, ci.balance_due, ci.status
                 FROM customer_invoices ci WHERE ci.customer_id = $1`;
        const params = [customerId];
        let idx = 2;

        if (start_date) { params.push(start_date); q += ` AND ci.invoice_date >= $${idx++}`; }
        if (end_date) { params.push(end_date); q += ` AND ci.invoice_date <= $${idx++}`; }
        q += ` ORDER BY ci.invoice_date ASC`;

        const invoices = await pool.query(q, params);
        const totalOwed = invoices.rows.reduce((sum, inv) => sum + parseFloat(inv.balance_due), 0);

        res.json({ customer: customer.rows[0], invoices: invoices.rows, total_balance: totalOwed });
    } catch (err) {
        console.error('Error fetching customer statement:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getInvoices, getInvoiceById, createInvoice, createFromSale, updateInvoice, deleteInvoice, recordPayment, writeOff, getARAging, getCustomerStatement };
