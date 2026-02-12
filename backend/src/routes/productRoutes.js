const express = require('express');
const router = express.Router();
const { getAllProducts, createProduct } = require('../controllers/productController');
const authenticateToken = require('../middleware/authMiddleware');

router.get('/', authenticateToken, getAllProducts);
router.post('/', authenticateToken, createProduct);

module.exports = router;
