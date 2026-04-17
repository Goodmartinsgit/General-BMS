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
        const { product_id, branch_id, quantity_change, movement_type, notes } = req.body;
        const performed_by = req.user.id;

        await client.query('BEGIN');

        // 1. Get current stock
        const currentResult = await client.query(
            'SELECT quantity_on_hand FROM inventory WHERE product_id = $1 AND branch_id = $2 FOR UPDATE',
            [product_id, branch_id]
        );

        let quantity_before = 0;
        if (currentResult.rows.length > 0) {
            quantity_before = parseInt(currentResult.rows[0].quantity_on_hand) || 0;
        } else {
            // Initialize inventory if not exists
            await client.query(
                'INSERT INTO inventory (product_id, branch_id, quantity_on_hand) VALUES ($1, $2, 0)',
                [product_id, branch_id]
            );
        }

        const quantity_after = quantity_before + parseInt(quantity_change);

        // 2. Update inventory
        await client.query(
            'UPDATE inventory SET quantity_on_hand = $1, updated_at = NOW() WHERE product_id = $2 AND branch_id = $3',
            [quantity_after, product_id, branch_id]
        );

        // 3. Compute total product stock across all branches
        const totalRes = await client.query(
            `SELECT COALESCE(SUM(quantity_on_hand), 0) AS total FROM inventory WHERE product_id = $1`,
            [product_id]
        );
        const totalStockAfter = parseInt(totalRes.rows[0].total);

        // 4. Record movement
        await client.query(
            `INSERT INTO stock_movements (product_id, branch_id, movement_type, quantity, quantity_before, quantity_after, notes, performed_by, total_stock_after)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [product_id, branch_id, movement_type, quantity_change, quantity_before, quantity_after, notes, performed_by, totalStockAfter]
        );

        await client.query('COMMIT');
        res.json({ message: 'Stock updated successfully', quantity_after });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
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
