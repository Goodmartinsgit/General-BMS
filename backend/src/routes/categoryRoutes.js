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
  getProductAssignments,
  saveProductAssignments,
  getSubcategoryTree,
  getCategoriesByLevel,
} = require('../controllers/categoryController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

// Static routes first
router.get('/', authenticateToken, authorize('view_products'), getCategories);
router.get('/tree', authenticateToken, authorize('view_products'), getCategoryTree);
router.get('/levels', authenticateToken, authorize('view_products'), getCategoryLevels);

// Category assignments (product stock/price per node)
router.get('/assignments/:productId', authenticateToken, authorize('view_products'), getProductAssignments);
router.post('/assignments/:productId', authenticateToken, authorize('manage_products'), saveProductAssignments);

// By-level lookup
router.get('/by-level/:level', authenticateToken, authorize('view_products'), getCategoriesByLevel);

// Parameterized routes (must be last)
router.get('/:id', authenticateToken, authorize('view_products'), getCategoryById);
router.get('/:id/subtree', authenticateToken, authorize('view_products'), getSubcategoryTree);
router.post('/', authenticateToken, authorize('manage_products'), createCategory);
router.put('/:id', authenticateToken, authorize('manage_products'), updateCategory);
router.delete('/:id', authenticateToken, authorize('manage_products'), deleteCategory);

module.exports = router;
