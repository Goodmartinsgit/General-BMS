const { pool } = require('../config/db');
const fs = require('fs');
const path = require('path');

async function runProductColorsMigration() {
  const client = await pool.connect();
  try {
    console.log('Starting product colors and images migration...\n');

    // Read the migration file
    const migrationPath = path.join(__dirname, '../../database/migrations/add_product_colors_and_images.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute the migration
    await client.query(migrationSQL);

    console.log('✓ Product colors and images tables created successfully');
    console.log('✓ Indexes created');
    console.log('✓ Triggers created');
    console.log('✓ has_colors column added to products table');
    
    console.log('\n=== Migration completed successfully! ===\n');

  } catch (err) {
    console.error('Migration error:', err.message);
    console.error('Full error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runProductColorsMigration();
