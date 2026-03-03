-- Migration 023: Add online store fields to products and categories
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug VARCHAR(300) UNIQUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_online_available BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS short_description VARCHAR(500);

-- Auto-generate slugs for existing products from product_name
UPDATE products
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(product_name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) || '-' || id
WHERE slug IS NULL;

-- Add slug to categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS slug VARCHAR(300) UNIQUE;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Auto-generate slugs for existing categories
UPDATE categories
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(category_name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) || '-' || id
WHERE slug IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_online ON products(is_online_available) WHERE is_online_available = true;
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
