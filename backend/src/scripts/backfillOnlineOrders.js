const { pool } = require('../config/db');

async function backfill() {
  const client = await pool.connect();
  try {
    const onlineOrdersRes = await client.query(`
      SELECT * FROM online_orders 
      WHERE payment_status = 'PAID' AND status != 'CANCELLED'
    `);
    
    let count = 0;
    for (const order of onlineOrdersRes.rows) {
      const existing = await client.query(`SELECT id FROM sales WHERE sale_number = $1`, [order.order_number]);
      if (existing.rows.length > 0) continue; // Already synced

      const itemsRes = await client.query(`SELECT * FROM online_order_items WHERE order_id = $1`, [order.id]);
      const items = itemsRes.rows;

      let cost_total = 0;
      for (const item of items) {
          let cp = 0;
          if (item.variant_id) {
              const v = await client.query('SELECT cost_price FROM product_variants WHERE id=$1', [item.variant_id]);
              cp = parseFloat(v.rows[0]?.cost_price || 0);
          } else {
              const p = await client.query('SELECT cost_price FROM products WHERE id=$1', [item.product_id]);
              cp = parseFloat(p.rows[0]?.cost_price || 0);
          }
          item.cost_price = cp;
          cost_total += cp * item.quantity;
      }
      const profit_total = parseFloat(order.subtotal) - cost_total - parseFloat(order.discount_amount || 0);

      const saleRes = await client.query(
          `INSERT INTO sales (
              sale_number, customer_id, branch_id, subtotal, discount_amount,
              tax_amount, total_amount, payment_method, amount_paid,
              status, payment_status, sale_source,
              cost_total, profit_total, notes, created_at, updated_at
          ) VALUES (
              $1, $2, (SELECT id FROM branches LIMIT 1), $3, $4, $5, $6, $7, $8, 'completed', 'paid', 'online', $9, $10, $11, $12, $13
          ) RETURNING id`,
          [
              order.order_number, order.customer_id, order.subtotal, order.discount_amount,
              order.tax_amount, order.total, order.payment_method, order.total,
              cost_total, profit_total, `Online Order: ${order.order_number} (Backfilled)`, order.created_at, order.updated_at
          ]
      );
      const saleId = saleRes.rows[0].id;

      for (const item of items) {
          await client.query(
              `INSERT INTO sale_items (
                  sale_id, product_id, variant_id, category_id, quantity, unit_price, line_total, cost_price, variant_name
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
              [
                  saleId, item.product_id, item.variant_id || null, item.category_id || null, item.quantity, item.unit_price, item.line_total, item.cost_price, item.variant_name || null
              ]
          );
      }
      count++;
    }
    console.log(`Backfilled ${count} online orders to sales table.`);
  } catch (err) {
    console.error('Backfill error:', err);
  } finally {
    client.release();
    pool.end();
  }
}

backfill();
