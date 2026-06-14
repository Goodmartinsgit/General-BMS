const express = require('express');
const router = express.Router();
const {
  getAllProducts, getProductById, createProduct, updateProduct, deleteProduct,
  getProductStatistics, getFeaturedProducts, getLowStockProducts,
  getCategoryGroupInsights, getCategoryGroupBreakdown,
  getBrands, createBrand, updateBrand, deleteBrand,
  getProductColors, addProductColor, updateProductColor, deleteProductColor,
  getProductImages, addProductImage, updateProductImage, deleteProductImage,
  getProductColorInventory, updateColorInventory,
} = require('../controllers/productController');
const {
  getCategories, createCategory, updateCategory, deleteCategory,
} = require('../controllers/categoryController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

// Product listing & statistics (static routes BEFORE /:id)
router.get('/', authenticateToken, authorize('view_products'), getAllProducts);
router.get('/statistics', authenticateToken, authorize('view_products'), getProductStatistics);
router.get('/featured', authenticateToken, authorize('view_products'), getFeaturedProducts);
router.get('/low-stock', authenticateToken, authorize('view_products'), getLowStockProducts);
router.get('/category-groups', authenticateToken, authorize('view_products'), getCategoryGroupInsights);
router.get('/category-groups/:id/breakdown', authenticateToken, authorize('view_products'), getCategoryGroupBreakdown);

// Brands
router.get('/brands', authenticateToken, authorize(['view_products', 'view_brands'], { match: 'any' }), getBrands);
router.post('/brands', authenticateToken, authorize('create_brands'), createBrand);
router.put('/brands/:id', authenticateToken, authorize('update_brands'), updateBrand);
router.delete('/brands/:id', authenticateToken, authorize('delete_brands'), deleteBrand);

// Categories
router.get('/categories', authenticateToken, authorize(['view_products', 'view_categories'], { match: 'any' }), getCategories);
router.post('/categories', authenticateToken, authorize('create_categories'), createCategory);
router.put('/categories/:id', authenticateToken, authorize('update_categories'), updateCategory);
router.delete('/categories/:id', authenticateToken, authorize('delete_categories'), deleteCategory);

// Single product CRUD (parameterized routes LAST)
router.get('/:id', authenticateToken, authorize('view_products'), getProductById);
router.post('/', authenticateToken, authorize('manage_products'), createProduct);
router.put('/:id', authenticateToken, authorize('manage_products'), updateProduct);
router.delete('/:id', authenticateToken, authorize('manage_products'), deleteProduct);

// Product Colors
router.get('/:id/colors', authenticateToken, authorize('view_products'), getProductColors);
router.post('/:id/colors', authenticateToken, authorize('manage_products'), addProductColor);
router.put('/:id/colors/:colorId', authenticateToken, authorize('manage_products'), updateProductColor);
router.delete('/:id/colors/:colorId', authenticateToken, authorize('manage_products'), deleteProductColor);

// Product Images
router.get('/:id/images', authenticateToken, authorize('view_products'), getProductImages);
router.post('/:id/images', authenticateToken, authorize('manage_products'), addProductImage);
router.put('/:id/images/:imageId', authenticateToken, authorize('manage_products'), updateProductImage);
router.delete('/:id/images/:imageId', authenticateToken, authorize('manage_products'), deleteProductImage);

// Color Inventory
router.get('/:id/color-inventory', authenticateToken, authorize('view_products'), getProductColorInventory);
router.post('/color-inventory', authenticateToken, authorize('manage_inventory'), updateColorInventory);

module.exports = router;
