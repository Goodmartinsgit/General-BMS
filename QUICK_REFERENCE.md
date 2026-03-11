# Quick Reference: Product Colors & Images

## 🎨 Database Tables

```
product_colors          → Color definitions
product_images_v2       → Images with color tags
inventory_colors        → Stock per color
```

## 🔌 API Endpoints

### Colors
```
GET    /api/products/:id/colors
POST   /api/products/:id/colors
PUT    /api/products/:id/colors/:colorId
DELETE /api/products/:id/colors/:colorId
```

### Images
```
GET    /api/products/:id/images
POST   /api/products/:id/images
PUT    /api/products/:id/images/:imageId
DELETE /api/products/:id/images/:imageId
```

### Inventory
```
GET    /api/products/:id/color-inventory?branch_id=<optional>
POST   /api/products/color-inventory
```

## 📦 Frontend Components

```javascript
// Color Management
import ProductColorManager from './components/product/ProductColorManager';

<ProductColorManager
  productId={productId}
  colors={colors}
  onColorsChange={handleColorsChange}
  disabled={false}
/>

// Image Management
import ProductImageManager from './components/product/ProductImageManager';

<ProductImageManager
  productId={productId}
  images={images}
  colors={colors}
  onImagesChange={handleImagesChange}
  disabled={false}
/>

// Stock Management
import ColorStockManager from './components/product/ColorStockManager';

<ColorStockManager
  productId={productId}
  branchId={branchId}
  onStockUpdate={handleStockUpdate}
/>
```

## 🛠️ API Helper Functions

```javascript
import {
  getProductColors,
  addProductColor,
  updateProductColor,
  deleteProductColor,
  getProductImages,
  addProductImage,
  updateProductImage,
  deleteProductImage,
  getProductColorInventory,
  updateColorInventory,
  getPrimaryImageForColor,
  getColorStockAvailable,
  batchSaveColors,
  batchSaveImages,
} from './api/productColors';

// Get colors
const colors = await getProductColors(productId);

// Add color
const newColor = await addProductColor(productId, {
  color_name: 'Red',
  color_code: '#FF0000',
  display_order: 0
});

// Get images for a color
const colorImages = images.filter(img => 
  img.color_id === colorId || img.color_id === null
);

// Get primary image for color
const primaryImage = getPrimaryImageForColor(images, colorId);

// Check stock availability
const available = getColorStockAvailable(inventory, colorId, branchId);

// Batch save
await batchSaveColors(productId, colorsArray);
await batchSaveImages(productId, imagesArray);
```

## 🎯 Common Patterns

### Store Product Display
```javascript
// 1. Load product data
const [colors, images, inventory] = await Promise.all([
  getProductColors(productId),
  getProductImages(productId),
  getProductColorInventory(productId, branchId)
]);

// 2. Handle color selection
const handleColorSelect = (colorId) => {
  setSelectedColorId(colorId);
  const colorImages = getImagesByColor(images, colorId);
  setDisplayImage(colorImages.find(img => img.is_primary) || colorImages[0]);
};

// 3. Check availability
const isAvailable = getColorStockAvailable(inventory, colorId, branchId) > 0;

// 4. Add to cart
const cartItem = {
  product_id: productId,
  color_id: selectedColorId,
  quantity: quantity,
  // ... other fields
};
```

### Product Form Submission
```javascript
const handleSubmit = async (formData) => {
  // 1. Save product
  const product = await api.post('/products', formData);
  
  // 2. Save colors
  if (formData.colors.length > 0) {
    await batchSaveColors(product.id, formData.colors);
  }
  
  // 3. Save images
  if (formData.images.length > 0) {
    await batchSaveImages(product.id, formData.images);
  }
};
```

### Stock Update
```javascript
const updateStock = async (productId, branchId, colorId, quantity) => {
  await updateColorInventory({
    product_id: productId,
    branch_id: branchId,
    color_id: colorId,
    quantity: quantity
  });
  
  // Total stock auto-calculates
};
```

