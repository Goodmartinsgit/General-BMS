# Database Schema Fix - Category API Errors

## Problem Summary

Your application was experiencing 500 Internal Server Errors on two category endpoints:
- `GET /api/categories/listing-level` 
- `GET /api/categories/tree`

### Root Causes

1. **Missing columns in `categories` table:**
   - `level` - stores the hierarchy level of the category
   - `path` - materialized path for efficient tree queries
   - `slug` - URL-friendly category identifier
   - `unit_of_measure` - measurement unit for products in this category
   - `is_selection_attribute` - marks if category is a selection attribute

2. **Incompatible `settings` table structure:**
   - Migration 008 created settings table with `category` and `settings` (JSONB) columns
   - Migration 033 and categoryController expected `setting_key`, `setting_value`, `setting_type` columns
   - This mismatch caused queries to fail

## Solution Applied

### Migration 033: Hierarchical Categories
Added the missing columns to the `categories` table to support multi-level category hierarchies.

### Migration 034: Fix Settings Structure
- Added `setting_key`, `setting_value`, `setting_type`, and `description` columns to `settings` table
- Made `organization_id` and `category` nullable for global settings
- Inserted the `product_listing_level` setting with default value of 1
- Created index on `setting_key` for faster lookups

## Files Created

1. `/backend/database/migrations/034_fix_settings_structure.sql` - Migration file
2. `/backend/src/scripts/run_034_migration.js` - Migration runner
3. `/backend/src/scripts/check_categories_columns.js` - Column checker and migration 033 runner
4. `/backend/src/scripts/verify_schema.js` - Schema verification script

## Verification Results

✅ All required columns now exist in `categories` table
✅ Settings table has the correct structure
✅ `product_listing_level` setting is configured with value: 1

## Next Steps

1. Restart your backend server if it's running
2. Test the category endpoints:
   - `GET /api/categories/listing-level`
   - `GET /api/categories/tree`
3. Both endpoints should now return 200 OK responses

## Prevention

To avoid similar issues in the future:
- Always run all migrations when deploying to production
- Keep migration files in sync with controller expectations
- Use a migration tracking system to ensure all migrations are applied
