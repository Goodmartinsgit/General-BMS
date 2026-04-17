const { query, pool } = require('../config/db');

const getInventoryByBranch = async (req, res) => {
    try {
        const { branchId } = req.params;
        const result = await query(
            `SELECT i.*, p.product_name, p.product_code, p.base_unit,
                    p.reorder_level, p.retail_price, p.cost_price
             FROM inventory i 
             JOIN products p ON i.product_id = p.id 
             WHERE i.branch_id = $1 AND p.deleted_at IS NULL
             ORDER BY p.product_name ASC`,
            [branchId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAllInventory = async (req, res) => {
    try {
        const result = await query(
            `SELECT i.*, p.product_name, p.product_code, p.reorder_level,
                    p.retail_price, p.cost_price, b.branch_name 
             FROM inventory i 
             JOIN products p ON i.product_id = p.id 
             JOIN branches b ON i.branch_id = b.id 
             WHERE b.deleted_at IS NULL AND p.deleted_at IS NULL
             ORDER BY b.branch_name, p.product_name ASC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateStock = async (req, res) => {
    const client = await pool.connect();
    try {
        const {
            product_id, branch_id, variant_id, category_id,
            quantity_change, movement_type, notes
        } = req.body;
        const performed_by = req.user.id;
        const qtyChange = parseInt(quantity_change);

        if (!product_id || isNaN(qtyChange)) {
            return res.status(400).json({ message: 'product_id and valid quantity_change are required' });
        }

        await client.query('BEGIN');

        let quantity_before = 0;
        let quantity_after = 0;
        let variant_name_resolved = null;

        // ── MODE 1: Variant stock ──────────────────────────────────────────
        if (variant_id) {
            if (!branch_id) {
                await client.query('ROLLBACK');
                return res.status(400).json({ message: 'branch_id is required for variant stock updates' });
            }

            // Get variant name for movement record
            const variantRes = await client.query(
                'SELECT variant_name FROM product_variants WHERE id = $1',
                [variant_id]
            );
            variant_name_resolved = variantRes.rows[0]?.variant_name || null;

            // Ensure variant_inventory row exists
            await client.query(
                `INSERT INTO variant_inventory (variant_id, branch_id, quantity_on_hand)
                 VALUES ($1, $2, 0) ON CONFLICT (variant_id, branch_id) DO NOTHING`,
                [variant_id, branch_id]
            );

            // Lock and read current stock
            const currentResult = await client.query(
                'SELECT quantity_on_hand FROM variant_inventory WHERE variant_id = $1 AND branch_id = $2 FOR UPDATE',
                [variant_id, branch_id]
            );
            quantity_before = parseInt(currentResult.rows[0]?.quantity_on_hand) || 0;
            quantity_after = quantity_before + qtyChange;

            if (quantity_after < 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ message: 'Adjustment would result in negative stock' });
            }

            // Update variant inventory
            await client.query(
                'UPDATE variant_inventory SET quantity_on_hand = $1, updated_at = NOW() WHERE variant_id = $2 AND branch_id = $3',
                [quantity_after, variant_id, branch_id]
            );

        // ── MODE 2: Category assignment stock ──────────────────────────────
        } else if (category_id) {
            // Lock and read current stock_allocated
            const currentResult = await client.query(
                'SELECT stock_allocated FROM product_category_assignments WHERE product_id = $1 AND category_id = $2 FOR UPDATE',
                [product_id, category_id]
            );

            if (currentResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ message: 'Product-category assignment not found' });
            }

            quantity_before = parseInt(currentResult.rows[0].stock_allocated) || 0;
            quantity_after = quantity_before + qtyChange;

            if (quantity_after < 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ message: 'Adjustment would result in negative stock' });
            }

            // Update category assignment stock
            await client.query(
                'UPDATE product_category_assignments SET stock_allocated = $1, updated_at = NOW() WHERE product_id = $2 AND category_id = $3',
                [quantity_after, product_id, category_id]
            );

        // ── MODE 3: Simple inventory (default) ────────────────────────────
        } else {
            if (!branch_id) {
                await client.query('ROLLBACK');
                return res.status(400).json({ message: 'branch_id is required for inventory stock updates' });
            }

            const currentResult = await client.query(
                'SELECT quantity_on_hand FROM inventory WHERE product_id = $1 AND branch_id = $2 FOR UPDATE',
                [product_id, branch_id]
            );

            if (currentResult.rows.length > 0) {
                quantity_before = parseInt(currentResult.rows[0].quantity_on_hand) || 0;
            } else {
                // Initialize inventory if not exists
                await client.query(
                    'INSERT INTO inventory (product_id, branch_id, quantity_on_hand) VALUES ($1, $2, 0)',
                    [product_id, branch_id]
                );
            }

            quantity_after = quantity_before + qtyChange;

            if (quantity_after < 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ message: 'Adjustment would result in negative stock' });
            }

            // Update inventory
            await client.query(
                'UPDATE inventory SET quantity_on_hand = $1, updated_at = NOW() WHERE product_id = $2 AND branch_id = $3',
                [quantity_after, product_id, branch_id]
            );
        }

        // ── Compute combined total stock across ALL sources ────────────────
        const totalRes = await client.query(
            `SELECT
                COALESCE((SELECT SUM(quantity_on_hand) FROM inventory WHERE product_id = $1), 0) +
                COALESCE((SELECT SUM(vi.quantity_on_hand) FROM variant_inventory vi JOIN product_variants pv ON vi.variant_id = pv.id WHERE pv.product_id = $1), 0) +
                COALESCE((SELECT SUM(pca.stock_allocated) FROM product_category_assignments pca WHERE pca.product_id = $1 AND pca.is_leaf = true), 0)
             AS total`,
            [product_id]
        );
        const totalStockAfter = parseInt(totalRes.rows[0].total) || 0;

        // ── Record stock movement ──────────────────────────────────────────
        await client.query(
            `INSERT INTO stock_movements (
                product_id, branch_id, movement_type, quantity,
                quantity_before, quantity_after, notes, performed_by,
                variant_id, variant_name, category_id, total_stock_after
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
                product_id, branch_id || null, movement_type, qtyChange,
                quantity_before, quantity_after, notes, performed_by,
                variant_id || null, variant_name_resolved, category_id || null,
                totalStockAfter
            ]
        );

        await client.query('COMMIT');
        res.json({
            message: 'Stock updated successfully',
            quantity_before,
            quantity_after,
            total_stock_after: totalStockAfter
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error in updateStock:', err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};

const getStockMovements = async (req, res) => {
    try {
        const { productId, branchId } = req.query;
        let q = `SELECT sm.*, p.product_name, b.branch_name, u.full_name as user_name 
                 FROM stock_movements sm 
                 JOIN products p ON sm.product_id = p.id 
                 JOIN branches b ON sm.branch_id = b.id 
                 LEFT JOIN users u ON sm.performed_by = u.id 
                 WHERE 1=1`;
        const params = [];

        if (productId) {
            params.push(productId);
            q += ` AND sm.product_id = $${params.length}`;
        }
        if (branchId) {
            params.push(branchId);
            q += ` AND sm.branch_id = $${params.length}`;
        }

        q += ` ORDER BY sm.created_at DESC LIMIT 100`;

        const result = await query(q, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getInventoryByBranch, getAllInventory, updateStock, getStockMovements };
