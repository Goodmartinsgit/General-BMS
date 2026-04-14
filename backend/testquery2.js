const { pool } = require('./src/config/db');

async function testStats() {
  try {
    const stats = await pool.query(`
      WITH product_stock AS (
          SELECT 
              p.id,
              p.reorder_level,
              (
                  COALESCE((SELECT SUM(quantity_on_hand) FROM inventory WHERE product_id = p.id), 0) +
                  COALESCE((SELECT SUM(vi.quantity_on_hand) FROM variant_inventory vi JOIN product_variants pv ON vi.variant_id = pv.id WHERE pv.product_id = p.id), 0) +
                  COALESCE((SELECT SUM(stock_allocated) FROM product_category_assignments WHERE product_id = p.id AND is_leaf = true), 0)
              ) as total_qty,
              (
                  COALESCE((SELECT SUM(quantity_on_hand * p.cost_price) FROM inventory WHERE product_id = p.id), 0) +
                  COALESCE((SELECT SUM(vi.quantity_on_hand * COALESCE(pv.cost_price, p.cost_price)) FROM variant_inventory vi JOIN product_variants pv ON vi.variant_id = pv.id WHERE pv.product_id = p.id), 0) +
                  COALESCE((SELECT SUM(stock_allocated * COALESCE(cost_price_override, p.cost_price)) FROM product_category_assignments WHERE product_id = p.id AND is_leaf = true), 0)
              ) as total_cost,
              (
                  COALESCE((SELECT SUM(quantity_on_hand * p.retail_price) FROM inventory WHERE product_id = p.id), 0) +
                  COALESCE((SELECT SUM(vi.quantity_on_hand * COALESCE(pv.retail_price, p.retail_price)) FROM variant_inventory vi JOIN product_variants pv ON vi.variant_id = pv.id WHERE pv.product_id = p.id), 0) +
                  COALESCE((SELECT SUM(stock_allocated * COALESCE(price_override, p.retail_price)) FROM product_category_assignments WHERE product_id = p.id AND is_leaf = true), 0)
              ) as total_value,
              p.is_active,
              p.is_featured
          FROM products p
          WHERE p.deleted_at IS NULL
      )
      SELECT 
          COUNT(*) as total_products,
          COALESCE(SUM(total_qty), 0)::bigint as total_stock,
          COUNT(*) FILTER (WHERE total_qty <= reorder_level) as low_stock_count,
          COALESCE(SUM(total_cost), 0)::numeric as stock_cost,
          COALESCE(SUM(total_value), 0)::numeric as stock_value,
          COUNT(*) FILTER (WHERE is_active = true) as active_products,
          COUNT(*) FILTER (WHERE is_featured = true) as featured_products
      FROM product_stock
    `);
    console.log(stats.rows[0]);
  } catch (err) {
    console.error('Error fetching product statistics:', err.message);
  } finally {
    process.exit(0);
  }
}

testStats();
