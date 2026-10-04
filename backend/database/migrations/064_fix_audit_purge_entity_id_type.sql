-- Migration 064: Fix entity_id type in deletion_audit_trail and purge_logs
-- These columns need to support UUID entity IDs (from users, etc.)
-- which are stored as VARCHAR in recycle_bin after migration 063

ALTER TABLE deletion_audit_trail
  ALTER COLUMN entity_id TYPE VARCHAR(255) USING entity_id::VARCHAR;

ALTER TABLE purge_logs
  ALTER COLUMN entity_id TYPE VARCHAR(255) USING entity_id::VARCHAR;
