-- Migration 035: Allow duplicate category names under different parents
-- Changes slug uniqueness from global to per-parent scope

-- Drop the global unique constraint on slug (if it exists as a constraint)
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_slug_key;

-- Drop the global unique index on slug
DROP INDEX IF EXISTS idx_categories_slug;

-- Create a unique constraint on (parent_category_id, slug) to allow same names under different parents
-- This allows "Accessories" under both "Men's Clothing" and "Women's Clothing"
CREATE UNIQUE INDEX idx_categories_parent_slug 
ON categories (COALESCE(parent_category_id, 0), slug);

-- Also create a unique constraint on (parent_category_id, category_name) for better validation
CREATE UNIQUE INDEX idx_categories_parent_name 
ON categories (COALESCE(parent_category_id, 0), category_name);

-- Create a regular index on slug for lookups (non-unique)
CREATE INDEX idx_categories_slug_lookup ON categories (slug);
