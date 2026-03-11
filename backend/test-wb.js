/**
 * test-wb.js  — diagnose website_pages 500 error
 * Run: node test-wb.js
 */
require('dotenv').config();
const { pool } = require('./src/config/db');

async function run() {
  const client = await pool.connect();
  try {
    // 1. Does the table exist?
    const { rows: tables } = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'website_pages'
    `);
    if (tables.length === 0) {
      console.log('❌  website_pages table does NOT exist — run migration 024');
      return;
    }
    console.log('✅  website_pages table exists');

    // 2. Does the organizations table have rows?
    const { rows: orgs } = await client.query(`SELECT id FROM organizations LIMIT 3`);
    console.log(`✅  organizations rows: ${orgs.length}`, orgs.map(r => r.id));

    if (orgs.length === 0) {
      console.log('❌  No organizations found — org_id FK will fail on insert');
      return;
    }

    const testOrgId = orgs[0].id;

    // 3. Try a test insert
    const { rows } = await client.query(
      `INSERT INTO website_pages
         (org_id, title, slug, page_type, is_active, show_in_nav, nav_label, nav_order)
       VALUES ($1, $2, $3, 'custom', true, false, $2, 0)
       RETURNING id, title, slug`,
      [testOrgId, 'Test Page ' + Date.now(), 'test-' + Date.now()]
    );
    console.log('✅  Test insert succeeded:', rows[0]);

    // Clean up
    await client.query('DELETE FROM website_pages WHERE id = $1', [rows[0].id]);
    console.log('✅  Cleanup done — everything looks good!');

  } catch (err) {
    console.error('❌  Error:', err.message);
    console.error('    Code:', err.code);
    console.error('    Detail:', err.detail);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
