-- Migration 038: Add base_product_name and product_group_id to products
--
-- Purpose: Separate the user-entered base name from the auto-generated category suffix
-- so that:
--   1. The category part of the name is never directly editable (linked to category)
--   2. Editing the base name propagates to all sibling products in the same group
--   3. Category renames automatically update the product name suffix
--
-- product_name remains the display name: "base_product_name (category_name)"
-- base_product_name stores just the user-entered part: "Hemming Gum"
-- product_group_id links products created together in multi-product creation

ALTER TABLE products ADD COLUMN IF NOT EXISTS base_product_name VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_group_id VARCHAR(64);

-- Backfill: extract base name from existing products with parenthetical category suffix
UPDATE products
SET base_product_name = TRIM(regexp_replace(product_name, '\s*\([^)]+\)\s*$', ''))
WHERE base_product_name IS NULL
  AND product_name LIKE '% (%)';

-- For products without parenthetical suffix, base_product_name = product_name
UPDATE products
SET base_product_name = product_name
WHERE base_product_name IS NULL;

-- Assign product_group_id to products that share the same base_product_name
-- and are in listing-level categories under the same root category tree
-- We use a deterministic group id based on base_product_name + root category path
WITH product_groups AS (
  SELECT p.id,
         p.base_product_name,
         (SELECT c2.path FROM categories c2 WHERE c2.id = p.category_id) as cat_path
  FROM products p
  WHERE p.deleted_at IS NULL
    AND p.product_name LIKE '% (%)'
    AND p.product_group_id IS NULL
),
grouped AS (
  SELECT id,
         md5(base_product_name || ':' || split_part(cat_path, '/', 1)) as group_id
  FROM product_groups
  WHERE cat_path IS NOT NULL
)
UPDATE products p
SET product_group_id = g.group_id
FROM grouped g
WHERE p.id = g.id;

-- Index for efficient sibling lookups
CREATE INDEX IF NOT EXISTS idx_products_product_group_id ON products(product_group_id) WHERE product_group_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_base_product_name ON products(base_product_name) WHERE base_product_name IS NOT NULL;
