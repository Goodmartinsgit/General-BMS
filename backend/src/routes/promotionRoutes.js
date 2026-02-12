const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotionController');

// ============================================================================
// PROMOTION CRUD ROUTES
// ============================================================================

// Get all promotions with filtering
router.get('/', promotionController.getAllPromotions);

// Get statistics
router.get('/statistics', promotionController.getPromotionStatistics);

// Validate promotion code
router.post('/validate', promotionController.validatePromotionCode);

// Apply promotion (internal use by sales)
router.post('/apply', promotionController.applyPromotion);

// Get single promotion by ID or code
router.get('/:identifier', promotionController.getPromotion);

// Get promotion performance
router.get('/:id/performance', promotionController.getPromotionPerformance);

// Create new promotion
router.post('/', promotionController.createPromotion);

// Update promotion
router.put('/:id', promotionController.updatePromotion);

// Toggle promotion status
router.patch('/:id/toggle', promotionController.togglePromotionStatus);

// Delete promotion
router.delete('/:id', promotionController.deletePromotion);

module.exports = router;
