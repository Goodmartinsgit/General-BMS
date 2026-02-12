const express = require('express');
const router = express.Router();
const variantController = require('../controllers/variantController');

// ============================================================================
// VARIANT OPTIONS ROUTES
// ============================================================================

// Get all variant options
router.get('/options', variantController.getAllVariantOptions);

// Create variant option
router.post('/options', variantController.createVariantOption);

// Update variant option
router.put('/options/:id', variantController.updateVariantOption);

// Delete variant option
router.delete('/options/:id', variantController.deleteVariantOption);

// ============================================================================
// VARIANT VALUES ROUTES
// ============================================================================

// Get variant values for an option
router.get('/options/:optionId/values', variantController.getVariantValues);

// Create variant value
router.post('/options/:optionId/values', variantController.createVariantValue);

// Bulk create variant values
router.post('/options/:optionId/values/bulk', variantController.bulkCreateVariantValues);

// Update variant value
router.put('/values/:id', variantController.updateVariantValue);

// Delete variant value
router.delete('/values/:id', variantController.deleteVariantValue);

// ============================================================================
// PRODUCT VARIANTS ROUTES (nested under products)
// ============================================================================

// Get all variants for a product
router.get('/products/:productId/variants', variantController.getProductVariants);

// Create product variant
router.post('/products/:productId/variants', variantController.createProductVariant);

// Bulk generate variants from combinations
router.post('/products/:productId/variants/generate', variantController.generateProductVariants);

// Update product variant
router.put('/:id', variantController.updateProductVariant);

// Delete product variant
router.delete('/:id', variantController.deleteProductVariant);

// ============================================================================
// VARIANT INVENTORY ROUTES
// ============================================================================

// Get variant inventory by branch
router.get('/:variantId/inventory', variantController.getVariantInventory);

// Update variant inventory for a branch
router.put('/:variantId/inventory/:branchId', variantController.updateVariantInventory);

module.exports = router;
