const { pool } = require('../config/db');

async function testQueries() {
  try {
    // Test getAllSales query
    const result = await pool.query(`
      SELECT s.*, b.branch_name, c.customer_name, u.full_name as salesperson,
             r.full_name as referrer_name, p.promotion_name,
             CASE WHEN s.reversed_at IS NOT NULL THEN true ELSE false END as is_reversed
      FROM sales s
      JOIN branches b ON s.branch_id = b.id
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.processed_by = u.id
      LEFT JOIN referrers r ON s.referrer_id = r.id
      LEFT JOIN promotions p ON s.promotion_id = p.id
      WHERE 1=1 AND s.reversed_at IS NULL
      ORDER BY s.created_at DESC
    `);
    console.log('getAllSales OK, rows:', result.rows.length);

    // Test getSaleById query
    const result2 = await pool.query(`
      SELECT s.*, b.branch_name, c.customer_name, c.phone_number, c.email,
             u.full_name as salesperson, r.full_name as referrer_name, p.promotion_name,
             rv.full_name as reversed_by_name, un.full_name as unreversed_by_name,
             CASE WHEN s.reversed_at IS NOT NULL THEN true ELSE false END as is_reversed
      FROM sales s
      JOIN branches b ON s.branch_id = b.id
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.processed_by = u.id
      LEFT JOIN referrers r ON s.referrer_id = r.id
      LEFT JOIN promotions p ON s.promotion_id = p.id
      LEFT JOIN users rv ON s.reversed_by = rv.id
      LEFT JOIN users un ON s.unreversed_by = un.id
      WHERE s.id = 1
    `);
    console.log('getSaleById OK');

    // Test products compact query
    const result3 = await pool.query(`
      SELECT p.id, p.product_code, p.product_name, p.retail_price, p.product_images, p.is_active,
             b.brand_name, c.category_name
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true AND p.deleted_at IS NULL
      ORDER BY p.created_at DESC LIMIT 20 OFFSET 0
    `);
    console.log('Products compact OK, rows:', result3.rows.length);

    // Test stock transfers
    const result4 = await pool.query(`
      SELECT st.*, fb.branch_name as from_branch_name, tb.branch_name as to_branch_name,
             u.full_name as initiated_by_name, au.full_name as approved_by_name,
             ru.full_name as received_by_name
      FROM stock_transfers st
      JOIN branches fb ON st.from_branch_id = fb.id
      JOIN branches tb ON st.to_branch_id = tb.id
      LEFT JOIN users u ON st.initiated_by = u.id
      LEFT JOIN users au ON st.approved_by = au.id
      LEFT JOIN users ru ON st.received_by = ru.id
      ORDER BY st.created_at DESC
    `);
    console.log('Stock transfers OK, rows:', result4.rows.length);

    console.log('\nAll queries passed!');
    await pool.end();
  } catch (err) {
    console.error('FAILED:', err.message);
    await pool.end();
    process.exit(1);
  }
}

testQueries();
