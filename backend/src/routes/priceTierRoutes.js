const express = require('express');
const router = express.Router();
const { getAllPriceTiers, createPriceTier, updatePriceTier, deletePriceTier } = require('../controllers/priceTierController');
const authenticateToken = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/', getAllPriceTiers);
router.post('/', createPriceTier);
router.put('/:id', updatePriceTier);
router.delete('/:id', deletePriceTier);

module.exports = router;
