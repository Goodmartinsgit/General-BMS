const { pool } = require('../config/db');

async function showMigrationStatus() {
  const client = await pool.connect();
  
  try {
    console.log('=== Database Migration Status ===\n');

    // Check if migrations table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'schema_migrations'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('⚠️  No migrations have been run yet.');
      console.log('Run: npm run migrate:all\n');
      return;
    }

    // Get executed migrations
    const migrations = await client.query(`
      SELECT migration_name, executed_at 
      FROM schema_migrations 
      ORDER BY executed_at DESC
    `);

    console.log(`Total migrations executed: ${migrations.rows.length}\n`);
    console.log('--- Recently Executed Migrations ---\n');
    
    migrations.rows.slice(0, 10).forEach((row, index) => {
      const date = new Date(row.executed_at).toLocaleString();
      console.log(`${(index + 1).toString().padStart(2)}. ${row.migration_name.padEnd(45)} ${date}`);
    });

    if (migrations.rows.length > 10) {
      console.log(`\n... and ${migrations.rows.length - 10} more`);
    }

    // Database statistics
    console.log('\n--- Database Statistics ---\n');

    const stats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as total_tables,
        (SELECT COUNT(*) FROM products) as total_products,
        (SELECT COUNT(*) FROM customers) as total_customers,
        (SELECT COUNT(*) FROM sales) as total_sales,
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM branches) as total_branches,
        (SELECT COUNT(*) FROM product_colors) as total_product_colors,
        (SELECT COUNT(*) FROM product_images_v2) as total_product_images
    `);

    const s = stats.rows[0];
    console.log(`Tables:          ${s.total_tables}`);
    console.log(`Products:        ${s.total_products}`);
    console.log(`Customers:       ${s.total_customers}`);
    console.log(`Sales:           ${s.total_sales}`);
    console.log(`Users:           ${s.total_users}`);
    console.log(`Branches:        ${s.total_branches}`);
    console.log(`Product Colors:  ${s.total_product_colors}`);
    console.log(`Product Images:  ${s.total_product_images}`);

    console.log('\n=== Status Check Complete ===\n');

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

showMigrationStatus();
