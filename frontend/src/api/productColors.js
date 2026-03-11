import api from './axios';

// ============================================================================
// PRODUCT COLORS API
// ============================================================================

/**
 * Get all colors for a product
 * @param {number} productId - Product ID
 * @returns {Promise<Array>} Array of color objects
 */
export const getProductColors = async (productId) => {
  const response = await api.get(`/products/${productId}/colors`);
  return response.data;
};

/**
 * Add a new color to a product
 * @param {number} productId - Product ID
 * @param {Object} colorData - Color data {color_name, color_code, display_order}
 * @returns {Promise<Object>} Created color object
 */
export const addProductColor = async (productId, colorData) => {
  const response = await api.post(`/products/${productId}/colors`, colorData);
  return response.data;
};

/**
 * Update a product color
 * @param {number} productId - Product ID
 * @param {number} colorId - Color ID
 * @param {Object} colorData - Updated color data
 * @returns {Promise<Object>} Updated color object
 */
export const updateProductColor = async (productId, colorId, colorData) => {
  const response = await api.put(`/products/${productId}/colors/${colorId}`, colorData);
  return response.data;
};

/**
 * Delete a product color
 * @param {number} productId - Product ID
 * @param {number} colorId - Color ID
 * @returns {Promise<Object>} Success message
 */
export const deleteProductColor = async (productId, colorId) => {
  const response = await api.delete(`/products/${productId}/colors/${colorId}`);
  return response.data;
};

// ============================================================================
// PRODUCT IMAGES API
// ============================================================================

/**
 * Get all images for a product
 * @param {number} productId - Product ID
 * @returns {Promise<Array>} Array of image objects with color info
 */
export const getProductImages = async (productId) => {
  const response = await api.get(`/products/${productId}/images`);
  return response.data;
};

/**
 * Add a new image to a product
 * @param {number} productId - Product ID
 * @param {Object} imageData - Image data {image_url, color_id, is_primary, display_order, alt_text}
 * @returns {Promise<Object>} Created image object
 */
export const addProductImage = async (productId, imageData) => {
  const response = await api.post(`/products/${productId}/images`, imageData);
  return response.data;
};

/**
 * Update a product image
 * @param {number} productId - Product ID
 * @param {number} imageId - Image ID
 * @param {Object} imageData - Updated image data
 * @returns {Promise<Object>} Updated image object
 */
export const updateProductImage = async (productId, imageId, imageData) => {
  const response = await api.put(`/products/${productId}/images/${imageId}`, imageData);
  return response.data;
};

/**
 * Delete a product image
 * @param {number} productId - Product ID
 * @param {number} imageId - Image ID
 * @returns {Promise<Object>} Success message
 */
export const deleteProductImage = async (productId, imageId) => {
  const response = await api.delete(`/products/${productId}/images/${imageId}`);
  return response.data;
};

// ============================================================================
// COLOR INVENTORY API
// ============================================================================

/**
 * Get color-based inventory for a product
 * @param {number} productId - Product ID
 * @param {number} branchId - Optional branch ID filter
 * @returns {Promise<Array>} Array of color inventory objects
 */
export const getProductColorInventory = async (productId, branchId = null) => {
  const params = branchId ? `?branch_id=${branchId}` : '';
  const response = await api.get(`/products/${productId}/color-inventory${params}`);
  return response.data;
};

/**
 * Update color inventory
 * @param {Object} inventoryData - {product_id, branch_id, color_id, quantity}
 * @returns {Promise<Object>} Success message
 */
