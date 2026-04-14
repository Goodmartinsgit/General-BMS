const { pool } = require('./src/config/db');

async function verify() {
  try {
    const q1 = await pool.query(`SELECT COUNT(*) FROM customers WHERE deleted_at IS NULL`);
    const q2 = await pool.query(`
                SELECT
                    (SELECT COUNT(*) FROM inventory i
                     JOIN products p ON i.product_id = p.id
                     WHERE p.is_active = TRUE AND p.deleted_at IS NULL AND p.has_variants = FALSE
                       AND i.quantity_on_hand >= 0
                       AND i.quantity_on_hand <= COALESCE(p.reorder_level, 5)
                    ) +
                    (SELECT COUNT(*) FROM variant_inventory vi
                     JOIN product_variants pv ON vi.variant_id = pv.id
                     JOIN products p ON pv.product_id = p.id
                     WHERE p.is_active = TRUE AND p.deleted_at IS NULL AND pv.is_active = TRUE
                       AND vi.quantity_on_hand >= 0
                       AND vi.quantity_on_hand <= COALESCE(pv.reorder_level, 5)
                    ) as count`);
    
    console.log("Verified Customers:", q1.rows[0].count);
    console.log("Verified Low Stock Quick Action:", q2.rows[0].count);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}
verify();
