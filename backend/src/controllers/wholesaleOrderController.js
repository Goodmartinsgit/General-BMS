const { pool } = require('../config/db');
const { sendWhatsAppMessage } = require('../services/whatsappService');

const createWholesaleOrder = async (req, res) => {
    const client = await pool.connect();
    try {
        const { 
            customer_id, branch_id, items, total_amount, 
            payment_terms_days, notes 
        } = req.body;
        const created_by = req.user.id;

        await client.query('BEGIN');

        // 1. Create Order
        const orderResult = await client.query(
            `INSERT INTO wholesale_orders (
                order_number, customer_id, branch_id, total_amount, 
                payment_terms_days, notes, created_by, status
            ) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
             RETURNING id, order_number`,
            [
                `ORD-WH-${Date.now()}`, customer_id, branch_id, total_amount,
                payment_terms_days, notes, created_by, 'Pending'
            ]
        );
        const orderId = orderResult.rows[0].id;

        // 2. Add Items
        for (const item of items) {
            await client.query(
                `INSERT INTO wholesale_order_items (order_id, product_id, quantity, unit_price, subtotal) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [orderId, item.product_id, item.quantity, item.unit_price, item.subtotal]
            );
        }

        await client.query('COMMIT');

        // Trigger WhatsApp Notification (Async)
        try {
            const customerRes = await pool.query('SELECT phone_number, customer_name FROM customers WHERE id = $1', [customer_id]);
            if (customerRes.rows.length > 0 && customerRes.rows[0].phone_number) {
                const message = `Hello ${customerRes.rows[0].customer_name}, your wholesale order #${orderResult.rows[0].order_number} for ₦${parseFloat(total_amount).toLocaleString()} has been received and is now PENDING. we will keep you updated.`;
                sendWhatsAppMessage(customerRes.rows[0].phone_number, message);
            }
        } catch (waErr) {
            console.error('WhatsApp trigger error:', waErr.message);
        }

        res.status(201).json({ 
            message: 'Wholesale order created', 
            orderId, 
            orderNumber: orderResult.rows[0].order_number 
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};

const getAllWholesaleOrders = async (req, res) => {
    try {
        const { status, customerId } = req.query;
        let q = `SELECT wo.*, c.customer_name, b.branch_name, u.full_name as creator 
                 FROM wholesale_orders wo 
                 JOIN customers c ON wo.customer_id = c.id 
                 JOIN branches b ON wo.branch_id = b.id 
                 JOIN users u ON wo.created_by = u.id 
                 WHERE wo.deleted_at IS NULL`;
        const params = [];

        if (status) {
            params.push(status);
            q += ` AND wo.status = $${params.length}`;
        }
        if (customerId) {
            params.push(customerId);
            q += ` AND wo.customer_id = $${params.length}`;
        }

        q += ` ORDER BY wo.created_at DESC`;

        const result = await pool.query(q, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateWholesaleOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        // In a real system, changing to 'Approved' or 'Packed' might reserve stock
        // For now, we update the status
        const result = await pool.query(
            'UPDATE wholesale_orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Trigger WhatsApp Notification for Status Change (Async)
        try {
            const orderDetail = await pool.query(
                'SELECT wo.order_number, c.phone_number, c.customer_name FROM wholesale_orders wo JOIN customers c ON wo.customer_id = c.id WHERE wo.id = $1',
                [id]
            );
            if (orderDetail.rows.length > 0 && orderDetail.rows[0].phone_number) {
                const message = `Hi ${orderDetail.rows[0].customer_name}, your order #${orderDetail.rows[0].order_number} status has been updated to: ${status.toUpperCase()}.`;
                sendWhatsAppMessage(orderDetail.rows[0].phone_number, message);
            }
        } catch (waErr) {
            console.error('WhatsApp status trigger error:', waErr.message);
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getWholesaleOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const orderResult = await pool.query(
            `SELECT wo.*, c.customer_name, c.email as customer_email, c.phone_number as customer_phone, b.branch_name 
             FROM wholesale_orders wo 
             JOIN customers c ON wo.customer_id = c.id 
             JOIN branches b ON wo.branch_id = b.id 
             WHERE wo.id = $1`,
            [id]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const itemsResult = await pool.query(
            `SELECT woi.*, p.product_name, p.product_code 
             FROM wholesale_order_items woi 
             JOIN products p ON woi.product_id = p.id 
             WHERE woi.order_id = $1`,
            [id]
        );

        res.json({
            ...orderResult.rows[0],
            items: itemsResult.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { createWholesaleOrder, getAllWholesaleOrders, updateWholesaleOrderStatus, getWholesaleOrderById };
