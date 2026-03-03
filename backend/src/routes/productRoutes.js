const express = require('express');
const router = express.Router();
const {
  getAllProducts, getProductById, createProduct, updateProduct, deleteProduct,
  getProductStatistics, getFeaturedProducts, getLowStockProducts,
  getBrands, createBrand, updateBrand, deleteBrand,
  getCategories, createCategory, updateCategory, deleteCategory,
} = require('../controllers/productController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

// Product listing & statistics (static routes BEFORE /:id)
router.get('/', authenticateToken, authorize('view_products'), getAllProducts);
router.get('/statistics', authenticateToken, authorize('view_products'), getProductStatistics);
router.get('/featured', authenticateToken, authorize('view_products'), getFeaturedProducts);
router.get('/low-stock', authenticateToken, authorize('view_products'), getLowStockProducts);

// Brands
router.get('/brands', authenticateToken, authorize('view_products'), getBrands);
router.post('/brands', authenticateToken, authorize('manage_products'), createBrand);
router.put('/brands/:id', authenticateToken, authorize('manage_products'), updateBrand);
router.delete('/brands/:id', authenticateToken, authorize('manage_products'), deleteBrand);

// Categories
router.get('/categories', authenticateToken, authorize('view_products'), getCategories);
router.post('/categories', authenticateToken, authorize('manage_products'), createCategory);
router.put('/categories/:id', authenticateToken, authorize('manage_products'), updateCategory);
router.delete('/categories/:id', authenticateToken, authorize('manage_products'), deleteCategory);

// Single product CRUD (parameterized routes LAST)
router.get('/:id', authenticateToken, authorize('view_products'), getProductById);
router.post('/', authenticateToken, authorize('manage_products'), createProduct);
router.put('/:id', authenticateToken, authorize('manage_products'), updateProduct);
router.delete('/:id', authenticateToken, authorize('manage_products'), deleteProduct);

module.exports = router;
