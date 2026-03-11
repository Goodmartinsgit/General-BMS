# Product Color & Image Management System

## Overview
This implementation adds comprehensive color management and multi-image support to products, including:
- Multiple product images with color-specific tagging
- Dynamic color management (add/remove colors)
- Stock breakdown per color
- Integration ready for store frontend

## Database Schema

### New Tables

#### 1. `product_colors`
Stores color variants for products.
```sql
- id: SERIAL PRIMARY KEY
- product_id: INTEGER (FK to products)
- color_name: VARCHAR(100)
- color_code: VARCHAR(7) - Hex color code
- display_order: INTEGER
- is_active: BOOLEAN
- created_at, updated_at: TIMESTAMP
```

#### 2. `product_images_v2`
Stores multiple images per product with optional color tagging.
```sql
- id: SERIAL PRIMARY KEY
- product_id: INTEGER (FK to products)
- image_url: TEXT
- color_id: INTEGER (FK to product_colors, nullable)
- is_primary: BOOLEAN
- display_order: INTEGER
- alt_text: VARCHAR(255)
- created_at, updated_at: TIMESTAMP
```

#### 3. `inventory_colors`
Tracks stock quantity per color per branch.
```sql
- id: SERIAL PRIMARY KEY
- inventory_id: INTEGER (FK to inventory)
- color_id: INTEGER (FK to product_colors)
- quantity_on_hand: INTEGER
- quantity_reserved: INTEGER
- quantity_available: INTEGER (computed)
- created_at, updated_at: TIMESTAMP
```

### Modified Tables

#### `products`
Added column:
- `has_colors: BOOLEAN DEFAULT FALSE`

## Backend API Endpoints

### Color Management

#### Get Product Colors
```
GET /api/products/:id/colors
```
Returns all colors for a product.

#### Add Product Color
```
POST /api/products/:id/colors
Body: {
  color_name: string,
  color_code: string (hex),
  display_order: number
}
```

#### Update Product Color
```
PUT /api/products/:id/colors/:colorId
Body: {
  color_name?: string,
  color_code?: string,
  display_order?: number,
  is_active?: boolean
}
```

#### Delete Product Color
```
DELETE /api/products/:id/colors/:colorId
```
Note: Cannot delete colors with existing inventory.

### Image Management

#### Get Product Images
```
GET /api/products/:id/images
```
Returns all images with color associations.

#### Add Product Image
```
POST /api/products/:id/images
Body: {
  image_url: string,
  color_id?: number,
  is_primary?: boolean,
  display_order?: number,
  alt_text?: string
}
```

#### Update Product Image
```
PUT /api/products/:id/images/:imageId
Body: {
  color_id?: number,
  is_primary?: boolean,
  display_order?: number,
  alt_text?: string
}
```

#### Delete Product Image
```
DELETE /api/products/:id/images/:imageId
```

### Color Inventory

#### Get Color Inventory
```
GET /api/products/:id/color-inventory?branch_id=<optional>
```
Returns stock breakdown by color for all branches or specific branch.

#### Update Color Inventory
```
POST /api/products/color-inventory
Body: {
  product_id: number,
  branch_id: number,
  color_id: number,
  quantity: number
}
```
Updates stock for a specific color. Automatically recalculates total inventory.

## Frontend Components

### 1. ProductColorManager
**Location:** `frontend/src/components/product/ProductColorManager.jsx`

**Purpose:** Manage product colors (add, edit, remove)

**Props:**
- `productId`: Product ID
- `colors`: Array of color objects
- `onColorsChange`: Callback when colors change
- `disabled`: Boolean to disable editing

**Features:**
- Add new colors with name and hex code
- Edit existing colors
- Remove colors (with validation)
- Color picker for visual selection
- Display order management

### 2. ProductImageManager
**Location:** `frontend/src/components/product/ProductImageManager.jsx`

**Purpose:** Manage multiple product images with color tagging

**Props:**
- `productId`: Product ID
- `images`: Array of image objects
- `colors`: Array of available colors
- `onImagesChange`: Callback when images change
- `disabled`: Boolean to disable editing

**Features:**
- Upload multiple images via Cloudinary
- Tag images to specific colors or "All Colors"
- Set primary image
- Reorder images
- Add alt text for accessibility
- Visual grid display with hover controls

### 3. ColorStockManager
**Location:** `frontend/src/components/product/ColorStockManager.jsx`

**Purpose:** Display and manage stock breakdown by color

