-- Migration: Add category_id to sale_items and backfill variant details
-- 1. Add category_id column for tracking category-based selections
ALTER TABLE sale_items
  ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id);

CREATE INDEX IF NOT EXISTS idx_sale_items_category ON sale_items(category_id);

-- 2. Backfill variant_name from product_variants (for variant-based items)
UPDATE sale_items si
SET variant_name = COALESCE(
    pv.variant_name,
    (
        SELECT string_agg(
            CONCAT(UPPER(LEFT(kv.key, 1)), SUBSTRING(kv.key FROM 2), ' ', kv.value),
            ' / '
            ORDER BY kv.key
        )
        FROM jsonb_each_text(pv.variant_values) AS kv
    )
)
FROM product_variants pv
WHERE si.variant_id = pv.id
  AND (si.variant_name IS NULL OR si.variant_name = '');
