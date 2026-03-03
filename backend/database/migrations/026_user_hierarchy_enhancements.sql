-- Migration 026: User Hierarchy Enhancements
-- Adds role-level hierarchy and user security/lockout fields

-- ============================================================
-- 1. Add role_level to roles table (lower number = higher privilege)
--    1 = Super Admin, 2 = Admin, 3 = Manager, 4 = Staff, etc.
-- ============================================================
ALTER TABLE roles ADD COLUMN IF NOT EXISTS role_level INTEGER DEFAULT 99;

-- Auto-assign levels based on existing role names
UPDATE roles SET role_level = CASE
  WHEN role_name ILIKE '%super%'                                          THEN 1
  WHEN role_name ILIKE '%system%'                                         THEN 2
  WHEN role_name ILIKE '%admin%'   AND role_name NOT ILIKE '%super%'
                                   AND role_name NOT ILIKE '%system%'     THEN 2
  WHEN role_name ILIKE '%manager%'                                        THEN 3
  WHEN role_name ILIKE '%cashier%' OR role_name ILIKE '%sales%'          THEN 4
  WHEN role_name ILIKE '%staff%'   OR role_name ILIKE '%employee%'       THEN 4
  ELSE 5
END
WHERE role_level = 99;

CREATE INDEX IF NOT EXISTS idx_roles_role_level ON roles(role_level);

-- ============================================================
-- 2. Add security / lockout columns to users table
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE'
  CHECK (status IN ('ACTIVE', 'INACTIVE', 'LOCKED'));

ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_at             TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lock_reason           TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS require_password_change BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_password_change  TIMESTAMP;

-- Back-fill status from is_active
UPDATE users
SET status = CASE
  WHEN is_active = false THEN 'INACTIVE'
  ELSE 'ACTIVE'
END
WHERE deleted_at IS NULL AND status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
