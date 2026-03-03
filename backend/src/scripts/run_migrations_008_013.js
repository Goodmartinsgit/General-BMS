const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

const migrationFiles = [
  '008_create_settings_table.sql',
  '009_create_fiscal_periods.sql',
  '010_create_tax_settings.sql',
  '011_create_branding_config.sql',
  '012_create_demo_config.sql',
  '013_enhance_receipt_config.sql',
];

async function runMigrations() {
  const client = await pool.connect();
  try {
    for (const file of migrationFiles) {
      const filePath = path.join(__dirname, '../../database/migrations', file);
      const sql = fs.readFileSync(filePath, 'utf8');
      console.log(`\n--- Running ${file} ---`);
      await client.query(sql);
      console.log(`✓ ${file} applied successfully`);
    }
    console.log('\n=== All migrations (008-013) applied successfully! ===');
  } catch (err) {
    console.error('\n✗ Migration error:', err.message);
    console.error('Detail:', err.detail || err.hint || '');
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
