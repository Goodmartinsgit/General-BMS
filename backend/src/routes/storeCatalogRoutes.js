const express = require('express');
const router = express.Router({ mergeParams: true });
const ctrl = require('../controllers/storeCatalogController');

// Products
router.get('/products/featured', ctrl.getFeaturedProducts);
router.get('/products/:productSlug', ctrl.getProductBySlug);
router.get('/products', ctrl.getProducts);

// Categories
router.get('/categories/:categorySlug', ctrl.getProductsByCategory);
router.get('/categories', ctrl.getCategories);

// Bank channels for payment
router.get('/bank-channels', ctrl.getBankChannels);

module.exports = router;
