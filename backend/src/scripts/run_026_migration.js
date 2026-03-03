/**
 * Run migration 026: User Hierarchy Enhancements
 * Adds role_level to roles table and security fields to users table.
 *
 * Usage: node backend/src/scripts/run_026_migration.js
 */

const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function run() {
  const sqlPath = path.join(__dirname, '../../database/migrations/026_user_hierarchy_enhancements.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const client = await pool.connect();
  try {
    console.log('Applying migration 026: User Hierarchy Enhancements...');
    await client.query(sql);
    console.log('✅ Migration 026 applied successfully!');
    console.log('   - Added role_level column to roles table');
    console.log('   - Auto-assigned levels to existing roles');
    console.log('   - Added status, failed_login_attempts, locked_at,');
    console.log('     lock_reason, require_password_change, last_password_change');
    console.log('     to users table');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
