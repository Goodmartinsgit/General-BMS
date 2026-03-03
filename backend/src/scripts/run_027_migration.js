/**
 * Run migration 027: Single Super Admin Constraint
 * Pins admin@generalbms.com as the only Super Admin and adds a DB trigger
 * to prevent any future Super Admin duplicates.
 *
 * Usage (from backend/ directory): node src/scripts/run_027_migration.js
 */

const fs   = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function run() {
  const sqlPath = path.join(__dirname, '../../database/migrations/027_single_super_admin.sql');
  const sql     = fs.readFileSync(sqlPath, 'utf8');

  const client = await pool.connect();
  try {
    console.log('Applying migration 027: Single Super Admin Constraint...');
    await client.query(sql);
    console.log('✅ Migration 027 applied successfully!');
    console.log('   - admin@generalbms.com pinned to Super Admin role');
    console.log('   - Extra Super Admin users demoted to Admin');
    console.log('   - DB trigger installed to prevent future duplicates');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
