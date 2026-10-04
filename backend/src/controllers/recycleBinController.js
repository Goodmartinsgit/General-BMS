const { pool } = require('../config/db');

// ============================================================================
// RECYCLE BIN MANAGEMENT
// ============================================================================

/**
 * Backfill orphaned soft-deleted items into recycle_bin.
 * Finds items in source tables that have deleted_at set but no corresponding
 * recycle_bin entry, and creates one. This handles items deleted before the
 * recycle_bin tracking was added.
 */
async function backfillOrphanedItems() {
    try {
        // Users — exclude password_hash from snapshot
        await pool.query(`
            INSERT INTO recycle_bin (entity_type, entity_id, entity_data, deleted_at, restore_deadline)
            SELECT 'user',
                   u.id::varchar,
                   jsonb_build_object(
                       'id', u.id, 'email', u.email, 'full_name', u.full_name,
                       'phone_number', u.phone_number, 'role_id', u.role_id,
                       'is_active', u.is_active, 'status', u.status,
                       'created_at', u.created_at, 'deleted_at', u.deleted_at,
                       'role_name', r.role_name
                   ),
                   u.deleted_at,
                   u.deleted_at + INTERVAL '30 days'
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.deleted_at IS NOT NULL
              AND NOT EXISTS (
                  SELECT 1 FROM recycle_bin rb
                  WHERE rb.entity_type = 'user' AND rb.entity_id = u.id::varchar
              )
        `);

        // Customers
        await pool.query(`
            INSERT INTO recycle_bin (entity_type, entity_id, entity_data, deleted_at, restore_deadline)
            SELECT 'customer',
                   c.id::varchar,
                   to_jsonb(c),
                   c.deleted_at,
                   c.deleted_at + INTERVAL '30 days'
            FROM customers c
            WHERE c.deleted_at IS NOT NULL
              AND NOT EXISTS (
                  SELECT 1 FROM recycle_bin rb
                  WHERE rb.entity_type = 'customer' AND rb.entity_id = c.id::varchar
              )
        `);

        // Branches
        await pool.query(`
            INSERT INTO recycle_bin (entity_type, entity_id, entity_data, deleted_at, restore_deadline)
            SELECT 'branch',
                   b.id::varchar,
                   to_jsonb(b),
                   b.deleted_at,
                   b.deleted_at + INTERVAL '30 days'
            FROM branches b
            WHERE b.deleted_at IS NOT NULL
              AND NOT EXISTS (
                  SELECT 1 FROM recycle_bin rb
                  WHERE rb.entity_type = 'branch' AND rb.entity_id = b.id::varchar
              )
        `);

        // Products (most already tracked, but catch any orphans)
        await pool.query(`
            INSERT INTO recycle_bin (entity_type, entity_id, entity_data, deleted_at, restore_deadline)
            SELECT 'product',
                   p.id::varchar,
                   to_jsonb(p),
                   p.deleted_at,
                   p.deleted_at + INTERVAL '30 days'
            FROM products p
            WHERE p.deleted_at IS NOT NULL
              AND NOT EXISTS (
                  SELECT 1 FROM recycle_bin rb
                  WHERE rb.entity_type = 'product' AND rb.entity_id = p.id::varchar
              )
        `);
    } catch (err) {
        // Non-fatal — log and continue so the recycle bin still loads
        console.error('Backfill orphaned items warning:', err.message);
    }
}

/**
 * Get All Deleted Items
 * Retrieves soft-deleted items from all supported tables
 */
