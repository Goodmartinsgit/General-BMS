-- Migration 058: Fix Super Admin role_level
-- The Super Admin role was created without specifying role_level, so it got
-- the column default of 99. This fixes it to 1 (highest privilege).
-- Also ensures is_system_role is true for the Super Admin.

UPDATE roles
SET role_level = 1,
    is_system_role = true
WHERE role_name = 'Super Admin'
  AND (role_level IS NULL OR role_level != 1);
