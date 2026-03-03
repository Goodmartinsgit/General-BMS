-- 028_add_org_id_to_users.sql
-- Links users to an organization so website builder (and future multi-tenant
-- features) can scope data correctly.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS org_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL;

-- Backfill: assign all existing users to org 1 (the only org currently)
UPDATE users SET org_id = 1 WHERE org_id IS NULL;
