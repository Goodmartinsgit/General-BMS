const { pool } = require('../config/db');

// ============================================================================
// RECYCLE BIN MANAGEMENT
// ============================================================================

/**
 * Get All Deleted Items
 * Retrieves soft-deleted items from all supported tables
 */
const getAllDeletedItems = async (req, res) => {
    try {
        const { entity_type, startDate, endDate, limit = 100, offset = 0 } = req.query;

        let query = `
            SELECT * FROM recycle_bin
            WHERE 1=1
        `;
        const params = [];

        if (entity_type) {
            params.push(entity_type);
            query += ` AND entity_type = $${params.length}`;
        }
        if (startDate) {
            params.push(startDate);
            query += ` AND deleted_at >= $${params.length}`;
        }
        if (endDate) {
            params.push(endDate);
            query += ` AND deleted_at <= $${params.length}`;
        }

        query += ' ORDER BY deleted_at DESC';

        // Add pagination
        params.push(limit);
        query += ` LIMIT $${params.length}`;
        params.push(offset);
        query += ` OFFSET $${params.length}`;

        const result = await pool.query(query, params);

        // Get count for pagination
        let countQuery = 'SELECT COUNT(*) FROM recycle_bin WHERE 1=1';
        const countParams = [];

        if (entity_type) {
            countParams.push(entity_type);
            countQuery += ` AND entity_type = $${countParams.length}`;
        }
        if (startDate) {
            countParams.push(startDate);
            countQuery += ` AND deleted_at >= $${countParams.length}`;
        }
        if (endDate) {
            countParams.push(endDate);
            countQuery += ` AND deleted_at <= $${countParams.length}`;
        }

        const countResult = await pool.query(countQuery, countParams);

        res.json({
            items: result.rows,
            total: parseInt(countResult.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Get Deleted Items by Entity Type
 */
const getDeletedItemsByEntity = async (req, res) => {
    try {
        const { entityType } = req.params;
        const { limit = 100, offset = 0 } = req.query;

        const result = await pool.query(
            `SELECT * FROM recycle_bin
             WHERE entity_type = $1
             ORDER BY deleted_at DESC
             LIMIT $2 OFFSET $3`,
            [entityType, limit, offset]
        );

        const countResult = await pool.query(
            'SELECT COUNT(*) FROM recycle_bin WHERE entity_type = $1',
            [entityType]
        );

        res.json({
            items: result.rows,
            total: parseInt(countResult.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Restore Deleted Item
 * Removes item from recycle bin and restores it to original table
 */
const restoreItem = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const restored_by = req.user.id;

        await client.query('BEGIN');

        // Get recycle bin record
        const recycleBinResult = await client.query(
            'SELECT * FROM recycle_bin WHERE id = $1 FOR UPDATE',
            [id]
        );

        if (recycleBinResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Item not found in recycle bin' });
        }

        const item = recycleBinResult.rows[0];
        const { entity_type, entity_id, entity_data } = item;

        // Restore based on entity type
        switch (entity_type) {
            case 'product':
                // Remove from recycle bin
                await client.query('DELETE FROM recycle_bin WHERE id = $1', [id]);

                // Update product to mark as not deleted (if soft delete flag exists)
                // Note: This assumes products table has a deleted_at column
                await client.query(
                    'UPDATE products SET deleted_at = NULL, updated_at = NOW() WHERE id = $1',
                    [entity_id]
                );
                break;

            case 'customer':
                await client.query('DELETE FROM recycle_bin WHERE id = $1', [id]);
                await client.query(
                    'UPDATE customers SET deleted_at = NULL, updated_at = NOW() WHERE id = $1',
                    [entity_id]
                );
                break;

            case 'supplier':
                await client.query('DELETE FROM recycle_bin WHERE id = $1', [id]);
                await client.query(
                    'UPDATE suppliers SET deleted_at = NULL, updated_at = NOW() WHERE id = $1',
                    [entity_id]
                );
                break;

            case 'promotion':
                await client.query('DELETE FROM recycle_bin WHERE id = $1', [id]);
                await client.query(
                    'UPDATE promotions SET deleted_at = NULL, updated_at = NOW() WHERE id = $1',
                    [entity_id]
                );
                break;

            default:
                throw new Error(`Restore not implemented for entity type: ${entity_type}`);
        }

        // Record restoration in audit trail
        await client.query(
            `INSERT INTO deletion_audit_trail (
                entity_type, entity_id, action, performed_by, notes
            )
             VALUES ($1, $2, 'restored', $3, $4)`,
            [entity_type, entity_id, restored_by, `Restored from recycle bin`]
        );

        await client.query('COMMIT');

        res.json({
            message: 'Item restored successfully',
            entity_type,
            entity_id
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: err.message || 'Server error' });
    } finally {
        client.release();
    }
};

/**
 * Permanently Delete Item (Purge)
 * Removes item from recycle bin permanently
 */
const purgeItem = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const purged_by = req.user.id;

        await client.query('BEGIN');

        // Get recycle bin record
        const recycleBinResult = await client.query(
            'SELECT * FROM recycle_bin WHERE id = $1 FOR UPDATE',
            [id]
        );

        if (recycleBinResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Item not found in recycle bin' });
        }

        const item = recycleBinResult.rows[0];
        const { entity_type, entity_id, entity_data } = item;

        // Record purge in audit trail before deletion
        await client.query(
            `INSERT INTO deletion_audit_trail (
                entity_type, entity_id, action, performed_by, entity_data_snapshot
            )
             VALUES ($1, $2, 'purged', $3, $4)`,
            [entity_type, entity_id, purged_by, entity_data]
        );

        // Log to purge logs
        await client.query(
            `INSERT INTO purge_logs (
                entity_type, entity_id, entity_data_snapshot, purged_by
            )
             VALUES ($1, $2, $3, $4)`,
            [entity_type, entity_id, entity_data, purged_by]
        );

        // Remove from recycle bin
        await client.query('DELETE FROM recycle_bin WHERE id = $1', [id]);

        // Permanently delete from original table (if not already deleted)
        switch (entity_type) {
            case 'product':
                await client.query('DELETE FROM products WHERE id = $1', [entity_id]);
                break;
            case 'customer':
                await client.query('DELETE FROM customers WHERE id = $1', [entity_id]);
                break;
            case 'supplier':
                await client.query('DELETE FROM suppliers WHERE id = $1', [entity_id]);
                break;
            case 'promotion':
                await client.query('DELETE FROM promotions WHERE id = $1', [entity_id]);
                break;
            default:
                // For other entity types, just remove from recycle bin
                break;
        }

        await client.query('COMMIT');

        res.json({
            message: 'Item permanently deleted',
            entity_type,
            entity_id
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: err.message || 'Server error' });
    } finally {
        client.release();
    }
};

/**
 * Get Deletion Audit Trail
 */
const getDeletionAuditTrail = async (req, res) => {
    try {
        const { entityType, entityId, action, startDate, endDate, limit = 100, offset = 0 } = req.query;

        let query = `
            SELECT dat.*, u.full_name as performed_by_name
            FROM deletion_audit_trail dat
            LEFT JOIN users u ON dat.performed_by = u.id
            WHERE 1=1
        `;
        const params = [];

        if (entityType) {
            params.push(entityType);
            query += ` AND dat.entity_type = $${params.length}`;
        }
        if (entityId) {
            params.push(entityId);
            query += ` AND dat.entity_id = $${params.length}`;
        }
        if (action) {
            params.push(action);
            query += ` AND dat.action = $${params.length}`;
        }
        if (startDate) {
            params.push(startDate);
            query += ` AND dat.created_at >= $${params.length}`;
        }
        if (endDate) {
            params.push(endDate);
            query += ` AND dat.created_at <= $${params.length}`;
        }

        query += ' ORDER BY dat.created_at DESC';

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

/**
 * Get Purge Logs
 */
const getPurgeLogs = async (req, res) => {
    try {
        const { entityType, startDate, endDate, limit = 100, offset = 0 } = req.query;

        let query = `
            SELECT pl.*, u.full_name as purged_by_name
            FROM purge_logs pl
            LEFT JOIN users u ON pl.purged_by = u.id
            WHERE 1=1
        `;
        const params = [];

        if (entityType) {
            params.push(entityType);
            query += ` AND pl.entity_type = $${params.length}`;
        }
        if (startDate) {
            params.push(startDate);
            query += ` AND pl.purged_at >= $${params.length}`;
        }
        if (endDate) {
            params.push(endDate);
            query += ` AND pl.purged_at <= $${params.length}`;
        }

        query += ' ORDER BY pl.purged_at DESC';

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

/**
 * Auto-Purge Old Items
 * Automatically purge items older than specified days
 */
const autoPurge = async (req, res) => {
    const client = await pool.connect();
    try {
        const { days_old = 30 } = req.body;
        const purged_by = req.user.id;

        await client.query('BEGIN');

        // Get items older than specified days
        const oldItems = await client.query(
            `SELECT * FROM recycle_bin
             WHERE deleted_at < NOW() - INTERVAL '${days_old} days'`,
            []
        );

        let purged_count = 0;

        for (const item of oldItems.rows) {
            // Log to purge logs
            await client.query(
                `INSERT INTO purge_logs (
                    entity_type, entity_id, entity_data_snapshot, purged_by, purge_reason
                )
                 VALUES ($1, $2, $3, $4, $5)`,
                [item.entity_type, item.entity_id, item.entity_data, purged_by, `Auto-purge: older than ${days_old} days`]
            );

            // Record in audit trail
            await client.query(
                `INSERT INTO deletion_audit_trail (
                    entity_type, entity_id, action, performed_by, notes
                )
                 VALUES ($1, $2, 'auto_purged', $3, $4)`,
                [item.entity_type, item.entity_id, purged_by, `Auto-purge: older than ${days_old} days`]
            );

            // Remove from recycle bin
            await client.query('DELETE FROM recycle_bin WHERE id = $1', [item.id]);

            purged_count++;
        }

        await client.query('COMMIT');

        res.json({
            message: 'Auto-purge completed successfully',
            purged_count,
            days_old
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: err.message || 'Server error' });
    } finally {
        client.release();
    }
};

/**
 * Get Recycle Bin Statistics
 */
const getStatistics = async (req, res) => {
    try {
        // Total items by entity type
        const byTypeResult = await pool.query(
            `SELECT entity_type, COUNT(*) as count
             FROM recycle_bin
             GROUP BY entity_type`
        );

        // Total items
        const totalResult = await pool.query('SELECT COUNT(*) as total FROM recycle_bin');

        // Items older than 30 days (candidates for auto-purge)
        const oldItemsResult = await pool.query(
            `SELECT COUNT(*) as count
             FROM recycle_bin
             WHERE deleted_at < NOW() - INTERVAL '30 days'`
        );

        // Items deleted in last 7 days
        const recentResult = await pool.query(
            `SELECT COUNT(*) as count
             FROM recycle_bin
             WHERE deleted_at >= NOW() - INTERVAL '7 days'`
        );

        res.json({
            total_items: parseInt(totalResult.rows[0].total),
            by_entity_type: byTypeResult.rows,
            old_items_count: parseInt(oldItemsResult.rows[0].count),
            recent_deletions: parseInt(recentResult.rows[0].count)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getAllDeletedItems,
    getDeletedItemsByEntity,
    restoreItem,
    purgeItem,
    getDeletionAuditTrail,
    getPurgeLogs,
    autoPurge,
    getStatistics
};
