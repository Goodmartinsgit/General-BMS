-- Migration: Category Restructure & Product Pricing
-- Enables custom listing levels per category and adds detailed pricing to selection attributes.

-- 1. Remove the global product_listing_level setting
DELETE FROM settings WHERE setting_key = 'product_listing_level';

-- 2. Add is_listing_category to categories
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS is_listing_category BOOLEAN DEFAULT FALSE;

-- 3. Enhance product_category_assignments with cost price override and image URL
ALTER TABLE product_category_assignments
  ADD COLUMN IF NOT EXISTS cost_price_override DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS image_url VARCHAR(255);
