const express = require('express');
const router = express.Router();
const {
    createSale,
    getAllSales,
    getSaleById,
    reverseSale,
    unreverseSale,
    addSaleComment,
    getSaleComments,
    getSaleStatistics
} = require('../controllers/salesController');
const authenticateToken = require('../middleware/authMiddleware');

router.use(authenticateToken);

// ============================================================================
// SALE ROUTES
// ============================================================================

// Get all sales with filtering
router.get('/', getAllSales);

// Get sale statistics
router.get('/statistics', getSaleStatistics);

// Get single sale by ID
router.get('/:id', getSaleById);

// Create new sale
router.post('/', createSale);

// Reverse sale (cancel)
router.post('/:id/reverse', reverseSale);

// Unreverse sale (reactivate)
router.post('/:id/unreverse', unreverseSale);

// ============================================================================
// SALE COMMENTS ROUTES
// ============================================================================

// Get sale comments
router.get('/:id/comments', getSaleComments);

// Add comment to sale
router.post('/:id/comments', addSaleComment);

module.exports = router;
