const { pool } = require('../config/db');

async function checkDatabaseHealth() {
  const client = await pool.connect();
  try {
    console.log('=== Database Health Check ===\n');

    // Core tables to check
    const coreTables = [
      'users',
      'roles',
      'organizations',
      'branches',
      'products',
      'categories',
      'brands',
      'inventory',
      'customers',
      'sales',
      'sale_items',
      'product_colors',
      'product_images_v2',
      'inventory_colors'
    ];

    console.log('Checking core tables...\n');
    
    for (const tableName of coreTables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        );
      `, [tableName]);
      
      const exists = result.rows[0].exists;
      const status = exists ? '✓' : '✗';
      const color = exists ? '\x1b[32m' : '\x1b[31m';
      const reset = '\x1b[0m';
      
      console.log(`${color}${status}${reset} ${tableName.padEnd(25)} ${exists ? 'EXISTS' : 'MISSING'}`);
    }

    // Check for products with colors
    console.log('\n--- Product Statistics ---\n');
    
    const productCount = await client.query('SELECT COUNT(*) FROM products');
    console.log(`Total Products: ${productCount.rows[0].count}`);
    
    const colorCount = await client.query('SELECT COUNT(*) FROM product_colors');
    console.log(`Total Product Colors: ${colorCount.rows[0].count}`);
    
    const imageCount = await client.query('SELECT COUNT(*) FROM product_images_v2');
    console.log(`Total Product Images: ${imageCount.rows[0].count}`);

    // Check database connection pool
    console.log('\n--- Connection Pool ---\n');
    console.log(`Total connections: ${pool.totalCount}`);
    console.log(`Idle connections: ${pool.idleCount}`);
    console.log(`Waiting requests: ${pool.waitingCount}`);

    console.log('\n=== Health Check Complete ===\n');

  } catch (err) {
    console.error('\n❌ Health check error:', err.message);
    console.error('Full error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

checkDatabaseHealth();
