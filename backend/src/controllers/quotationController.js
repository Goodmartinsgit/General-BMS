const { pool } = require('../config/db');

/**
 * Quotation Controller
 * Handles logic for professional quotes and pro-forma invoices
 */

const createQuotation = async (req, res) => {
    const client = await pool.connect();
    try {
        const { 
            customer_id, branch_id, items, total_amount, 
            valid_until, notes 
        } = req.body;
        const created_by = req.user.id;

        await client.query('BEGIN');

        // 1. Create Quotation Record
        const quoteResult = await client.query(
            `INSERT INTO quotations (
                quotation_number, customer_id, branch_id, total_amount, 
                valid_until, notes, created_by, status
            ) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
             RETURNING id, quotation_number`,
            [
                `QTN-${Date.now()}`, customer_id, branch_id, total_amount,
                valid_until || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
                notes, created_by, 'Pending'
            ]
        );
        const quotationId = quoteResult.rows[0].id;

        // 2. Add Quotation Items
        for (const item of items) {
            await client.query(
                `INSERT INTO quotation_items (quotation_id, product_id, quantity, unit_price, subtotal) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [quotationId, item.product_id, item.quantity, item.unit_price, item.subtotal]
            );
        }

        await client.query('COMMIT');

        res.status(201).json({ 
            message: 'Quotation created successfully', 
            quotationId, 
            quotationNumber: quoteResult.rows[0].quotation_number 
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};

const getAllQuotations = async (req, res) => {
    try {
        const { status, customerId } = req.query;
        let q = `SELECT q.*, c.customer_name, b.branch_name, u.full_name as creator 
                 FROM quotations q 
                 JOIN customers c ON q.customer_id = c.id 
                 JOIN branches b ON q.branch_id = b.id 
                 JOIN users u ON q.created_by = u.id 
                 WHERE q.deleted_at IS NULL`;
        const params = [];

        if (status) {
            params.push(status);
            q += ` AND q.status = $${params.length}`;
        }
        if (customerId) {
            params.push(customerId);
            q += ` AND q.customer_id = $${params.length}`;
        }

        q += ` ORDER BY q.created_at DESC`;

        const result = await pool.query(q, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getQuotationById = async (req, res) => {
    try {
        const { id } = req.params;
        const quoteResult = await pool.query(
            `SELECT q.*, c.customer_name, c.email as customer_email, c.phone_number as customer_phone, b.branch_name 
             FROM quotations q 
             JOIN customers c ON q.customer_id = c.id 
             JOIN branches b ON q.branch_id = b.id 
             WHERE q.id = $1`,
            [id]
        );

        if (quoteResult.rows.length === 0) {
            return res.status(404).json({ message: 'Quotation not found' });
        }

        const itemsResult = await pool.query(
            `SELECT qi.*, p.product_name, p.product_code 
             FROM quotation_items qi 
             JOIN products p ON qi.product_id = p.id 
             WHERE qi.quotation_id = $1`,
            [id]
        );

        res.json({
            ...quoteResult.rows[0],
            items: itemsResult.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const convertToSale = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { payment_method, amount_paid, bank_channel_id } = req.body;
        const created_by = req.user.id;

        await client.query('BEGIN');

        // 1. Get Quotation Details
        const quoteRes = await client.query('SELECT * FROM quotations WHERE id = $1 AND status = \'Pending\'', [id]);
        if (quoteRes.rows.length === 0) {
            throw new Error('Quotation not found or already converted/expired');
        }
        const quote = quoteRes.rows[0];

        const itemsRes = await client.query('SELECT * FROM quotation_items WHERE quotation_id = $1', [id]);
        const items = itemsRes.rows;

        // 2. Create Sale (Using existing sales logic pattern)
        const saleResult = await client.query(
            `INSERT INTO sales (customer_id, branch_id, total_amount, amount_paid, payment_method, status, created_by, bank_channel_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
            [quote.customer_id, quote.branch_id, quote.total_amount, amount_paid || quote.total_amount, payment_method || 'Cash', 'Paid', created_by, bank_channel_id]
        );
        const saleId = saleResult.rows[0].id;

        // 3. Add Sale Items and Update Inventory
        for (const item of items) {
            await client.query(
                `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [saleId, item.product_id, item.quantity, item.unit_price, item.subtotal]
            );

            // Deduct from branch inventory
            const invUpdate = await client.query(
                'UPDATE branch_inventory SET stock_level = stock_level - $1 WHERE branch_id = $2 AND product_id = $3 RETURNING stock_level',
                [item.quantity, quote.branch_id, item.product_id]
            );

            if (invUpdate.rows.length === 0 || invUpdate.rows[0].stock_level < 0) {
                 // You might want to allow negative stock depending on business rules, 
                 // but typically we should warn or throw error if not allowed.
                 // For now, let's just log it.
                 console.warn(`Warning: Negative stock level for product ${item.product_id} at branch ${quote.branch_id}`);
            }
        }

        // 4. Update Quotation Status
        await client.query('UPDATE quotations SET status = \'Converted\', updated_at = NOW() WHERE id = $1', [id]);

        await client.query('COMMIT');
        res.json({ message: 'Quotation converted to sale successfully', saleId });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: err.message || 'Server error' });
    } finally {
        client.release();
    }
};

module.exports = { 
    createQuotation, 
    getAllQuotations, 
    getQuotationById, 
    convertToSale 
};
