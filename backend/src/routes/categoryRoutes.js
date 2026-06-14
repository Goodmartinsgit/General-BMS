const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategoryTree,
  getCategoryLevels,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryDeletePreview,
  getProductAssignments,
  saveProductAssignments,
  getSubcategoryTree,
  getCategoriesByLevel,
  getListingLevelCategories,
} = require('../controllers/categoryController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

// Static routes first
router.get('/', authenticateToken, authorize(['view_products', 'view_categories'], { match: 'any' }), getCategories);
router.get('/tree', authenticateToken, authorize(['view_products', 'view_categories'], { match: 'any' }), getCategoryTree);
router.get('/levels', authenticateToken, authorize(['view_products', 'view_categories'], { match: 'any' }), getCategoryLevels);

// Category assignments (product stock/price per node)
router.get('/assignments/:productId', authenticateToken, authorize(['view_products', 'view_categories'], { match: 'any' }), getProductAssignments);
router.post('/assignments/:productId', authenticateToken, authorize(['manage_products', 'update_categories'], { match: 'any' }), saveProductAssignments);

// By-level lookup
router.get('/by-level/:level', authenticateToken, authorize(['view_products', 'view_categories'], { match: 'any' }), getCategoriesByLevel);

// Parameterized routes (must be last)
router.get('/:id/delete-preview', authenticateToken, authorize('delete_categories'), getCategoryDeletePreview);
router.get('/:id', authenticateToken, authorize(['view_products', 'view_categories'], { match: 'any' }), getCategoryById);
router.get('/:id/subtree', authenticateToken, authorize(['view_products', 'view_categories'], { match: 'any' }), getSubcategoryTree);
router.get('/:id/listing-level', authenticateToken, authorize(['view_products', 'view_categories'], { match: 'any' }), getListingLevelCategories);
router.post('/', authenticateToken, authorize('create_categories'), createCategory);
router.put('/:id', authenticateToken, authorize('update_categories'), updateCategory);
router.delete('/:id', authenticateToken, authorize('delete_categories'), deleteCategory);

module.exports = router;
