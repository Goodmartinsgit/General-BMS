const express = require('express');
const router = express.Router();
const {
    createSale,
    getAllSales,
    getSaleById,
    reverseSale,
    unreverseSale,
    deleteSale,
    addSaleComment,
    getSaleComments,
    getSaleStatistics
} = require('../controllers/salesController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

router.use(authenticateToken);

// ============================================================================
// SALE ROUTES
// ============================================================================

// Get all sales with filtering
router.get('/', authorize('view_sales'), getAllSales);

// Get sale statistics
router.get('/statistics', authorize('view_sales'), getSaleStatistics);

// Get pending confirmations (reversed sales awaiting review)
router.get('/pending-confirmations', authorize('view_sales'), async (req, res) => {
    try {
        const { pool } = require('../config/db');
        const result = await pool.query(`
            SELECT s.*, b.branch_name, c.customer_name, u.full_name as salesperson,
                   rv.full_name as reversed_by_name,
                   CASE WHEN s.reversed_at IS NOT NULL THEN true ELSE false END as is_reversed
            FROM sales s
            JOIN branches b ON s.branch_id = b.id
            LEFT JOIN customers c ON s.customer_id = c.id
            LEFT JOIN users u ON s.processed_by = u.id
            LEFT JOIN users rv ON s.reversed_by = rv.id
            WHERE s.reversed_at IS NOT NULL
               OR s.status IN ('Pending', 'Awaiting Confirmation', 'On Hold')
            ORDER BY s.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Pending confirmations error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get cancelled/reversed sales
router.get('/cancelled', authorize('view_sales'), async (req, res) => {
    try {
        const { pool } = require('../config/db');
        const result = await pool.query(`
            SELECT s.*, b.branch_name, c.customer_name, u.full_name as salesperson,
                   rv.full_name as reversed_by_name,
                   CASE WHEN s.reversed_at IS NOT NULL THEN true ELSE false END as is_reversed
            FROM sales s
            JOIN branches b ON s.branch_id = b.id
            LEFT JOIN customers c ON s.customer_id = c.id
            LEFT JOIN users u ON s.processed_by = u.id
            LEFT JOIN users rv ON s.reversed_by = rv.id
            WHERE s.reversed_at IS NOT NULL
            ORDER BY s.reversed_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Cancelled sales error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single sale by ID
router.get('/:id', authorize('view_sales'), getSaleById);

// Create new sale
router.post('/', authorize('create_sales'), createSale);

// Reverse sale (cancel)
router.post('/:id/reverse', authorize('reverse_sales'), reverseSale);

// Unreverse sale (reactivate)
router.post('/:id/unreverse', authorize('reverse_sales'), unreverseSale);

// Delete sale permanently (restores stock)
router.delete('/:id', authorize('reverse_sales'), deleteSale);

// ============================================================================
// SALE COMMENTS ROUTES
// ============================================================================

// Get sale comments
router.get('/:id/comments', authorize('view_sales'), getSaleComments);

// Add comment to sale
router.post('/:id/comments', authorize('view_sales'), addSaleComment);

module.exports = router;
