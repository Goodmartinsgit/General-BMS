-- Migration 016: Fix branding_config to allow NULL organization_id
-- This fixes the 500 error when saving branding without an organization

-- Drop the UNIQUE constraint on organization_id if it exists
ALTER TABLE branding_config DROP CONSTRAINT IF EXISTS branding_config_organization_id_key;

-- Make sure organization_id can be NULL (it should already be, but let's be explicit)
ALTER TABLE branding_config ALTER COLUMN organization_id DROP NOT NULL;

-- Add a check constraint to ensure only one row exists when organization_id is NULL
-- This prevents multiple branding configs without an organization
CREATE UNIQUE INDEX IF NOT EXISTS branding_config_null_org_unique 
  ON branding_config ((1)) 
  WHERE organization_id IS NULL;

-- Add back the unique constraint for non-NULL organization_id
CREATE UNIQUE INDEX IF NOT EXISTS branding_config_org_id_unique 
  ON branding_config (organization_id) 
  WHERE organization_id IS NOT NULL;
