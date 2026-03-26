-- Backfill variant_name on existing sale_items from product_variants
-- For items with a variant_id but no variant_name stored yet

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
