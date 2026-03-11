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
  getListingLevel,
  setListingLevel,
} = require('../controllers/categoryController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

// Static routes first
router.get('/', authenticateToken, authorize('view_products'), getCategories);
router.get('/tree', authenticateToken, authorize('view_products'), getCategoryTree);
router.get('/levels', authenticateToken, authorize('view_products'), getCategoryLevels);
router.get('/listing-level', authenticateToken, authorize('view_products'), getListingLevel);
router.put('/listing-level', authenticateToken, authorize('manage_products'), setListingLevel);

// Parameterized routes
router.get('/:id', authenticateToken, authorize('view_products'), getCategoryById);
router.post('/', authenticateToken, authorize('manage_products'), createCategory);
router.put('/:id', authenticateToken, authorize('manage_products'), updateCategory);
router.delete('/:id', authenticateToken, authorize('manage_products'), deleteCategory);

module.exports = router;
