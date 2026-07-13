# Fix: Allow Duplicate Category Names Under Different Parents

## Problem

When trying to create a Level 3 sub-category with the same name as an existing Level 3 sub-category under a different Level 2 parent, the system returned a 400 error:

```
POST https://general-bms.onrender.com/api/categories 400 (Bad Request)
Error: "Category name already exists at this level"
```

**Example scenario:**
- Level 1: Electronics
  - Level 2: Phones
    - Level 3: Accessories ✅
  - Level 2: Laptops
    - Level 3: Accessories ❌ (Error: name already exists)

## Root Cause

The `categories` table had a global unique constraint on the `slug` column, which prevented any two categories from having the same slug, even if they were under different parents. This is incorrect for hierarchical category systems where the same category name should be allowed under different parent categories.

## Solution

### Migration 035: Allow Duplicate Category Names Under Different Parents

Changed the uniqueness constraint from global to per-parent scope:

1. **Removed global constraints:**
   - Dropped `categories_slug_key` constraint
   - Dropped `idx_categories_slug` index

2. **Added parent-scoped constraints:**
   - `idx_categories_parent_slug`: Unique constraint on `(parent_category_id, slug)`
   - `idx_categories_parent_name`: Unique constraint on `(parent_category_id, category_name)`
   - `idx_categories_slug_lookup`: Non-unique index for slug lookups

3. **Updated error messages:**
   - More specific error messages indicating whether duplicate is under same parent or at root level

## What This Enables

✅ You can now create categories with the same name under different parents:
- Electronics → Phones → Accessories
- Electronics → Laptops → Accessories
- Clothing → Men → Accessories
- Clothing → Women → Accessories

❌ You still cannot create duplicate names under the same parent:
- Electronics → Phones → Accessories
- Electronics → Phones → Accessories (Error: duplicate under same parent)

## Files Modified

1. `/backend/database/migrations/035_allow_duplicate_category_names.sql` - Migration file
2. `/backend/src/controllers/categoryController.js` - Updated error messages
3. `/backend/src/scripts/run_035_migration.js` - Migration runner
4. `/backend/src/scripts/fix_slug_constraint.js` - Constraint cleanup script
5. `/backend/src/scripts/verify_category_constraints.js` - Verification script

## Testing

After applying this fix, you should be able to:
1. Create a category "Accessories" under "Phones"
2. Create another category "Accessories" under "Laptops"
3. Both will coexist without conflicts

## Deployment

The migration has been applied to your production database. No further action needed.
