-- Migration 062: Change audit_logs.resource_id from INTEGER to VARCHAR
-- Reason: User IDs are UUIDs, but resource_id was INTEGER, causing
-- "invalid input syntax for type integer" errors on login/logout audit writes.
-- Using VARCHAR(255) to accommodate both integer and UUID resource IDs.

ALTER TABLE audit_logs
    ALTER COLUMN resource_id TYPE VARCHAR(255)
    USING resource_id::VARCHAR(255);