const getAllDeletedItems = async (req, res) => {
    try {
        // Sync any orphaned soft-deleted records into recycle_bin first
        await backfillOrphanedItems();

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

            case 'user':
                await client.query('DELETE FROM recycle_bin WHERE id = $1', [id]);
                await client.query(
                    `UPDATE users SET deleted_at = NULL, is_active = true, status = 'ACTIVE', updated_at = NOW() WHERE id = $1`,
                    [entity_id]
                );
                break;

            case 'customer':
                await client.query('DELETE FROM recycle_bin WHERE id = $1', [id]);
                await client.query(
                    'UPDATE customers SET deleted_at = NULL, is_active = true, updated_at = NOW() WHERE id = $1',
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

            case 'branch':
                await client.query('DELETE FROM recycle_bin WHERE id = $1', [id]);
                await client.query(
                    'UPDATE branches SET deleted_at = NULL, is_active = true, updated_at = NOW() WHERE id = $1',
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
        res.status(500).json({ message: 'Server error' });
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

        // Try to hard-delete from source table (may fail if FK references exist)
        const deleteMap = {
            product: 'products',
            user: 'users',
            customer: 'customers',
            supplier: 'suppliers',
            branch: 'branches',
            promotion: 'promotions'
        };
        if (deleteMap[entity_type]) {
            try {
                await client.query('SAVEPOINT try_hard_delete');
                await client.query(`DELETE FROM ${deleteMap[entity_type]} WHERE id = $1`, [entity_id]);
                await client.query('RELEASE SAVEPOINT try_hard_delete');
            } catch (fkErr) {
                await client.query('ROLLBACK TO SAVEPOINT try_hard_delete');
                // FK constraint — leave soft-deleted record, it's already invisible
                if (fkErr.code !== '23503') throw fkErr;
            }
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
        res.status(500).json({ message: 'Server error' });
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
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};

/**
 * Get Recycle Bin Statistics
 */
const getStatistics = async (req, res) => {
    try {
        // Sync orphaned items first
        await backfillOrphanedItems();
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

/**
 * Bulk Purge Items
 * Permanently delete multiple items from recycle bin
 */
const bulkPurge = async (req, res) => {
    const client = await pool.connect();
    try {
        const { items } = req.body; // [{ type, id }, ...]
        const purged_by = req.user.id;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'No items provided' });
        }

        await client.query('BEGIN');

        let purged_count = 0;

        for (const item of items) {
            const recycleBinResult = await client.query(
                'SELECT * FROM recycle_bin WHERE id = $1',
                [item.id]
            );

            if (recycleBinResult.rows.length === 0) continue;

            const rbItem = recycleBinResult.rows[0];
            const { entity_type, entity_id, entity_data } = rbItem;

            // Record in audit trail
            await client.query(
                `INSERT INTO deletion_audit_trail (entity_type, entity_id, action, performed_by, entity_data_snapshot)
                 VALUES ($1, $2, 'purged', $3, $4)`,
                [entity_type, entity_id, purged_by, entity_data]
            );

            // Log to purge logs
            await client.query(
                `INSERT INTO purge_logs (entity_type, entity_id, entity_data_snapshot, purged_by)
                 VALUES ($1, $2, $3, $4)`,
                [entity_type, entity_id, entity_data, purged_by]
            );

            // Remove from recycle bin
            await client.query('DELETE FROM recycle_bin WHERE id = $1', [item.id]);

            // Try to hard-delete from source table (may fail if FK references exist)
            const deleteMap = {
                product: 'products',
                user: 'users',
                customer: 'customers',
                supplier: 'suppliers',
                branch: 'branches',
                promotion: 'promotions'
            };
            if (deleteMap[entity_type]) {
                try {
                    await client.query(`SAVEPOINT try_hard_delete_${purged_count}`);
                    await client.query(`DELETE FROM ${deleteMap[entity_type]} WHERE id = $1`, [entity_id]);
                    await client.query(`RELEASE SAVEPOINT try_hard_delete_${purged_count}`);
                } catch (fkErr) {
                    await client.query(`ROLLBACK TO SAVEPOINT try_hard_delete_${purged_count}`);
                    // FK constraint — leave soft-deleted record, it's already invisible
                    if (fkErr.code !== '23503') throw fkErr;
                }
            }

            purged_count++;
        }

        await client.query('COMMIT');

        res.json({ message: `${purged_count} items permanently deleted`, purged_count });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};

/**
 * Bulk Restore Items
 * Restore multiple items from recycle bin
 */
const bulkRestore = async (req, res) => {
    const client = await pool.connect();
    try {
        const { items } = req.body; // [{ type, id }, ...]
        const restored_by = req.user.id;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'No items provided' });
        }

        await client.query('BEGIN');

        let restored_count = 0;

        const restoreMap = {
            product:  { table: 'products',   extra: '' },
            user:     { table: 'users',      extra: ", is_active = true, status = 'ACTIVE'" },
            customer: { table: 'customers',  extra: ', is_active = true' },
            supplier: { table: 'suppliers',  extra: '' },
            branch:   { table: 'branches',   extra: ', is_active = true' },
            promotion:{ table: 'promotions', extra: '' }
        };

        for (const item of items) {
            const recycleBinResult = await client.query(
                'SELECT * FROM recycle_bin WHERE id = $1',
                [item.id]
            );

            if (recycleBinResult.rows.length === 0) continue;

            const rbItem = recycleBinResult.rows[0];
            const { entity_type, entity_id } = rbItem;
            const restoreConfig = restoreMap[entity_type];

            if (!restoreConfig) continue;

            // Remove from recycle bin
            await client.query('DELETE FROM recycle_bin WHERE id = $1', [item.id]);

            // Restore in source table
            await client.query(
                `UPDATE ${restoreConfig.table} SET deleted_at = NULL${restoreConfig.extra}, updated_at = NOW() WHERE id = $1`,
                [entity_id]
            );

            // Record in audit trail
            await client.query(
                `INSERT INTO deletion_audit_trail (entity_type, entity_id, action, performed_by, notes)
                 VALUES ($1, $2, 'restored', $3, 'Bulk restored from recycle bin')`,
                [entity_type, entity_id, restored_by]
            );

            restored_count++;
        }

        await client.query('COMMIT');

        res.json({ message: `${restored_count} items restored`, restored_count });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};

/**
 * Empty Recycle Bin
 * Permanently delete ALL items from recycle bin
 */
const emptyBin = async (req, res) => {
    const client = await pool.connect();
    try {
        const purged_by = req.user.id;

        await client.query('BEGIN');

        // Get all items
        const allItems = await client.query('SELECT * FROM recycle_bin');

        const deleteMap = {
            product: 'products',
            user: 'users',
            customer: 'customers',
            supplier: 'suppliers',
            branch: 'branches',
            promotion: 'promotions'
        };

        for (const item of allItems.rows) {
            // Record in audit trail
            await client.query(
                `INSERT INTO deletion_audit_trail (entity_type, entity_id, action, performed_by, entity_data_snapshot)
                 VALUES ($1, $2, 'purged', $3, $4)`,
                [item.entity_type, item.entity_id, purged_by, item.entity_data]
            );

            // Log to purge logs
            await client.query(
                `INSERT INTO purge_logs (entity_type, entity_id, entity_data_snapshot, purged_by)
                 VALUES ($1, $2, $3, $4)`,
                [item.entity_type, item.entity_id, item.entity_data, purged_by]
            );

            // Try to hard-delete from source table (may fail if FK references exist)
            if (deleteMap[item.entity_type]) {
                try {
                    await client.query(`SAVEPOINT try_empty_${item.id}`);
                    await client.query(
                        `DELETE FROM ${deleteMap[item.entity_type]} WHERE id = $1`,
                        [item.entity_id]
                    );
                    await client.query(`RELEASE SAVEPOINT try_empty_${item.id}`);
                } catch (fkErr) {
                    await client.query(`ROLLBACK TO SAVEPOINT try_empty_${item.id}`);
                    // FK constraint — leave soft-deleted record, it's already invisible
                    if (fkErr.code !== '23503') throw fkErr;
                }
            }
        }

        // Clear recycle bin
        await client.query('DELETE FROM recycle_bin');

        await client.query('COMMIT');

        res.json({ message: `Recycle bin emptied. ${allItems.rows.length} items permanently deleted.`, purged_count: allItems.rows.length });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};

module.exports = {
    getAllDeletedItems,
    getDeletedItemsByEntity,
    restoreItem,
    purgeItem,
    bulkPurge,
    bulkRestore,
    emptyBin,
    getDeletionAuditTrail,
    getPurgeLogs,
    autoPurge,
    getStatistics
};