## 🔍 SQL Queries

### Get product with colors and images
```sql
SELECT 
  p.*,
  json_agg(DISTINCT pc.*) FILTER (WHERE pc.id IS NOT NULL) as colors,
  json_agg(DISTINCT pi.*) FILTER (WHERE pi.id IS NOT NULL) as images
FROM products p
LEFT JOIN product_colors pc ON pc.product_id = p.id AND pc.is_active = true
LEFT JOIN product_images_v2 pi ON pi.product_id = p.id
WHERE p.id = $1
GROUP BY p.id;
```

### Get color inventory breakdown
```sql
SELECT 
  i.branch_id,
  b.branch_name,
  pc.id as color_id,
  pc.color_name,
  pc.color_code,
  COALESCE(ic.quantity_on_hand, 0) as color_quantity,
  COALESCE(ic.quantity_available, 0) as color_available
FROM inventory i
JOIN branches b ON i.branch_id = b.id
LEFT JOIN product_colors pc ON pc.product_id = i.product_id
LEFT JOIN inventory_colors ic ON ic.inventory_id = i.id AND ic.color_id = pc.id
WHERE i.product_id = $1;
```

### Update color stock
```sql
-- Insert or update color inventory
INSERT INTO inventory_colors (inventory_id, color_id, quantity_on_hand)
VALUES ($1, $2, $3)
ON CONFLICT (inventory_id, color_id)
DO UPDATE SET quantity_on_hand = $3;

-- Recalculate total
UPDATE inventory 
SET quantity_on_hand = (
  SELECT COALESCE(SUM(quantity_on_hand), 0) 
  FROM inventory_colors 
  WHERE inventory_id = $1
)
WHERE id = $1;
```

## ⚠️ Important Notes

1. **Always validate color codes**: Use regex `/^#[0-9A-F]{6}$/i`
2. **Only one primary image**: Setting new primary auto-unsets others
3. **Cannot delete colors with inventory**: Check before deletion
4. **Images without color_id**: Show for all colors (fallback)
5. **Total stock auto-calculates**: Sum of all color quantities
6. **Cascade deletes**: Product deletion removes colors and images
7. **Display order**: Lower numbers appear first

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Colors not showing | Check `has_colors` flag on product |
| Images not filtering | Verify `color_id` is set correctly |
| Stock not updating | Ensure inventory record exists |
| Primary image not set | First image auto-sets as primary |
| Delete fails | Check for existing inventory |
| Images not loading | Verify Cloudinary URL is valid |

## 📱 Mobile Considerations

```css
/* Responsive color selector */
.color-selector {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
  gap: 0.5rem;
}

/* Touch-friendly buttons */
.color-button {
  min-width: 44px;
  min-height: 44px;
}
```

## 🚀 Performance Tips

1. **Lazy load images**: Use intersection observer
2. **Cache color data**: Store in context/state
3. **Batch operations**: Use batch save functions
4. **Optimize queries**: Use indexes on foreign keys
5. **Compress images**: Use Cloudinary transformations

## 📚 Related Files

```
Backend:
- backend/database/migrations/add_product_colors_and_images.sql
- backend/src/controllers/productController.js
- backend/src/routes/productRoutes.js

Frontend:
- frontend/src/components/product/ProductColorManager.jsx
- frontend/src/components/product/ProductImageManager.jsx
- frontend/src/components/product/ColorStockManager.jsx
- frontend/src/api/productColors.js

Documentation:
- PRODUCT_COLOR_IMAGE_GUIDE.md
- TESTING_GUIDE.md
- STORE_INTEGRATION_EXAMPLE.jsx
```

## 🔗 Useful Links

- [Cloudinary Docs](https://cloudinary.com/documentation)
- [Color Picker API](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/color)
- [PostgreSQL JSON Functions](https://www.postgresql.org/docs/current/functions-json.html)

---

**Last Updated**: 2024
**Version**: 1.0.0
