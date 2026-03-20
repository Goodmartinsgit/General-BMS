const { pool } = require('../config/db');
const { sendWhatsAppMessage } = require('../services/whatsappService');
const { recordCashFlow } = require('./bankController');
const taskService = require('../services/RetailPerformanceTaskService');



const createSale = async (req, res) => {
    const client = await pool.connect();
    try {
        const {
            branch_id, customer_id, items, subtotal, discount_amount,
            tax_amount, total_amount, payment_method, amount_paid,
            referrer_id, channel_id, promotion_id, coupon_code, notes
        } = req.body;

        const performed_by = req.user.id;

        await client.query('BEGIN');

        // Calculate Commission if referrer is provided
        let commission_amount = 0;
        if (referrer_id) {
            const referrerResult = await client.query(
                'SELECT commission_rate, commission_type, fixed_commission_amount FROM referrers WHERE id = $1',
                [referrer_id]
            );
            if (referrerResult.rows.length > 0) {
                const ref = referrerResult.rows[0];
                if (ref.commission_type === 'percentage') {
                    commission_amount = (total_amount * parseFloat(ref.commission_rate)) / 100;
                } else {
                    commission_amount = parseFloat(ref.fixed_commission_amount || 0);
                }
            }
        }

        // Validate and apply promotion if provided
        let promotion_discount = 0;
        if (promotion_id) {
            const promoResult = await client.query(
                `SELECT * FROM promotions WHERE id = $1 AND is_active = true
                 AND (start_date IS NULL OR start_date <= NOW())
                 AND (end_date IS NULL OR end_date >= NOW())`,
                [promotion_id]
            );

            if (promoResult.rows.length > 0) {
                const promo = promoResult.rows[0];

                // Check usage limits
                if (promo.usage_limit && promo.usage_count >= promo.usage_limit) {
                    throw new Error('Promotion usage limit reached');
                }

                // Calculate promotion discount based on type
                const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

                switch (promo.promotion_type) {
                    case 'percentage':
                        promotion_discount = (subtotal * promo.discount_percentage) / 100;
                        break;
                    case 'fixed_amount':
                        promotion_discount = promo.discount_amount;
                        break;
                    case 'bogo':
                        // Calculate BOGO discount (simplified)
                        const freeItems = Math.floor(totalQuantity / (promo.buy_quantity + promo.get_quantity)) * promo.get_quantity;
                        const avgPrice = subtotal / totalQuantity;
                        promotion_discount = freeItems * avgPrice;
                        break;
                    case 'bulk_discount':
                        if (totalQuantity >= promo.min_quantity) {
                            promotion_discount = (subtotal * promo.discount_percentage) / 100;
                        }
                        break;
                }

                // Apply max discount limit
                if (promo.max_discount_amount && promotion_discount > promo.max_discount_amount) {
                    promotion_discount = promo.max_discount_amount;
                }

                promotion_discount = parseFloat(promotion_discount.toFixed(2));

                // Update promotion usage
                await client.query(
                    `UPDATE promotions SET usage_count = usage_count + 1, updated_at = NOW()
                     WHERE id = $1`,
                    [promotion_id]
                );
            }
        }

        // Calculate cost and profit totals
        let cost_total = 0;
        for (const item of items) {
            const productResult = await client.query(
                'SELECT cost_price FROM products WHERE id = $1',
                [item.product_id]
            );
            if (productResult.rows.length > 0) {
                const cost_price = parseFloat(productResult.rows[0].cost_price || 0);
                cost_total += cost_price * item.quantity;
            }
        }
        const profit_total = subtotal - cost_total - (discount_amount || 0) - (promotion_discount || 0);

        // 1. Create Sale Record
        const saleResult = await client.query(
            `INSERT INTO sales (
                sale_number, branch_id, customer_id, subtotal, discount_amount,
                tax_amount, total_amount, payment_method, amount_paid,
                status, processed_by, referrer_id, commission_amount,
                promotion_id, promotion_discount, coupon_code, cost_total, profit_total, notes
            )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
             RETURNING id, sale_number`,
            [
                `SALE-${Date.now()}`, branch_id, customer_id || null, subtotal, discount_amount,
                tax_amount, total_amount, payment_method, amount_paid,
                'Completed', performed_by, referrer_id || null, commission_amount,
                promotion_id || null, promotion_discount, coupon_code || null, cost_total, profit_total, notes || null
            ]
        );
        const saleId = saleResult.rows[0].id;
        const saleNumber = saleResult.rows[0].sale_number;

        // 1.5 Record Cash Flow if amount_paid > 0 and channel_id provided
        if (amount_paid > 0 && channel_id) {
            await recordCashFlow(client, {
                channel_id,
                type: 'inflow',
                amount: amount_paid,
                source: 'sale',
                reference_id: saleId,
                reference_number: saleNumber,
                description: `Payment for Sale #${saleNumber}`,
                performed_by
            });
        }


        // Update Referrer totals if applicable
        if (referrer_id && commission_amount > 0) {
            await client.query(
                `UPDATE referrers 
                 SET total_referrals = total_referrals + 1,
                     total_sales_value = total_sales_value + $1,
                     total_commission_earned = total_commission_earned + $2,
                     commission_balance = commission_balance + $2,
                     updated_at = NOW()
                 WHERE id = $3`,
                [total_amount, commission_amount, referrer_id]
            );
        }

        // 2. Process Items and Inventory
        for (const item of items) {
            // Get product cost for profit calculation
            const productResult = await client.query(
                'SELECT cost_price FROM products WHERE id = $1',
                [item.product_id]
            );
            const cost_price = productResult.rows.length > 0 ? parseFloat(productResult.rows[0].cost_price || 0) : 0;
            const item_cost_total = cost_price * item.quantity;
            const item_profit = item.subtotal - item_cost_total;

            // Record Sale Item with variant and cost tracking
            const saleItemResult = await client.query(
                `INSERT INTO sale_items (
                    sale_id, product_id, variant_id, quantity, unit_price, line_total,
                    cost_price
                )
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING id`,
                [
                    saleId, item.product_id, item.variant_id || null,
                    item.quantity, item.unit_price, item.subtotal,
                    cost_price
                ]
            );
            const saleItemId = saleItemResult.rows[0].id;

            // Update inventory based on whether item has variant
            let quantity_before = 0;
            let quantity_after = 0;

            if (item.variant_id) {
                // Update variant inventory
                const variantInvResult = await client.query(
                    `SELECT quantity_on_hand FROM variant_inventory
                     WHERE variant_id = $1 AND branch_id = $2 FOR UPDATE`,
                    [item.variant_id, branch_id]
                );

                if (variantInvResult.rows.length === 0) {
                    throw new Error(`Variant ${item.variant_id} not found in inventory for branch ${branch_id}`);
                }

                quantity_before = variantInvResult.rows[0].quantity_on_hand;
                quantity_after = quantity_before - item.quantity;

                if (quantity_after < 0) {
                    throw new Error(`Insufficient stock for variant ${item.variant_id}`);
                }

                await client.query(
                    `UPDATE variant_inventory SET quantity_on_hand = $1, updated_at = NOW()
                     WHERE variant_id = $2 AND branch_id = $3`,
                    [quantity_after, item.variant_id, branch_id]
                );
            } else {
                // Update product inventory
                const invResult = await client.query(
                    `SELECT quantity_on_hand FROM inventory
                     WHERE product_id = $1 AND branch_id = $2 FOR UPDATE`,
                    [item.product_id, branch_id]
                );

                if (invResult.rows.length === 0) {
                    throw new Error(`Product ${item.product_id} not found in inventory for branch ${branch_id}`);
                }

                quantity_before = invResult.rows[0].quantity_on_hand;
                quantity_after = quantity_before - item.quantity;

                if (quantity_after < 0) {
                    throw new Error(`Insufficient stock for product ${item.product_id}`);
                }

                await client.query(
                    `UPDATE inventory SET quantity_on_hand = $1, updated_at = NOW()
                     WHERE product_id = $2 AND branch_id = $3`,
                    [quantity_after, item.product_id, branch_id]
                );
            }

            // Record Stock Movement
            await client.query(
                `INSERT INTO stock_movements (
                    product_id, variant_id, branch_id, movement_type, quantity,
                    quantity_before, quantity_after, notes, performed_by
                )
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [
                    item.product_id, item.variant_id || null, branch_id, 'sale', -item.quantity,
                    quantity_before, quantity_after, `Sale #${saleNumber}`, performed_by
                ]
            );

            // Process serial numbers if provided
            if (item.serial_numbers && item.serial_numbers.length > 0) {
                for (const serialNumber of item.serial_numbers) {
                    // Mark serial number as sold
                    await client.query(
                        `UPDATE serial_numbers SET
                            status = 'sold',
                            sold_date = NOW(),
                            customer_id = $1,
                            sale_id = $2,
                            updated_at = NOW()
                         WHERE serial_number = $3 AND product_id = $4`,
                        [customer_id, saleId, serialNumber, item.product_id]
                    );

                    // Link serial number to sale item
                    await client.query(
                        `INSERT INTO sale_item_serials (sale_item_id, serial_number_id)
                         SELECT $1, id FROM serial_numbers WHERE serial_number = $2`,
                        [saleItemId, serialNumber]
                    );
                }
            }

            // Update batch quantity if batch tracking is used
            if (item.batch_id) {
                await client.query(
                    `UPDATE batches SET current_quantity = current_quantity - $1, updated_at = NOW()
                     WHERE id = $2`,
                    [item.quantity, item.batch_id]
                );
            }
        }

        // Update customer statistics
        if (customer_id) {
            await client.query(
                `UPDATE customers SET
                    total_purchases = total_purchases + $1,
                    last_purchase_date = NOW(),
                    updated_at = NOW()
                 WHERE id = $2`,
                [total_amount, customer_id]
            );
        }

        // 1.6 Record Performance Task Progress
        await taskService.recordSaleProgress(saleResult.rows[0], performed_by);

        await client.query('COMMIT');


        // Trigger WhatsApp Notification (Async)
        try {
            const customerRes = await pool.query('SELECT phone_number, customer_name FROM customers WHERE id = $1', [customer_id]);
            if (customerRes.rows.length > 0 && customerRes.rows[0].phone_number) {
                const message = `Hello ${customerRes.rows[0].customer_name || 'Customer'}, your purchase #${saleResult.rows[0].sale_number} for ₦${parseFloat(total_amount).toLocaleString()} has been recorded. Thank you for choosing BMS!`;
                sendWhatsAppMessage(customerRes.rows[0].phone_number, message);
            }
        } catch (waErr) {
            console.error('WhatsApp trigger error:', waErr.message);
        }

        res.status(201).json({ 
            message: 'Sale completed successfully', 
            saleId, 
            saleNumber: saleResult.rows[0].sale_number 
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};


const getAllSales = async (req, res) => {
    try {
        const { branchId, startDate, endDate, status, includeReversed } = req.query;
        let q = `SELECT s.*, b.branch_name, c.customer_name, u.full_name as salesperson,
                 r.full_name as referrer_name, p.promotion_name,
                 CASE WHEN s.reversed_at IS NOT NULL THEN true ELSE false END as is_reversed
                 FROM sales s
                 JOIN branches b ON s.branch_id = b.id
                 LEFT JOIN customers c ON s.customer_id = c.id
                 LEFT JOIN users u ON s.processed_by = u.id
                 LEFT JOIN referrers r ON s.referrer_id = r.id
                 LEFT JOIN promotions p ON s.promotion_id = p.id
                 WHERE 1=1`;
        const params = [];

        if (branchId) {
            params.push(branchId);
            q += ` AND s.branch_id = $${params.length}`;
        }
        if (startDate) {
            params.push(startDate);
            q += ` AND s.created_at >= $${params.length}`;
        }
        if (endDate) {
            params.push(endDate);
            q += ` AND s.created_at <= $${params.length}`;
        }
        if (status) {
            params.push(status);
            q += ` AND s.status = $${params.length}`;
        }

        // Filter reversed sales unless explicitly included
        if (includeReversed !== 'true') {
            q += ` AND s.reversed_at IS NULL`;
        }

        q += ` ORDER BY s.created_at DESC`;

        const result = await pool.query(q, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getSaleById = async (req, res) => {
    try {
        const { id } = req.params;
        const saleResult = await pool.query(
            `SELECT s.*, b.branch_name, c.customer_name, c.phone_number, c.email,
             u.full_name as salesperson, r.full_name as referrer_name, p.promotion_name,
             rv.full_name as reversed_by_name, un.full_name as unreversed_by_name,
             CASE WHEN s.reversed_at IS NOT NULL THEN true ELSE false END as is_reversed
             FROM sales s
             JOIN branches b ON s.branch_id = b.id
             LEFT JOIN customers c ON s.customer_id = c.id
             LEFT JOIN users u ON s.processed_by = u.id
             LEFT JOIN referrers r ON s.referrer_id = r.id
             LEFT JOIN promotions p ON s.promotion_id = p.id
             LEFT JOIN users rv ON s.reversed_by = rv.id
             LEFT JOIN users un ON s.unreversed_by = un.id
             WHERE s.id = $1`,
            [id]
        );

        if (saleResult.rows.length === 0) {
            return res.status(404).json({ message: 'Sale not found' });
        }

        const itemsResult = await pool.query(
            `SELECT si.*, p.product_name, p.product_code,
             pv.sku as variant_sku, pv.variant_values,
             b.batch_number, b.expiry_date
             FROM sale_items si
             JOIN products p ON si.product_id = p.id
             LEFT JOIN product_variants pv ON si.variant_id = pv.id
             LEFT JOIN product_batches b ON si.batch_id = b.id
             WHERE si.sale_id = $1`,
            [id]
        );

        // Get serial numbers for each item
        for (const item of itemsResult.rows) {
            const serialResult = await pool.query(
                `SELECT sn.serial_number, sn.warranty_months, sn.warranty_expiry_date
                 FROM sale_item_serials sis
                 JOIN serial_numbers sn ON sis.serial_number_id = sn.id
                 WHERE sis.sale_item_id = $1`,
                [item.id]
            );
            item.serial_numbers = serialResult.rows;
        }

        // Get comments
        const commentsResult = await pool.query(
            `SELECT sc.*, u.full_name as commenter_name
             FROM sale_comments sc
             JOIN users u ON sc.user_id = u.id
             WHERE sc.sale_id = $1
             ORDER BY sc.created_at ASC`,
            [id]
        );

        res.json({
            ...saleResult.rows[0],
            items: itemsResult.rows,
            comments: commentsResult.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// ============================================================================
// REVERSE SALE (Cancel Sale)
// ============================================================================
const reverseSale = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { reversal_reason, reversal_note } = req.body;
        const reversed_by = req.user.id;

        await client.query('BEGIN');

        // Get sale details
        const saleResult = await client.query(
            'SELECT * FROM sales WHERE id = $1 FOR UPDATE',
            [id]
        );

        if (saleResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Sale not found' });
        }

        const sale = saleResult.rows[0];

        if (sale.reversed_at) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Sale is already reversed' });
        }

        // Get sale items
        const itemsResult = await client.query(
            'SELECT * FROM sale_items WHERE sale_id = $1',
            [id]
        );

        // Restore inventory for each item
        for (const item of itemsResult.rows) {
            if (item.variant_id) {
                // Restore variant inventory
                await client.query(
                    `UPDATE variant_inventory SET quantity_on_hand = quantity_on_hand + $1, updated_at = NOW()
                     WHERE variant_id = $2 AND branch_id = $3`,
                    [item.quantity, item.variant_id, sale.branch_id]
                );
            } else {
                // Restore product inventory
                await client.query(
                    `UPDATE inventory SET quantity_on_hand = quantity_on_hand + $1, updated_at = NOW()
                     WHERE product_id = $2 AND branch_id = $3`,
                    [item.quantity, item.product_id, sale.branch_id]
                );
            }

            // Record stock movement for reversal
            await client.query(
                `INSERT INTO stock_movements (
                    product_id, variant_id, branch_id, movement_type, quantity,
                    notes, performed_by
                )
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    item.product_id, item.variant_id || null, sale.branch_id, 'sale_reversal', item.quantity,
                    `Reversal of Sale #${sale.sale_number} - ${reversal_reason}`, reversed_by
                ]
            );

            // Restore batch quantity if applicable
            if (item.batch_id) {
                await client.query(
                    `UPDATE batches SET current_quantity = current_quantity + $1, updated_at = NOW()
                     WHERE id = $2`,
                    [item.quantity, item.batch_id]
                );
            }

            // Update serial numbers back to in_stock status
            await client.query(
                `UPDATE serial_numbers SET
                    status = 'in_stock',
                    sold_date = NULL,
                    customer_id = NULL,
                    sale_id = NULL,
                    updated_at = NOW()
                 WHERE sale_id = $1`,
                [id]
            );
        }

        // Update sale status to reversed
        await client.query(
            `UPDATE sales SET
                reversed_at = NOW(),
                reversed_by = $1,
                reversal_reason = $2,
                reversal_note = $3,
                updated_at = NOW()
             WHERE id = $4`,
            [reversed_by, reversal_reason, reversal_note || null, id]
        );

        // Reverse customer statistics
        if (sale.customer_id) {
            await client.query(
                `UPDATE customers SET
                    total_purchases = total_purchases - $1,
                    updated_at = NOW()
                 WHERE id = $2`,
                [sale.total_amount, sale.customer_id]
            );
        }

        // Reverse referrer statistics
        if (sale.referrer_id && sale.commission_amount > 0) {
            await client.query(
                `UPDATE referrers SET
                    total_referrals = total_referrals - 1,
                    total_sales_value = total_sales_value - $1,
                    total_commission_earned = total_commission_earned - $2,
                    commission_balance = commission_balance - $2,
                    updated_at = NOW()
                 WHERE id = $3`,
                [sale.total_amount, sale.commission_amount, sale.referrer_id]
            );
        }

        // Reverse promotion usage
        if (sale.promotion_id) {
            await client.query(
                `UPDATE promotions SET usage_count = usage_count - 1, updated_at = NOW()
                 WHERE id = $1`,
                [sale.promotion_id]
            );
        }

        await client.query('COMMIT');

        res.json({
            message: 'Sale reversed successfully',
            saleId: id,
            saleNumber: sale.sale_number
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};

// ============================================================================
// UNREVERSE SALE (Reactivate Cancelled Sale)
// ============================================================================
const unreverseSale = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { unreverse_reason } = req.body;
        const unreversed_by = req.user.id;

        await client.query('BEGIN');

        // Get sale details
        const saleResult = await client.query(
            'SELECT * FROM sales WHERE id = $1 FOR UPDATE',
            [id]
        );

        if (saleResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Sale not found' });
        }

        const sale = saleResult.rows[0];

        if (!sale.reversed_at) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Sale is not reversed' });
        }

        // Get sale items
        const itemsResult = await client.query(
            'SELECT * FROM sale_items WHERE sale_id = $1',
            [id]
        );

        // Deduct inventory again for each item
        for (const item of itemsResult.rows) {
            if (item.variant_id) {
                // Check variant stock
                const variantInvResult = await client.query(
                    'SELECT quantity_on_hand FROM variant_inventory WHERE variant_id = $1 AND branch_id = $2',
                    [item.variant_id, sale.branch_id]
                );

                if (variantInvResult.rows.length === 0 || variantInvResult.rows[0].quantity_on_hand < item.quantity) {
                    throw new Error(`Insufficient stock to unreverse sale for variant ${item.variant_id}`);
                }

                await client.query(
                    `UPDATE variant_inventory SET quantity_on_hand = quantity_on_hand - $1, updated_at = NOW()
                     WHERE variant_id = $2 AND branch_id = $3`,
                    [item.quantity, item.variant_id, sale.branch_id]
                );
            } else {
                // Check product stock
                const invResult = await client.query(
                    'SELECT quantity_on_hand FROM inventory WHERE product_id = $1 AND branch_id = $2',
                    [item.product_id, sale.branch_id]
                );

                if (invResult.rows.length === 0 || invResult.rows[0].quantity_on_hand < item.quantity) {
                    throw new Error(`Insufficient stock to unreverse sale for product ${item.product_id}`);
                }

                await client.query(
                    `UPDATE inventory SET quantity_on_hand = quantity_on_hand - $1, updated_at = NOW()
                     WHERE product_id = $2 AND branch_id = $3`,
                    [item.quantity, item.product_id, sale.branch_id]
                );
            }

            // Record stock movement for unreversal
            await client.query(
                `INSERT INTO stock_movements (
                    product_id, variant_id, branch_id, movement_type, quantity,
                    notes, performed_by
                )
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    item.product_id, item.variant_id || null, sale.branch_id, 'sale', -item.quantity,
                    `Unreversal of Sale #${sale.sale_number}`, unreversed_by
                ]
            );

            // Deduct batch quantity again if applicable
            if (item.batch_id) {
                await client.query(
                    `UPDATE batches SET current_quantity = current_quantity - $1, updated_at = NOW()
                     WHERE id = $2`,
                    [item.quantity, item.batch_id]
                );
            }

            // Update serial numbers back to sold status
            await client.query(
                `UPDATE serial_numbers SET
                    status = 'sold',
                    sold_date = $1,
                    customer_id = $2,
                    sale_id = $3,
                    updated_at = NOW()
                 WHERE id IN (
                     SELECT serial_number_id FROM sale_item_serials WHERE sale_item_id = $4
                 )`,
                [sale.created_at, sale.customer_id, id, item.id]
            );
        }

        // Update sale to unreversed
        await client.query(
            `UPDATE sales SET
                unreversed_at = NOW(),
                unreversed_by = $1,
                unreverse_reason = $2,
                updated_at = NOW()
             WHERE id = $3`,
            [unreversed_by, unreverse_reason || null, id]
        );

        // Restore customer statistics
        if (sale.customer_id) {
            await client.query(
                `UPDATE customers SET
                    total_purchases = total_purchases + $1,
                    updated_at = NOW()
                 WHERE id = $2`,
                [sale.total_amount, sale.customer_id]
            );
        }

        // Restore referrer statistics
        if (sale.referrer_id && sale.commission_amount > 0) {
            await client.query(
                `UPDATE referrers SET
                    total_referrals = total_referrals + 1,
                    total_sales_value = total_sales_value + $1,
                    total_commission_earned = total_commission_earned + $2,
                    commission_balance = commission_balance + $2,
                    updated_at = NOW()
                 WHERE id = $3`,
                [sale.total_amount, sale.commission_amount, sale.referrer_id]
            );
        }

        // Restore promotion usage
        if (sale.promotion_id) {
            await client.query(
                `UPDATE promotions SET usage_count = usage_count + 1, updated_at = NOW()
                 WHERE id = $1`,
                [sale.promotion_id]
            );
        }

        await client.query('COMMIT');

        res.json({
            message: 'Sale unreversed successfully',
            saleId: id,
            saleNumber: sale.sale_number
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};

// ============================================================================
// SALE COMMENTS
// ============================================================================
const addSaleComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { comment, attachments } = req.body;
        const user_id = req.user.id;

        // Verify sale exists
        const saleResult = await pool.query('SELECT id FROM sales WHERE id = $1', [id]);
        if (saleResult.rows.length === 0) {
            return res.status(404).json({ message: 'Sale not found' });
        }

        const result = await pool.query(
            `INSERT INTO sale_comments (sale_id, created_by, comment_text, attachments)
             VALUES ($1, $2, $3, $4)
             RETURNING id, created_at`,
            [id, user_id, comment, attachments ? JSON.stringify(attachments) : null]
        );

        res.status(201).json({
            message: 'Comment added successfully',
            commentId: result.rows[0].id,
            created_at: result.rows[0].created_at
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getSaleComments = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT sc.*, u.full_name as commenter_name, u.email as commenter_email
             FROM sale_comments sc
             JOIN users u ON sc.user_id = u.id
             WHERE sc.sale_id = $1
             ORDER BY sc.created_at ASC`,
            [id]
        );

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// ============================================================================
// SALE STATISTICS
// ============================================================================
const getSaleStatistics = async (req, res) => {
    try {
        const { branchId, startDate, endDate } = req.query;
        let params = [];

        // Total sales
        let totalQuery = 'SELECT COUNT(*) as total_sales, COALESCE(SUM(total_amount), 0) as total_revenue FROM sales WHERE reversed_at IS NULL';
        if (branchId) {
            params.push(branchId);
            totalQuery += ` AND branch_id = $${params.length}`;
        }
        if (startDate) {
            params.push(startDate);
            totalQuery += ` AND created_at >= $${params.length}`;
        }
        if (endDate) {
            params.push(endDate);
            totalQuery += ` AND created_at <= $${params.length}`;
        }

        const totalResult = await pool.query(totalQuery, params);

        // Cost and profit
        params = [];
        let profitQuery = 'SELECT COALESCE(SUM(cost_total), 0) as total_cost, COALESCE(SUM(profit_total), 0) as total_profit FROM sales WHERE reversed_at IS NULL';
        if (branchId) {
            params.push(branchId);
            profitQuery += ` AND branch_id = $${params.length}`;
        }
        if (startDate) {
            params.push(startDate);
            profitQuery += ` AND created_at >= $${params.length}`;
        }
        if (endDate) {
            params.push(endDate);
            profitQuery += ` AND created_at <= $${params.length}`;
        }

        const profitResult = await pool.query(profitQuery, params);

        // Reversed sales
        params = [];
        let reversedQuery = 'SELECT COUNT(*) as reversed_sales, COALESCE(SUM(total_amount), 0) as reversed_amount FROM sales WHERE reversed_at IS NOT NULL';
        if (branchId) {
            params.push(branchId);
            reversedQuery += ` AND branch_id = $${params.length}`;
        }
        if (startDate) {
            params.push(startDate);
            reversedQuery += ` AND reversed_at >= $${params.length}`;
        }
        if (endDate) {
            params.push(endDate);
            reversedQuery += ` AND reversed_at <= $${params.length}`;
        }

        const reversedResult = await pool.query(reversedQuery, params);

        // Promotion usage
        params = [];
        let promoQuery = 'SELECT COUNT(*) as sales_with_promotions, COALESCE(SUM(promotion_discount), 0) as total_promotion_discounts FROM sales WHERE promotion_id IS NOT NULL AND reversed_at IS NULL';
        if (branchId) {
            params.push(branchId);
            promoQuery += ` AND branch_id = $${params.length}`;
        }
        if (startDate) {
            params.push(startDate);
            promoQuery += ` AND created_at >= $${params.length}`;
        }
        if (endDate) {
            params.push(endDate);
            promoQuery += ` AND created_at <= $${params.length}`;
        }

        const promoResult = await pool.query(promoQuery, params);

        // Average sale value
        const avgSaleValue = totalResult.rows[0].total_sales > 0
            ? parseFloat(totalResult.rows[0].total_revenue) / parseInt(totalResult.rows[0].total_sales)
            : 0;

        // Profit margin
        const totalRevenue = parseFloat(totalResult.rows[0].total_revenue);
        const totalProfit = parseFloat(profitResult.rows[0].total_profit);
        const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

        res.json({
            total_sales: parseInt(totalResult.rows[0].total_sales),
            total_revenue: parseFloat(totalResult.rows[0].total_revenue).toFixed(2),
            total_cost: parseFloat(profitResult.rows[0].total_cost).toFixed(2),
            total_profit: totalProfit.toFixed(2),
            profit_margin: profitMargin.toFixed(2),
            average_sale_value: avgSaleValue.toFixed(2),
            reversed_sales: parseInt(reversedResult.rows[0].reversed_sales),
            reversed_amount: parseFloat(reversedResult.rows[0].reversed_amount).toFixed(2),
            sales_with_promotions: parseInt(promoResult.rows[0].sales_with_promotions),
            total_promotion_discounts: parseFloat(promoResult.rows[0].total_promotion_discounts).toFixed(2)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    createSale,
    getAllSales,
    getSaleById,
    reverseSale,
    unreverseSale,
    addSaleComment,
    getSaleComments,
    getSaleStatistics
};
