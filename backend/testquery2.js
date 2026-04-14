const { pool } = require('./src/config/db');

async function debugDashboard() {
  try {
    const dashRes = await pool.query(`
      SELECT 
       (
         COALESCE(
           (SELECT SUM(quantity_on_hand * p.cost_price)
            FROM inventory i
            JOIN products p ON i.product_id = p.id
            WHERE (p.has_variants = false OR p.has_variants IS NULL) AND p.deleted_at IS NULL), 0
         ) + COALESCE(
           (SELECT SUM(quantity_on_hand * COALESCE(v.cost_price, p.cost_price))
            FROM variant_inventory vi
            JOIN product_variants v ON vi.variant_id = v.id
            JOIN products p ON v.product_id = p.id
            WHERE p.deleted_at IS NULL), 0
         ) + COALESCE(
           (SELECT SUM(pca.stock_allocated * COALESCE(pca.cost_price_override, p.cost_price))
            FROM product_category_assignments pca
            JOIN products p ON pca.product_id = p.id
            WHERE pca.is_leaf = true AND p.deleted_at IS NULL), 0
         )
       ) as total_inventory_value
    `);
    console.log("NEW DASHBOARD COST:", dashRes.rows[0].total_inventory_value);
  } catch (err) {
    console.error(err.message);
  } finally {
    process.exit(0);
  }
}

debugDashboard();
