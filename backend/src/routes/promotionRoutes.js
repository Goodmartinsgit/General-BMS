const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotionController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

router.use(authenticateToken);

// ============================================================================
// PROMOTION CRUD ROUTES
// ============================================================================

// Get all promotions with filtering
router.get('/', authorize('view_promotions'), promotionController.getAllPromotions);

// Get statistics
router.get('/statistics', authorize('view_promotions'), promotionController.getPromotionStatistics);

// Validate promotion code
router.post('/validate', authorize('view_promotions'), promotionController.validatePromotionCode);

// Apply promotion (internal use by sales)
router.post('/apply', authorize('manage_promotions'), promotionController.applyPromotion);

// Get single promotion by ID or code
router.get('/:identifier', authorize('view_promotions'), promotionController.getPromotion);

// Get promotion performance
router.get('/:id/performance', authorize('view_promotions'), promotionController.getPromotionPerformance);

// Create new promotion
router.post('/', authorize('manage_promotions'), promotionController.createPromotion);

// Update promotion
router.put('/:id', authorize('manage_promotions'), promotionController.updatePromotion);

// Toggle promotion status
router.patch('/:id/toggle', authorize('manage_promotions'), promotionController.togglePromotionStatus);

// Delete promotion
router.delete('/:id', authorize('manage_promotions'), promotionController.deletePromotion);

module.exports = router;
