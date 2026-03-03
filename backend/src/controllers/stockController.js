const { pool } = require('../config/db');

// ============================================================================
// STOCK TRANSFERS
// ============================================================================

/**
 * Create Stock Transfer
 * Transfer stock between branches (supports variants)
 */
const createStockTransfer = async (req, res) => {
    const client = await pool.connect();
    try {
        const { from_branch_id, to_branch_id, items, notes } = req.body;
        const initiated_by = req.user.id;

        if (from_branch_id === to_branch_id) {
            return res.status(400).json({ message: 'Cannot transfer to the same branch' });
        }

        await client.query('BEGIN');

        // Generate transfer number
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const countResult = await client.query(
            `SELECT COUNT(*) FROM stock_transfers WHERE transfer_number LIKE $1`,
            [`STF-${today}-%`]
        );
        const count = parseInt(countResult.rows[0].count) + 1;
        const transfer_number = `STF-${today}-${String(count).padStart(4, '0')}`;

        // Create transfer record
        const transferResult = await client.query(
            `INSERT INTO stock_transfers (
                transfer_number, from_branch_id, to_branch_id, status, notes,
                initiated_by
            )
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, transfer_number, created_at`,
            [transfer_number, from_branch_id, to_branch_id, 'pending', notes || null, initiated_by]
        );

        const transfer_id = transferResult.rows[0].id;

        // Add transfer items
        for (const item of items) {
            // Verify stock availability
            const productStock = await client.query(
                'SELECT quantity_on_hand FROM inventory WHERE product_id = $1 AND branch_id = $2',
                [item.product_id, from_branch_id]
            );
            if (productStock.rows.length === 0 || productStock.rows[0].quantity_on_hand < item.quantity) {
                throw new Error(`Insufficient stock for product ${item.product_id} at source branch`);
            }

            await client.query(
                `INSERT INTO stock_transfer_items (
                    transfer_id, product_id, quantity_requested, notes
                )
                 VALUES ($1, $2, $3, $4)`,
                [transfer_id, item.product_id, item.quantity, item.notes || null]
            );
        }

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Stock transfer created successfully',
            transfer_id,
            transfer_number: transferResult.rows[0].transfer_number,
            created_at: transferResult.rows[0].created_at
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};

/**
 * Get All Stock Transfers
 */
const getAllStockTransfers = async (req, res) => {
    try {
        const { fromBranchId, toBranchId, status, startDate, endDate, search } = req.query;
        let query = `
            SELECT st.*,
                   fb.branch_name as from_branch_name,
                   tb.branch_name as to_branch_name,
                   u.full_name as initiated_by_name,
                   au.full_name as approved_by_name,
                   ru.full_name as received_by_name
            FROM stock_transfers st
            JOIN branches fb ON st.from_branch_id = fb.id
            JOIN branches tb ON st.to_branch_id = tb.id
            LEFT JOIN users u ON st.initiated_by = u.id
            LEFT JOIN users au ON st.approved_by = au.id
            LEFT JOIN users ru ON st.received_by = ru.id
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (st.transfer_number ILIKE $${params.length} OR fb.branch_name ILIKE $${params.length} OR tb.branch_name ILIKE $${params.length})`;
        }
        if (fromBranchId) {
            params.push(fromBranchId);
            query += ` AND st.from_branch_id = $${params.length}`;
        }
        if (toBranchId) {
            params.push(toBranchId);
            query += ` AND st.to_branch_id = $${params.length}`;
        }
        if (status) {
            params.push(status);
            query += ` AND st.status = $${params.length}`;
        }
        if (startDate) {
            params.push(startDate);
            query += ` AND st.created_at >= $${params.length}`;
        }
        if (endDate) {
            params.push(endDate);
            query += ` AND st.created_at <= $${params.length}`;
        }

        query += ' ORDER BY st.created_at DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Get Single Stock Transfer
 */
const getStockTransfer = async (req, res) => {
    try {
        const { id } = req.params;

        // Get transfer details
        const transferResult = await pool.query(
            `SELECT st.*,
                    fb.branch_name as from_branch_name,
                    tb.branch_name as to_branch_name,
                    u.full_name as initiated_by_name,
                    au.full_name as approved_by_name,
                    ru.full_name as received_by_name
             FROM stock_transfers st
             JOIN branches fb ON st.from_branch_id = fb.id
             JOIN branches tb ON st.to_branch_id = tb.id
             LEFT JOIN users u ON st.initiated_by = u.id
             LEFT JOIN users au ON st.approved_by = au.id
             LEFT JOIN users ru ON st.received_by = ru.id
             WHERE st.id = $1`,
            [id]
        );

        if (transferResult.rows.length === 0) {
            return res.status(404).json({ message: 'Stock transfer not found' });
        }

        // Get transfer items
        const itemsResult = await pool.query(
            `SELECT sti.*, p.product_name, p.product_code
             FROM stock_transfer_items sti
             JOIN products p ON sti.product_id = p.id
             WHERE sti.transfer_id = $1`,
            [id]
        );

        res.json({
            ...transferResult.rows[0],
            items: itemsResult.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Approve Stock Transfer
 */
const approveStockTransfer = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const approved_by = req.user.id;

        await client.query('BEGIN');

        const transferResult = await client.query(
            'SELECT * FROM stock_transfers WHERE id = $1 FOR UPDATE',
            [id]
        );

        if (transferResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Stock transfer not found' });
        }

        const transfer = transferResult.rows[0];

        if (transfer.status !== 'pending') {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: `Cannot approve transfer with status: ${transfer.status}` });
        }

        await client.query(
            `UPDATE stock_transfers SET
                status = 'approved',
                approved_by = $1,
                approved_at = NOW(),
                updated_at = NOW()
             WHERE id = $2`,
            [approved_by, id]
        );

        await client.query('COMMIT');

        res.json({ message: 'Stock transfer approved successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};

/**
 * Complete Stock Transfer
 * Actually moves the stock between branches
 */
const completeStockTransfer = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const received_by = req.user.id;

        await client.query('BEGIN');

        // Get transfer details
        const transferResult = await client.query(
            'SELECT * FROM stock_transfers WHERE id = $1 FOR UPDATE',
            [id]
        );

        if (transferResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Stock transfer not found' });
        }

        const transfer = transferResult.rows[0];

        if (transfer.status !== 'approved') {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: `Cannot complete transfer with status: ${transfer.status}. Must be approved first.` });
        }

        // Get transfer items
        const itemsResult = await client.query(
            'SELECT * FROM stock_transfer_items WHERE transfer_id = $1',
            [id]
        );

        // Process each item
        for (const item of itemsResult.rows) {
            const quantity = item.quantity_requested;

            // Deduct from source branch
            const sourceResult = await client.query(
                'SELECT quantity_on_hand FROM inventory WHERE product_id = $1 AND branch_id = $2 FOR UPDATE',
                [item.product_id, transfer.from_branch_id]
            );

            if (sourceResult.rows.length === 0 || sourceResult.rows[0].quantity_on_hand < quantity) {
                throw new Error(`Insufficient stock for product ${item.product_id} at source branch`);
            }

            const source_qty_before = sourceResult.rows[0].quantity_on_hand;
            const source_qty_after = source_qty_before - quantity;

            await client.query(
                `UPDATE inventory SET quantity_on_hand = $1, updated_at = NOW()
                 WHERE product_id = $2 AND branch_id = $3`,
                [source_qty_after, item.product_id, transfer.from_branch_id]
            );

            // Record stock movement for source
            await client.query(
                `INSERT INTO stock_movements (
                    product_id, branch_id, movement_type, quantity,
                    quantity_before, quantity_after, reference_type, reference_id, notes, performed_by
                )
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [
                    item.product_id, transfer.from_branch_id, 'transfer_out', -quantity,
                    source_qty_before, source_qty_after, 'stock_transfer', String(transfer.id),
                    `Transfer to branch ${transfer.to_branch_id} - ${transfer.transfer_number}`, received_by
                ]
            );

            // Add to destination branch
            const destResult = await client.query(
                'SELECT quantity_on_hand FROM inventory WHERE product_id = $1 AND branch_id = $2 FOR UPDATE',
                [item.product_id, transfer.to_branch_id]
            );

            let dest_qty_before = 0;
            let dest_qty_after = quantity;

            if (destResult.rows.length > 0) {
                dest_qty_before = destResult.rows[0].quantity_on_hand;
                dest_qty_after = dest_qty_before + quantity;

                await client.query(
                    `UPDATE inventory SET quantity_on_hand = $1, updated_at = NOW()
                     WHERE product_id = $2 AND branch_id = $3`,
                    [dest_qty_after, item.product_id, transfer.to_branch_id]
                );
            } else {
                // Create new inventory record for destination
                await client.query(
                    `INSERT INTO inventory (product_id, branch_id, quantity_on_hand)
                     VALUES ($1, $2, $3)`,
                    [item.product_id, transfer.to_branch_id, quantity]
                );
            }

            // Record stock movement for destination
            await client.query(
                `INSERT INTO stock_movements (
                    product_id, branch_id, movement_type, quantity,
                    quantity_before, quantity_after, reference_type, reference_id, notes, performed_by
                )
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [
                    item.product_id, transfer.to_branch_id, 'transfer_in', quantity,
                    dest_qty_before, dest_qty_after, 'stock_transfer', String(transfer.id),
                    `Transfer from branch ${transfer.from_branch_id} - ${transfer.transfer_number}`, received_by
                ]
            );

            // Update quantity_received on the transfer item
            await client.query(
                `UPDATE stock_transfer_items SET quantity_received = $1 WHERE id = $2`,
                [quantity, item.id]
            );
        }

        // Update transfer status
        await client.query(
            `UPDATE stock_transfers SET
                status = 'completed',
                received_by = $1,
                completed_at = NOW(),
                received_date = NOW(),
                updated_at = NOW()
             WHERE id = $2`,
            [received_by, id]
        );

        await client.query('COMMIT');

        res.json({ message: 'Stock transfer completed successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};

/**
 * Cancel Stock Transfer
 */
const cancelStockTransfer = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { cancellation_reason } = req.body;

        await client.query('BEGIN');

        const transferResult = await client.query(
            'SELECT * FROM stock_transfers WHERE id = $1 FOR UPDATE',
            [id]
        );

        if (transferResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Stock transfer not found' });
        }

        const transfer = transferResult.rows[0];

        if (transfer.status === 'completed') {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Cannot cancel a completed transfer' });
        }

        if (transfer.status === 'cancelled') {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Transfer is already cancelled' });
        }

        await client.query(
            `UPDATE stock_transfers SET
                status = 'cancelled',
                cancellation_reason = $1,
                updated_at = NOW()
             WHERE id = $2`,
            [cancellation_reason || null, id]
        );

        await client.query('COMMIT');

        res.json({ message: 'Stock transfer cancelled successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};

// ============================================================================
// STOCK DAMAGES
// ============================================================================

/**
 * Record Stock Damage
 */
const recordStockDamage = async (req, res) => {
    const client = await pool.connect();
    try {
        const { branch_id, product_id, quantity, damage_reason, damage_type, estimated_loss, notes } = req.body;
        const reported_by = req.user.id;

        await client.query('BEGIN');

        // Verify stock availability
        const productStock = await client.query(
            'SELECT quantity_on_hand FROM inventory WHERE product_id = $1 AND branch_id = $2 FOR UPDATE',
            [product_id, branch_id]
        );

        if (productStock.rows.length === 0 || productStock.rows[0].quantity_on_hand < quantity) {
            throw new Error('Insufficient stock to record damage');
        }

        const qty_before = productStock.rows[0].quantity_on_hand;
        const qty_after = qty_before - quantity;

        // Deduct from inventory
        await client.query(
            `UPDATE inventory SET quantity_on_hand = $1, updated_at = NOW()
             WHERE product_id = $2 AND branch_id = $3`,
            [qty_after, product_id, branch_id]
        );

        // Record stock movement
        await client.query(
            `INSERT INTO stock_movements (
                product_id, branch_id, movement_type, quantity,
                quantity_before, quantity_after, notes, performed_by
            )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                product_id, branch_id, 'damage', -quantity,
                qty_before, qty_after, `${damage_type}: ${damage_reason}`, reported_by
            ]
        );

        // Generate damage number
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const countResult = await client.query(
            `SELECT COUNT(*) FROM stock_damages WHERE damage_number LIKE $1`,
            [`DMG-${today}-%`]
        );
        const count = parseInt(countResult.rows[0].count) + 1;
        const damage_number = `DMG-${today}-${String(count).padStart(4, '0')}`;

        // Record damage
        const damageResult = await client.query(
            `INSERT INTO stock_damages (
                damage_number, branch_id, product_id, quantity_damaged, damage_reason,
                damage_type, estimated_loss, notes, reported_by
            )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING id, created_at`,
            [damage_number, branch_id, product_id, quantity, damage_reason, damage_type, estimated_loss || null, notes || null, reported_by]
        );

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Stock damage recorded successfully',
            damage_id: damageResult.rows[0].id,
            created_at: damageResult.rows[0].created_at
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};

/**
 * Get All Stock Damages
 */
const getAllStockDamages = async (req, res) => {
    try {
        const { branchId, productId, damageType, startDate, endDate } = req.query;
        let query = `
            SELECT sd.*, b.branch_name, p.product_name, p.product_code,
                   u.full_name as reported_by_name,
                   au.full_name as approved_by_name
            FROM stock_damages sd
            JOIN branches b ON sd.branch_id = b.id
            JOIN products p ON sd.product_id = p.id
            LEFT JOIN users u ON sd.reported_by = u.id
            LEFT JOIN users au ON sd.approved_by = au.id
            WHERE 1=1
        `;
        const params = [];

        if (branchId) {
            params.push(branchId);
            query += ` AND sd.branch_id = $${params.length}`;
        }
        if (productId) {
            params.push(productId);
            query += ` AND sd.product_id = $${params.length}`;
        }
        if (damageType) {
            params.push(damageType);
            query += ` AND sd.damage_type = $${params.length}`;
        }
        if (startDate) {
            params.push(startDate);
            query += ` AND sd.created_at >= $${params.length}`;
        }
        if (endDate) {
            params.push(endDate);
            query += ` AND sd.created_at <= $${params.length}`;
        }

        query += ' ORDER BY sd.created_at DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Get Stock Damage Statistics
 */
const getStockDamageStatistics = async (req, res) => {
    try {
        const { branchId, startDate, endDate } = req.query;
        let params = [];

        // Total damages
        let query = 'SELECT COUNT(*) as total_damages, COALESCE(SUM(quantity_damaged), 0) as total_quantity FROM stock_damages WHERE 1=1';
        if (branchId) {
            params.push(branchId);
            query += ` AND branch_id = $${params.length}`;
        }
        if (startDate) {
            params.push(startDate);
            query += ` AND created_at >= $${params.length}`;
        }
        if (endDate) {
            params.push(endDate);
            query += ` AND created_at <= $${params.length}`;
        }

        const totalResult = await pool.query(query, params);

        // By damage type
        params = [];
        let typeQuery = 'SELECT damage_type, COUNT(*) as count, SUM(quantity_damaged) as quantity FROM stock_damages WHERE 1=1';
        if (branchId) {
            params.push(branchId);
            typeQuery += ` AND branch_id = $${params.length}`;
        }
        if (startDate) {
            params.push(startDate);
            typeQuery += ` AND created_at >= $${params.length}`;
        }
        if (endDate) {
            params.push(endDate);
            typeQuery += ` AND created_at <= $${params.length}`;
        }
        typeQuery += ' GROUP BY damage_type';

        const typeResult = await pool.query(typeQuery, params);

        res.json({
            total_damages: parseInt(totalResult.rows[0].total_damages),
            total_quantity: parseInt(totalResult.rows[0].total_quantity),
            by_type: typeResult.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// ============================================================================
// STOCK ACTIVITY LOG
// ============================================================================

/**
 * Get Stock Activity Log
 */
const getStockActivity = async (req, res) => {
    try {
        const { branchId, productId, movementType, startDate, endDate, limit = 100, offset = 0 } = req.query;
        let query = `
            SELECT sm.*, b.branch_name, p.product_name, p.product_code,
                   u.full_name as performed_by_name
            FROM stock_movements sm
            JOIN branches b ON sm.branch_id = b.id
            JOIN products p ON sm.product_id = p.id
            LEFT JOIN users u ON sm.performed_by = u.id
            WHERE 1=1
        `;
        const params = [];

        if (branchId) {
            params.push(branchId);
            query += ` AND sm.branch_id = $${params.length}`;
        }
        if (productId) {
            params.push(productId);
            query += ` AND sm.product_id = $${params.length}`;
        }
        if (movementType) {
            params.push(movementType);
            query += ` AND sm.movement_type = $${params.length}`;
        }
        if (startDate) {
            params.push(startDate);
            query += ` AND sm.created_at >= $${params.length}`;
        }
        if (endDate) {
            params.push(endDate);
            query += ` AND sm.created_at <= $${params.length}`;
        }

        query += ' ORDER BY sm.created_at DESC';

        // Add pagination
        params.push(limit);
        query += ` LIMIT $${params.length}`;
        params.push(offset);
        query += ` OFFSET $${params.length}`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// ============================================================================
// STOCK ADJUSTMENTS
// ============================================================================

/**
 * Create Stock Adjustment
 * Manual adjustment of stock levels with reason
 */
const createStockAdjustment = async (req, res) => {
    const client = await pool.connect();
    try {
        const { branch_id, product_id, adjustment_quantity, adjustment_reason, notes } = req.body;
        const performed_by = req.user.id;

        await client.query('BEGIN');

        // Adjust product inventory
        const productResult = await client.query(
            'SELECT quantity_on_hand FROM inventory WHERE product_id = $1 AND branch_id = $2 FOR UPDATE',
            [product_id, branch_id]
        );

        let qty_before = 0;
        if (productResult.rows.length > 0) {
            qty_before = productResult.rows[0].quantity_on_hand;
        }

        const qty_after = qty_before + adjustment_quantity;

        if (qty_after < 0) {
            throw new Error('Adjustment would result in negative stock');
        }

        if (productResult.rows.length > 0) {
            await client.query(
                `UPDATE inventory SET quantity_on_hand = $1, updated_at = NOW()
                 WHERE product_id = $2 AND branch_id = $3`,
                [qty_after, product_id, branch_id]
            );
        } else {
            await client.query(
                `INSERT INTO inventory (product_id, branch_id, quantity_on_hand)
                 VALUES ($1, $2, $3)`,
                [product_id, branch_id, qty_after]
            );
        }

        // Record stock movement
        await client.query(
            `INSERT INTO stock_movements (
                product_id, branch_id, movement_type, quantity,
                quantity_before, quantity_after, notes, performed_by
            )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                product_id, branch_id, 'adjustment', adjustment_quantity,
                qty_before, qty_after, `${adjustment_reason}${notes ? ': ' + notes : ''}`, performed_by
            ]
        );

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Stock adjustment recorded successfully',
            adjustment_quantity,
            new_quantity: qty_after
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};

/**
 * Get Stock Transfer Statistics
 */
const getStockTransferStats = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total_transfers,
                COUNT(*) FILTER (WHERE status = 'pending') as pending_approvals,
                COUNT(*) FILTER (WHERE status = 'approved') as approved_transfers,
                COUNT(*) FILTER (WHERE status = 'completed') as completed_transfers
            FROM stock_transfers
        `);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    // Stock Transfers
    createStockTransfer,
    getAllStockTransfers,
    getStockTransfer,
    approveStockTransfer,
    completeStockTransfer,
    cancelStockTransfer,
    getStockTransferStats,

    // Stock Damages
    recordStockDamage,
    getAllStockDamages,
    getStockDamageStatistics,

    // Stock Activity
    getStockActivity,

    // Stock Adjustments
    createStockAdjustment
};
