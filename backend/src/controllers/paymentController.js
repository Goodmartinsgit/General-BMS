const { pool } = require('../config/db');

const recordPayment = async (req, res) => {
    const client = await pool.connect();
    try {
        const { 
            customer_id, amount, payment_method, payment_reference, 
            payment_date, notes, allocations 
        } = req.body;
        const recorded_by = req.user.id;

        await client.query('BEGIN');

        // Note: We don't have a global 'payments' table in my previous fix_schema, 
        // but we have 'payment_allocations'. In a real system, you'd want a 'payments' record too.
        // For this implementation, we'll focus on the allocations as requested in Phase 6.

        if (allocations && allocations.length > 0) {
            for (const alloc of allocations) {
                await client.query(
                    `INSERT INTO payment_allocations (sale_id, wholesale_order_id, amount) 
                     VALUES ($1, $2, $3)`,
                    [alloc.sale_id || null, alloc.wholesale_order_id || null, alloc.amount]
                );

                // Update the respective table's amount_paid
                if (alloc.sale_id) {
                    await client.query(
                        `UPDATE sales SET amount_paid = amount_paid + $1, updated_at = NOW() WHERE id = $2`,
                        [alloc.amount, alloc.sale_id]
                    );
                } else if (alloc.wholesale_order_id) {
                    await client.query(
                        `UPDATE wholesale_orders SET amount_paid = amount_paid + $1, updated_at = NOW() WHERE id = $2`,
                        [alloc.amount, alloc.wholesale_order_id]
                    );
                }
            }
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Payment recorded and allocated successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};

const getPaymentAllocations = async (req, res) => {
    try {
        const { sale_id, wholesale_order_id } = req.query;
        let q = `SELECT pa.*, s.sale_number, wo.order_number 
                 FROM payment_allocations pa 
                 LEFT JOIN sales s ON pa.sale_id = s.id 
                 LEFT JOIN wholesale_orders wo ON pa.wholesale_order_id = wo.id 
                 WHERE 1=1`;
        const params = [];

        if (sale_id) {
            params.push(sale_id);
            q += ` AND pa.sale_id = $${params.length}`;
        }
        if (wholesale_order_id) {
            params.push(wholesale_order_id);
            q += ` AND pa.wholesale_order_id = $${params.length}`;
        }

        const result = await pool.query(q, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { recordPayment, getPaymentAllocations };
