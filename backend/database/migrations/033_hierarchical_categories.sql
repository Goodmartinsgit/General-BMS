-- Migration: Hierarchical Category System
-- Adds multi-level category support with materialized paths, unit of measure,
-- product listing level configuration, and product-category stock assignments.

-- ============================================================================
-- 1. Enhance categories table for N-level hierarchy
-- ============================================================================

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS path TEXT,
  ADD COLUMN IF NOT EXISTS slug VARCHAR(255),
  ADD COLUMN IF NOT EXISTS unit_of_measure VARCHAR(50),
  ADD COLUMN IF NOT EXISTS is_selection_attribute BOOLEAN DEFAULT FALSE;

-- Backfill existing categories: all current categories become Level 1
UPDATE categories
SET level = 1,
    path = id::TEXT,
    slug = LOWER(REGEXP_REPLACE(category_name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE level IS NULL OR path IS NULL;

-- Backfill children (categories with parent_category_id set)
UPDATE categories c
SET level = 2,
    path = p.id::TEXT || '/' || c.id::TEXT
FROM categories p
WHERE c.parent_category_id = p.id
  AND c.parent_category_id IS NOT NULL;

-- Create index for path-based queries
CREATE INDEX IF NOT EXISTS idx_categories_path ON categories USING btree (path);
CREATE INDEX IF NOT EXISTS idx_categories_level ON categories (level);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories (parent_category_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories (slug);

-- ============================================================================
-- 2. Product-Category Assignments (for selection-level stock & pricing)
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_category_assignments (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  category_level INTEGER NOT NULL,
  price_override DECIMAL(15,2),
  stock_allocated INTEGER DEFAULT 0,
  is_leaf BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_pca_product ON product_category_assignments(product_id);
CREATE INDEX IF NOT EXISTS idx_pca_category ON product_category_assignments(category_id);

-- ============================================================================
-- 3. Product listing level setting (stored in settings table)
-- ============================================================================

INSERT INTO settings (setting_key, setting_value, setting_type, category, description)
VALUES (
  'product_listing_level',
  '1',
  'number',
  'products',
  'Category tree level at which products are listed. Levels above are browsing categories, levels below are selection attributes.'
)
ON CONFLICT (setting_key) DO NOTHING;
