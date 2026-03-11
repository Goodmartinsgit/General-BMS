-- Migration: Add product colors and color-specific images support

-- Product colors table
CREATE TABLE IF NOT EXISTS product_colors (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  color_name VARCHAR(100) NOT NULL,
  color_code VARCHAR(7),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, color_name)
);

-- Product images with color tagging
CREATE TABLE IF NOT EXISTS product_images_v2 (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  color_id INTEGER REFERENCES product_colors(id) ON DELETE SET NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  alt_text VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Color-specific inventory tracking
CREATE TABLE IF NOT EXISTS inventory_colors (
  id SERIAL PRIMARY KEY,
  inventory_id INTEGER REFERENCES inventory(id) ON DELETE CASCADE,
  color_id INTEGER REFERENCES product_colors(id) ON DELETE CASCADE,
  quantity_on_hand INTEGER DEFAULT 0,
  quantity_reserved INTEGER DEFAULT 0,
  quantity_available INTEGER GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(inventory_id, color_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_colors_product_id ON product_colors(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_v2_product_id ON product_images_v2(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_v2_color_id ON product_images_v2(color_id);
CREATE INDEX IF NOT EXISTS idx_inventory_colors_inventory_id ON inventory_colors(inventory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_colors_color_id ON inventory_colors(color_id);

-- Add has_colors flag to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_colors BOOLEAN DEFAULT FALSE;

-- Update trigger for product_colors updated_at
CREATE OR REPLACE FUNCTION update_product_colors_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_colors_timestamp
BEFORE UPDATE ON product_colors
FOR EACH ROW
EXECUTE FUNCTION update_product_colors_timestamp();

-- Update trigger for product_images_v2 updated_at
CREATE OR REPLACE FUNCTION update_product_images_v2_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_images_v2_timestamp
BEFORE UPDATE ON product_images_v2
FOR EACH ROW
EXECUTE FUNCTION update_product_images_v2_timestamp();
