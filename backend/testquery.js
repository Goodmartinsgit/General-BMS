const { pool } = require('./src/config/db');
pool.query(`
SELECT COALESCE(
  (SELECT SUM(quantity_on_hand * p.cost_price)
   FROM inventory i
   JOIN products p ON i.product_id = p.id
   WHERE p.has_variants = false OR p.has_variants IS NULL), 0
) + COALESCE(
  (SELECT SUM(quantity_on_hand * v.cost_price)
   FROM variant_inventory vi
   JOIN product_variants v ON vi.variant_id = v.id), 0
) + COALESCE(
  (SELECT SUM(stock_allocated * p.cost_price)
   FROM product_category_assignments pca
   JOIN products p ON pca.product_id = p.id), 0
) as total_value
`).then(r => { console.log(r.rows); process.exit(0); }).catch(e => { console.error(e); process.exit(1); });
