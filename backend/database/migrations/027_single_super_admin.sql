-- Migration 027: Single Super Admin Constraint
-- Enforces that only one Super Admin account (admin@generalbms.com) can exist.
-- All other roles may have unlimited members.

-- ============================================================
-- 1. Pin admin@generalbms.com to the Super Admin role
--    and demote any other users who currently hold it
-- ============================================================
DO $$
DECLARE
  v_super_role_id  INTEGER;
  v_admin_role_id  INTEGER;
  v_user_id        UUID;
  v_demoted        INTEGER;
BEGIN
  SELECT id INTO v_super_role_id FROM roles WHERE role_level = 1 ORDER BY id LIMIT 1;
  SELECT id INTO v_admin_role_id  FROM roles WHERE role_level = 2 ORDER BY id LIMIT 1;

  IF v_super_role_id IS NULL THEN
    RAISE NOTICE 'No Super Admin role found — skipping';
    RETURN;
  END IF;

  -- Ensure admin@generalbms.com is assigned the Super Admin role
  SELECT id INTO v_user_id
    FROM users
   WHERE email = 'admin@generalbms.com' AND deleted_at IS NULL;

  IF v_user_id IS NOT NULL THEN
    UPDATE users SET role_id = v_super_role_id WHERE id = v_user_id;
    RAISE NOTICE 'Assigned Super Admin role to admin@generalbms.com';
  ELSE
    RAISE NOTICE 'admin@generalbms.com not found — no user assignment made';
  END IF;

  -- Demote any OTHER active users who hold the Super Admin role down to Admin
  IF v_admin_role_id IS NOT NULL THEN
    UPDATE users
       SET role_id = v_admin_role_id
     WHERE role_id = v_super_role_id
       AND deleted_at IS NULL
       AND (v_user_id IS NULL OR id <> v_user_id);

    GET DIAGNOSTICS v_demoted = ROW_COUNT;
    RAISE NOTICE 'Demoted % extra Super Admin user(s) to Admin level', v_demoted;
  END IF;
END $$;

-- ============================================================
-- 2. Trigger function: block a second active Super Admin
-- ============================================================
CREATE OR REPLACE FUNCTION enforce_single_super_admin()
RETURNS TRIGGER AS $$
DECLARE
  v_super_role_id INTEGER;
  v_count         INTEGER;
BEGIN
  SELECT id INTO v_super_role_id FROM roles WHERE role_level = 1 LIMIT 1;

  -- Only relevant when assigning the Super Admin role to an active (non-deleted) user
  IF v_super_role_id IS NOT NULL
    AND NEW.role_id = v_super_role_id
    AND NEW.deleted_at IS NULL
  THEN
    SELECT COUNT(*) INTO v_count
      FROM users
     WHERE role_id = v_super_role_id
       AND deleted_at IS NULL
       AND id <> NEW.id;

    IF v_count > 0 THEN
      RAISE EXCEPTION 'Only one Super Admin account is permitted';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_single_super_admin ON users;
CREATE TRIGGER trg_single_super_admin
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION enforce_single_super_admin();
