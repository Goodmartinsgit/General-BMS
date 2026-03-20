-- Migration 037: Restore unique constraint on settings(organization_id, category)
-- Migration 034 dropped this constraint, but the settings upsert in settingsController
-- relies on ON CONFLICT (organization_id, category). Re-add it.

-- First, deduplicate any rows that would violate the constraint
-- Keep only the most recently updated row for each (organization_id, category) pair
DELETE FROM settings a
USING settings b
WHERE a.organization_id IS NOT NULL
  AND a.category IS NOT NULL
  AND a.organization_id = b.organization_id
  AND a.category = b.category
  AND a.id < b.id;

-- Add back as a proper unique constraint (NULLs are distinct, so rows with
-- NULL organization_id or category won't conflict with each other)
ALTER TABLE settings
  ADD CONSTRAINT settings_organization_id_category_key
  UNIQUE (organization_id, category);
