-- Migration 034: Fix settings table structure for hierarchical categories
-- Adds setting_key, setting_value, setting_type columns to support the category controller

-- Add new columns to settings table
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS setting_key VARCHAR(100) UNIQUE,
  ADD COLUMN IF NOT EXISTS setting_value TEXT,
  ADD COLUMN IF NOT EXISTS setting_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Make organization_id nullable for global settings
ALTER TABLE settings
  ALTER COLUMN organization_id DROP NOT NULL;

-- Make category nullable since we're using setting_key now
ALTER TABLE settings
  ALTER COLUMN category DROP NOT NULL;

-- Drop the old unique constraint
ALTER TABLE settings
  DROP CONSTRAINT IF EXISTS settings_organization_id_category_key;

-- Insert the product_listing_level setting if it doesn't exist
INSERT INTO settings (setting_key, setting_value, setting_type, category, description)
VALUES (
  'product_listing_level',
  '1',
  'number',
  'products',
  'Category tree level at which products are listed. Levels above are browsing categories, levels below are selection attributes.'
)
ON CONFLICT (setting_key) DO NOTHING;

-- Create index on setting_key for faster lookups
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(setting_key);
