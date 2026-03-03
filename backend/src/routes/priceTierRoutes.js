const express = require('express');
const router = express.Router();
const { getAllPriceTiers, createPriceTier, updatePriceTier, deletePriceTier } = require('../controllers/priceTierController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

router.use(authenticateToken);

router.get('/', authorize('view_price_tiers'), getAllPriceTiers);
router.post('/', authorize('manage_price_tiers'), createPriceTier);
router.put('/:id', authorize('manage_price_tiers'), updatePriceTier);
router.delete('/:id', authorize('manage_price_tiers'), deletePriceTier);

module.exports = router;