export const updateColorInventory = async (inventoryData) => {
  const response = await api.post('/products/color-inventory', inventoryData);
  return response.data;
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get images for a specific color
 * @param {Array} images - Array of all product images
 * @param {number} colorId - Color ID to filter by
 * @returns {Array} Filtered images
 */
export const getImagesByColor = (images, colorId) => {
  return images.filter(img => img.color_id === colorId || img.color_id === null);
};

/**
 * Get primary image for a color
 * @param {Array} images - Array of all product images
 * @param {number} colorId - Color ID
 * @returns {Object|null} Primary image or first available
 */
export const getPrimaryImageForColor = (images, colorId) => {
  const colorImages = getImagesByColor(images, colorId);
  return colorImages.find(img => img.is_primary) || colorImages[0] || null;
};

/**
 * Check if a color has stock available
 * @param {Array} colorInventory - Array of color inventory objects
 * @param {number} colorId - Color ID
 * @param {number} branchId - Branch ID
 * @returns {number} Available quantity
 */
export const getColorStockAvailable = (colorInventory, colorId, branchId) => {
  const item = colorInventory.find(
    inv => inv.color_id === colorId && inv.branch_id === branchId
  );
  return item?.color_available || 0;
};

/**
 * Batch save colors for a product
 * @param {number} productId - Product ID
 * @param {Array} colors - Array of color objects
 * @returns {Promise<Array>} Array of saved colors
 */
export const batchSaveColors = async (productId, colors) => {
  const savedColors = [];
  
  for (const color of colors) {
    try {
      if (color.isNew) {
        // Add new color
        const saved = await addProductColor(productId, {
          color_name: color.color_name,
          color_code: color.color_code,
          display_order: color.display_order || 0,
        });
        savedColors.push({ ...saved, _tempId: color.id });
      } else if (color.isModified) {
        // Update existing color
        const saved = await updateProductColor(productId, color.id, {
          color_name: color.color_name,
          color_code: color.color_code,
          display_order: color.display_order,
          is_active: color.is_active,
        });
        savedColors.push({ ...saved, _tempId: color.id });
      } else {
        savedColors.push({ ...color, _tempId: color.id });
      }
    } catch (error) {
      console.error(`Error saving color ${color.color_name}:`, error);
      throw error;
    }
  }
  
  return savedColors;
};

/**
 * Sanitize a color_id before sending to the backend.
 * Detects temp IDs (string-prefixed or oversized integers) and returns null.
 */
const sanitizeColorId = (colorId) => {
  if (!colorId) return null;
  if (typeof colorId === 'string' && colorId.startsWith('temp_')) return null;
  const num = Number(colorId);
  if (isNaN(num) || num > 2147483647 || num < 1) return null;
  return num;
};

/**
 * Batch save images for a product
 * @param {number} productId - Product ID
 * @param {Array} images - Array of image objects
 * @returns {Promise<Array>} Array of saved images
 */
export const batchSaveImages = async (productId, images) => {
  const savedImages = [];
  
  for (const image of images) {
    try {
      if (image.isNew) {
        // Add new image
        const saved = await addProductImage(productId, {
          image_url: image.image_url,
          color_id: sanitizeColorId(image.color_id),
          is_primary: image.is_primary || false,
          display_order: image.display_order || 0,
          alt_text: image.alt_text || '',
        });
        savedImages.push(saved);
      } else if (image.isModified) {
        // Update existing image
        const saved = await updateProductImage(productId, image.id, {
          color_id: sanitizeColorId(image.color_id),
          is_primary: image.is_primary,
          display_order: image.display_order,
          alt_text: image.alt_text,
        });
        savedImages.push(saved);
      } else {
        savedImages.push(image);
      }
    } catch (error) {
      console.error(`Error saving image:`, error);
      throw error;
    }
  }
  
  return savedImages;
};

/**
 * Validate color data
 * @param {Object} colorData - Color data to validate
 * @returns {Object} {valid: boolean, errors: Array}
 */
export const validateColorData = (colorData) => {
  const errors = [];
  
  if (!colorData.color_name || !colorData.color_name.trim()) {
    errors.push('Color name is required');
  }
  
  if (!colorData.color_code || !/^#[0-9A-F]{6}$/i.test(colorData.color_code)) {
    errors.push('Valid hex color code is required (e.g., #FF0000)');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validate image data
 * @param {Object} imageData - Image data to validate
 * @returns {Object} {valid: boolean, errors: Array}
 */
export const validateImageData = (imageData) => {
  const errors = [];
  
  if (!imageData.image_url || !imageData.image_url.trim()) {
    errors.push('Image URL is required');
  }
  
  // Basic URL validation
  try {
    new URL(imageData.image_url);
  } catch {
    errors.push('Invalid image URL');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

export default {
  // Colors
  getProductColors,
  addProductColor,
  updateProductColor,
  deleteProductColor,
  
  // Images
  getProductImages,
  addProductImage,
  updateProductImage,
  deleteProductImage,
  
  // Inventory
  getProductColorInventory,
  updateColorInventory,
  
  // Helpers
  getImagesByColor,
  getPrimaryImageForColor,
  getColorStockAvailable,
  batchSaveColors,
  batchSaveImages,
  validateColorData,
  validateImageData,
};
