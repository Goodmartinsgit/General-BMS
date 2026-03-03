/**
 * run_website_builder_migration.js
 * Applies migration 024 (website builder tables).
 * Run: node backend/src/scripts/run_website_builder_migration.js
 */
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

const MIGRATIONS_DIR = path.join(__dirname, '../../database/migrations');

async function run() {
  const client = await pool.connect();
  try {
    const file = '024_create_website_builder.sql';
    const filePath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`Running ${file}...`);
    await client.query(sql);
    console.log(`Done — website builder tables created successfully.`);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
