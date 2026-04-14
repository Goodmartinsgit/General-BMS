const { pool } = require('./src/config/db');

async function verify() {
  try {
    // 1. Global statistics
    const statsRes = await pool.query(`
      SELECT 
        COUNT(*) as total_products,
        SUM(
          (
            COALESCE((SELECT SUM(i.quantity_on_hand) FROM inventory i WHERE i.product_id = p.id), 0) +
            COALESCE((SELECT SUM(vi.quantity_on_hand) FROM variant_inventory vi JOIN product_variants pv ON vi.variant_id = pv.id WHERE pv.product_id = p.id), 0) +
            COALESCE((SELECT SUM(pca2.stock_allocated) FROM product_category_assignments pca2 WHERE pca2.product_id = p.id AND pca2.is_leaf = true), 0)
          )
        ) as total_stock,
        SUM(
          (
            COALESCE((SELECT SUM(i.quantity_on_hand * p.cost_price) FROM inventory i WHERE i.product_id = p.id), 0) +
            COALESCE((SELECT SUM(vi.quantity_on_hand * COALESCE(pv.cost_price, p.cost_price)) FROM variant_inventory vi JOIN product_variants pv ON vi.variant_id = pv.id WHERE pv.product_id = p.id), 0) +
            COALESCE((SELECT SUM(pca2.stock_allocated * COALESCE(pca2.cost_price_override, p.cost_price)) FROM product_category_assignments pca2 WHERE pca2.product_id = p.id AND pca2.is_leaf = true), 0)
          )
        ) as total_stock_cost
      FROM products p
      WHERE p.deleted_at IS NULL
    `);
    
    console.log("GLOBAL STATS:", statsRes.rows[0]);

    // 2. Sum of Category Groups
    // This is more complex because products can be in multiple categories via PCA, but Category Insights usually aggregates by ROOT categories.
    // If a product is in multiple root categories (via PCA), it might be double counted in the sum of root categories, which is intended behavior for category-specific views.
    // However, for total value, it should match the global sum IF each product maps to exactly one root.
    
    console.log("Note: Global sum and category sum might differ if products bridge multiple root categories.");
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}
verify();
