const { pool } = require('./src/config/db');

async function restore() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT * FROM online_orders 
      WHERE status = 'CANCELLED' AND payment_status = 'PAID'
    `);
    
    let count = 0;
    for (const order of res.rows) {
      // Check if there is already a stock movement that says "Restored stock for historically cancelled paid order"
      // to avoid double restoring
      const checkDouble = await client.query(`
        SELECT id FROM stock_movements 
        WHERE reference_type = 'online_order' AND reference_id = $1::varchar AND movement_type = 'reversal' 
        AND notes LIKE 'Restored stock for historically cancelled paid order%'
      `, [order.id]);
      if (checkDouble.rows.length > 0) {
          console.log(`Skipping ${order.order_number} double restore check`);
          continue;
      }

      // also check if there is a sales record that is reversed
      const saleCheck = await client.query(`SELECT id, reversed_at FROM sales WHERE sale_number = $1`, [order.order_number]);
      if (saleCheck.rows.length > 0 && saleCheck.rows[0].reversed_at) {
          console.log(`Skipping ${order.order_number} sale check ${saleCheck.rows[0].reversed_at}`);
          continue;
      }

      const items = await client.query(`SELECT * FROM online_order_items WHERE order_id = $1`, [order.id]);
      
      for (const item of items.rows) {
        if (item.variant_id) {
           await client.query(`UPDATE variant_inventory SET quantity_on_hand = quantity_on_hand + $1 WHERE variant_id = $2`, [item.quantity, item.variant_id]);
        } else if (item.category_id) {
           await client.query(`UPDATE product_category_assignments SET stock_allocated = stock_allocated + $1 WHERE product_id = $2 AND category_id = $3`, [item.quantity, item.product_id, item.category_id]);
        } else {
           await client.query(`UPDATE inventory SET quantity_on_hand = quantity_on_hand + $1 WHERE product_id = $2`, [item.quantity, item.product_id]);
        }
        
        await client.query(`
          INSERT INTO stock_movements (product_id, movement_type, quantity, reference_type, reference_id, notes, category_id, variant_id, variant_name, created_at)
          VALUES ($1, 'reversal', $2, 'online_order', $3, $4, $5, $6, $7, NOW())
        `, [
          item.product_id, item.quantity, String(order.id),
          `Restored stock for historically cancelled paid order ${order.order_number}`,
          item.category_id || null, item.variant_id || null, item.variant_name || null
        ]);
      }
      console.log(`Restored stock for historic order: ${order.order_number}`);
      count++;
    }
    console.log(`Restored stock for ${count} orders.`);
  } catch(e) {
    console.error(e);
  } finally {
    client.release();
    pool.end();
  }
}
restore();
