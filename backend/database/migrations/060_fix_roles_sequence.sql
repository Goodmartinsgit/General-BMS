-- Migration 060: Fix roles table primary key sequence
-- The server.js auto-seeding process inserts the Super Admin role with a
-- hardcoded id of 1, which prevents the PostgreSQL SERIAL sequence from
-- incrementing. This sets the sequence to the current maximum ID in the table
-- so that subsequent role creations do not trigger a unique constraint violation.

SELECT setval('roles_id_seq', COALESCE((SELECT MAX(id) FROM roles), 1));
