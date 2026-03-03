const express = require('express');
const router = express.Router();
const variantController = require('../controllers/variantController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

router.use(authenticateToken);

// ============================================================================
// VARIANT OPTIONS ROUTES
// ============================================================================

// Get all variant options
router.get('/options', authorize('view_products'), variantController.getAllVariantOptions);

// Create variant option
router.post('/options', authorize('manage_products'), variantController.createVariantOption);

// Update variant option
router.put('/options/:id', authorize('manage_products'), variantController.updateVariantOption);

// Delete variant option
router.delete('/options/:id', authorize('manage_products'), variantController.deleteVariantOption);

// ============================================================================
// VARIANT VALUES ROUTES
// ============================================================================

// Get variant values for an option
router.get('/options/:optionId/values', authorize('view_products'), variantController.getVariantValues);

// Create variant value
router.post('/options/:optionId/values', authorize('manage_products'), variantController.createVariantValue);

// Bulk create variant values
router.post('/options/:optionId/values/bulk', authorize('manage_products'), variantController.bulkCreateVariantValues);

// Update variant value
router.put('/values/:id', authorize('manage_products'), variantController.updateVariantValue);

// Delete variant value
router.delete('/values/:id', authorize('manage_products'), variantController.deleteVariantValue);

// ============================================================================
// PRODUCT VARIANTS ROUTES (nested under products)
// ============================================================================

// Get all variants for a product
router.get('/products/:productId/variants', authorize('view_products'), variantController.getProductVariants);

// Create product variant
router.post('/products/:productId/variants', authorize('manage_products'), variantController.createProductVariant);

// Bulk generate variants from combinations
router.post('/products/:productId/variants/generate', authorize('manage_products'), variantController.generateProductVariants);

// Update product variant
router.put('/:id', authorize('manage_products'), variantController.updateProductVariant);

// Delete product variant
router.delete('/:id', authorize('manage_products'), variantController.deleteProductVariant);

// ============================================================================
// VARIANT INVENTORY ROUTES
// ============================================================================

// Get variant inventory by branch
router.get('/:variantId/inventory', authorize('view_products'), variantController.getVariantInventory);

// Update variant inventory for a branch
router.put('/:variantId/inventory/:branchId', authorize('manage_products'), variantController.updateVariantInventory);

module.exports = router;
