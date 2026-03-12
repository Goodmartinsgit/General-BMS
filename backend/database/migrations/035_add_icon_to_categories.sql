-- Migration: Add missing columns to categories table
-- Description: Ensures icon, image_url, and category_type exist. 
-- These were previously added to an older migration (002) after it had already run on some environments, causing them to be missed.

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS category_type VARCHAR(50) DEFAULT 'product',
  ADD COLUMN IF NOT EXISTS icon VARCHAR(100),
  ADD COLUMN IF NOT EXISTS image_url TEXT;
