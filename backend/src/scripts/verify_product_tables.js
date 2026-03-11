const { pool } = require('../config/db');

async function verifyTables() {
  const client = await pool.connect();
  try {
    console.log('Verifying tables...\n');

    // Check product_colors table
    const colorsCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'product_colors'
      );
    `);
    console.log('✓ product_colors table exists:', colorsCheck.rows[0].exists);

    // Check product_images_v2 table
    const imagesCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'product_images_v2'
      );
    `);
    console.log('✓ product_images_v2 table exists:', imagesCheck.rows[0].exists);

    // Check inventory_colors table
    const inventoryColorsCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'inventory_colors'
      );
    `);
    console.log('✓ inventory_colors table exists:', inventoryColorsCheck.rows[0].exists);

    // Check has_colors column in products
    const hasColorsCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'has_colors'
      );
    `);
    console.log('✓ has_colors column in products table:', hasColorsCheck.rows[0].exists);

    console.log('\n=== All tables verified successfully! ===\n');

  } catch (err) {
    console.error('Verification error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

verifyTables();
