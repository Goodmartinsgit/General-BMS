/**
 * run_store_migrations.js
 * Applies all e-commerce store migrations (019–023) in order.
 * Run: node backend/src/scripts/run_store_migrations.js
 */
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

const MIGRATIONS = [
  '019_create_store_config.sql',
  '020_create_customer_auth_and_source.sql',
  '021_create_carts.sql',
  '022_create_online_orders.sql',
  '023_add_product_slug_online.sql',
];

const MIGRATIONS_DIR = path.join(__dirname, '../../database/migrations');

async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log('Running store migrations...\n');
    for (const file of MIGRATIONS) {
      const filePath = path.join(MIGRATIONS_DIR, file);
      if (!fs.existsSync(filePath)) {
        console.warn(`  SKIP  ${file} — file not found`);
        continue;
      }
      const sql = fs.readFileSync(filePath, 'utf8');
      try {
        await client.query(sql);
        console.log(`  OK    ${file}`);
      } catch (err) {
        console.error(`  FAIL  ${file}`);
        console.error(`        ${err.message}`);
        // Continue with remaining migrations
      }
    }
    console.log('\nStore migrations complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch(err => {
  console.error('Migration runner error:', err);
  process.exit(1);
});