**Props:**
- `productId`: Product ID
- `branchId`: Optional branch filter
- `onStockUpdate`: Callback after stock update

**Features:**
- View stock per color per branch
- Edit color quantities inline
- Automatic total stock calculation
- Visual color indicators
- Reserved vs available stock display

## Integration with ProductFormModal

The `ProductFormModal` has been updated to include:
1. Color management section
2. Multi-image management with color tagging
3. Backward compatibility with legacy single image upload

**Usage in Edit Mode:**
```javascript
<ProductFormModal
  isOpen={true}
  onClose={handleClose}
  onSubmit={handleSubmit}
  product={productData}
  brands={brands}
  categories={categories}
  loading={false}
/>
```

## Integration with ProductDetailPage

The product detail page now shows:
1. Color-based stock breakdown (if product has colors)
2. Branch inventory with color details
3. Visual color indicators

## Store Frontend Integration

### For Store Product Display

To display products with color-specific images in the store:

```javascript
// Fetch product with colors and images
const product = await api.get(`/products/${productId}`);
const colors = await api.get(`/products/${productId}/colors`);
const images = await api.get(`/products/${productId}/images`);

// Filter images by selected color
const selectedColorImages = images.filter(
  img => img.color_id === selectedColorId || img.color_id === null
);

// Display primary image or first available
const displayImage = selectedColorImages.find(img => img.is_primary) 
  || selectedColorImages[0];
```

### Color Selector Component Example

```javascript
const ColorSelector = ({ colors, selectedColorId, onColorSelect }) => {
  return (
    <div className="flex gap-2">
      {colors.map(color => (
        <button
          key={color.id}
          onClick={() => onColorSelect(color.id)}
          className={`w-10 h-10 rounded-full border-2 ${
            selectedColorId === color.id ? 'border-accent-gold' : 'border-gray-300'
          }`}
          style={{ backgroundColor: color.color_code }}
          title={color.color_name}
        />
      ))}
    </div>
  );
};
```

### Stock Availability by Color

```javascript
// Check if color is in stock
const getColorStock = async (productId, colorId, branchId) => {
  const inventory = await api.get(
    `/products/${productId}/color-inventory?branch_id=${branchId}`
  );
  
  const colorStock = inventory.find(
    item => item.color_id === colorId && item.branch_id === branchId
  );
  
  return colorStock?.color_available || 0;
};
```

## Migration Steps

1. **Run Database Migration:**
   ```bash
   psql -U your_user -d your_database -f backend/database/migrations/add_product_colors_and_images.sql
   ```

2. **Restart Backend Server:**
   ```bash
   cd backend
   npm restart
   ```

3. **Clear Frontend Cache:**
   ```bash
   cd frontend
   npm run build
   ```

## Usage Workflow

### Adding a Product with Colors

1. Create/Edit product in ProductFormModal
2. Add colors using ProductColorManager
3. Upload images using ProductImageManager
4. Tag each image to specific colors or leave as "All Colors"
5. Set one image as primary
6. Save product

### Managing Stock by Color

1. Navigate to product detail page
2. Scroll to "Stock by Color" section
3. Click "Edit" next to a color
4. Enter quantity for that color
5. Click "Save"
6. Total stock automatically updates

### Store Display

1. Fetch product colors and images
2. Display color selector
3. Filter images by selected color
4. Show color-specific stock availability
5. Add to cart with selected color

## Best Practices

1. **Always set a primary image** - This ensures consistent display
2. **Tag images to colors** - Improves customer experience
3. **Use descriptive alt text** - Improves accessibility and SEO
4. **Maintain color stock accuracy** - Update after each sale/return
5. **Use hex codes consistently** - Ensures accurate color display

## Troubleshooting

### Colors not showing in image manager
- Ensure colors are saved before adding images
- Check that `has_colors` flag is set on product

### Stock not updating
- Verify inventory record exists for branch
- Check that color_id is valid
- Ensure user has `manage_inventory` permission

### Images not displaying
- Verify Cloudinary upload was successful
- Check image_url is accessible
- Ensure proper CORS settings

## Future Enhancements

1. Bulk color import from CSV
2. Color variants with different prices
3. Image zoom and gallery view
4. Color-based product recommendations
5. Analytics per color performance
6. Automated color extraction from images
7. Multi-language color names

## Support

For issues or questions:
- Check backend logs: `backend/logs/error.log`
- Verify database constraints
- Test API endpoints with Postman
- Review browser console for frontend errors
