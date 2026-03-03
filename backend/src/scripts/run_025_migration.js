const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function run() {
  const client = await pool.connect();
  try {
    const file = '025_extend_store_config.sql';
    const sql = fs.readFileSync(path.join(__dirname, '../../database/migrations', file), 'utf8');
    console.log(`Running ${file}...`);
    await client.query(sql);
    console.log('Done — store_config extended with home_sections, header_config, footer_config.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}
run();
