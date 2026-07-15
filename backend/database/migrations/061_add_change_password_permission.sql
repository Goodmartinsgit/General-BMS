-- Migration 061: Add change_password permission to existing roles
-- This ensures all existing roles keep password changing access by default,
-- and admins can explicitly uncheck/disable it for specific roles.

UPDATE roles
SET permissions = permissions || '{"change_password": true}'::jsonb;
