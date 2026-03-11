# Product Colors and Images Migration

## Overview
This migration adds support for product colors and color-specific images to the BMS system.

## Tables Created

### 1. product_colors
Stores color options for products.
- `id`: Primary key
- `product_id`: Foreign key to products table
- `color_name`: Name of the color (e.g., "Red", "Blue")
- `color_code`: Hex color code (e.g., "#FF0000")
- `display_order`: Order for displaying colors
- `is_active`: Whether the color is active
- `created_at`, `updated_at`: Timestamps

### 2. product_images_v2
Stores product images with optional color tagging.
- `id`: Primary key
- `product_id`: Foreign key to products table
- `image_url`: URL of the image
- `color_id`: Optional foreign key to product_colors (for color-specific images)
- `is_primary`: Whether this is the primary image
- `display_order`: Order for displaying images
- `alt_text`: Alternative text for accessibility
- `created_at`, `updated_at`: Timestamps

### 3. inventory_colors
Tracks inventory by color.
- `id`: Primary key
- `inventory_id`: Foreign key to inventory table
- `color_id`: Foreign key to product_colors
- `quantity_on_hand`: Current stock quantity
- `quantity_reserved`: Reserved quantity
- `quantity_available`: Computed column (on_hand - reserved)
- `created_at`, `updated_at`: Timestamps

## Running the Migration

### Method 1: Using npm script (Recommended)
```bash
cd backend
npm run migrate:colors
```

### Method 2: Direct execution
```bash
cd backend
node src/scripts/run_product_colors_migration.js
```

## Verifying the Migration

### Using npm script
```bash
npm run verify:tables
```

### Direct execution
```bash
node src/scripts/verify_product_tables.js
```

## What Was Fixed

The migration resolves these errors:
- ❌ `relation "product_colors" does not exist`
- ❌ `relation "product_images_v2" does not exist`

## API Endpoints Affected

After running this migration, these endpoints will work:
- `POST /api/products/:id/colors` - Add color to product
- `POST /api/products/:id/images` - Add image to product
- `GET /api/products/:id` - Now includes colors and images

## Database Indexes

The migration creates these indexes for performance:
- `idx_product_colors_product_id`
- `idx_product_images_v2_product_id`
- `idx_product_images_v2_color_id`
- `idx_inventory_colors_inventory_id`
- `idx_inventory_colors_color_id`

## Triggers

Auto-update triggers for `updated_at` columns:
- `trigger_update_product_colors_timestamp`
- `trigger_update_product_images_v2_timestamp`

## Notes

- The migration is idempotent (safe to run multiple times)
- All tables use `ON DELETE CASCADE` for proper cleanup
- The `has_colors` flag is added to the products table
- Color codes should be in hex format (e.g., "#FF0000")

## Troubleshooting

If you encounter errors:

1. **Connection issues**: Check your `.env` file for correct database credentials
2. **Permission errors**: Ensure your database user has CREATE TABLE privileges
3. **Already exists errors**: These are safe to ignore - the migration uses `IF NOT EXISTS`

## Rollback

To rollback this migration (if needed):
```sql
DROP TABLE IF EXISTS inventory_colors CASCADE;
DROP TABLE IF EXISTS product_images_v2 CASCADE;
DROP TABLE IF EXISTS product_colors CASCADE;
ALTER TABLE products DROP COLUMN IF EXISTS has_colors;
```

## Next Steps

After running this migration:
1. Restart your backend server
2. Test the product color and image endpoints
3. Update your frontend to use the new color/image features
