-- Migration 063: Change entity_id from INTEGER to VARCHAR in recycle bin tables
-- Reason: User IDs are UUIDs but entity_id was INTEGER, preventing user deletions
-- from being tracked in the recycle bin. Using VARCHAR(255) to accommodate both.

ALTER TABLE recycle_bin
    ALTER COLUMN entity_id TYPE VARCHAR(255)
    USING entity_id::VARCHAR(255);

ALTER TABLE deletion_audit_trail
    ALTER COLUMN entity_id TYPE VARCHAR(255)
    USING entity_id::VARCHAR(255);

ALTER TABLE purge_logs
    ALTER COLUMN entity_id TYPE VARCHAR(255)
    USING entity_id::VARCHAR(255);
