-- Migration 057: Categories & Brands CRUD permissions
-- Grant permissions by default to Super Admin (level 1) and Admin (level 2).
-- Manager (level 3) and Staff (level 4) will have these permissions disabled by default.

-- 1. Update Super Admin (level 1)
UPDATE roles
SET permissions = permissions
  || '{"view_categories": true}'::jsonb
  || '{"create_categories": true}'::jsonb
  || '{"update_categories": true}'::jsonb
  || '{"delete_categories": true}'::jsonb
  || '{"view_brands": true}'::jsonb
  || '{"create_brands": true}'::jsonb
  || '{"update_brands": true}'::jsonb
  || '{"delete_brands": true}'::jsonb
WHERE role_level = 1;

-- 2. Update Admin (level 2)
UPDATE roles
SET permissions = permissions
  || '{"view_categories": true}'::jsonb
  || '{"create_categories": true}'::jsonb
  || '{"update_categories": true}'::jsonb
  || '{"delete_categories": true}'::jsonb
  || '{"view_brands": true}'::jsonb
  || '{"create_brands": true}'::jsonb
  || '{"update_brands": true}'::jsonb
  || '{"delete_brands": true}'::jsonb
WHERE role_level = 2;

-- 3. Ensure Manager (level 3) and Staff (level 4) explicitly have them as false or not set (which defaults to false)
-- To be safe, we explicitly set them to false in Manager (level 3) and Staff (level 4) roles, in case they had any previous keys
UPDATE roles
SET permissions = permissions
  || '{"view_categories": false}'::jsonb
  || '{"create_categories": false}'::jsonb
  || '{"update_categories": false}'::jsonb
  || '{"delete_categories": false}'::jsonb
  || '{"view_brands": false}'::jsonb
  || '{"create_brands": false}'::jsonb
  || '{"update_brands": false}'::jsonb
  || '{"delete_brands": false}'::jsonb
WHERE role_level IN (3, 4);
