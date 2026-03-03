/**
 * Store Setup Script
 * - Applies migrations 019 (store_config) and 023 (product online fields)
 * - Seeds a default store config row (slug = 'default')
 * - Enables is_online_available on all existing active products so the store shows something
 *
 * Usage (from backend/ directory): node src/scripts/run_store_setup.js
 */

const fs   = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function run() {
  const client = await pool.connect();
  try {
    console.log('Running store setup...\n');

    // ── 1. Migration 019 — store_config table ─────────────────────────────────
    console.log('Step 1: Applying migration 019 (store_config table)...');
    const sql019 = fs.readFileSync(
      path.join(__dirname, '../../database/migrations/019_create_store_config.sql'),
      'utf8'
    );
    await client.query(sql019);
    console.log('  ✅ Migration 019 applied (table already exists if re-run)\n');

    // ── 2. Migration 023 — product slug + is_online_available ─────────────────
    console.log('Step 2: Applying migration 023 (product slug / online fields)...');
    const sql023 = fs.readFileSync(
      path.join(__dirname, '../../database/migrations/023_add_product_slug_online.sql'),
      'utf8'
    );
    await client.query(sql023);
    console.log('  ✅ Migration 023 applied\n');

    // ── 3. Seed store config ──────────────────────────────────────────────────
    console.log('Step 3: Seeding default store config (slug = "default")...');
    await client.query(`
      INSERT INTO store_config (store_slug, store_name, tagline, is_active, currency)
      VALUES ('default', 'General BMS Store', 'Quality products at great prices', true, 'NGN')
      ON CONFLICT (store_slug) DO NOTHING
    `);
    const configRes = await client.query(`SELECT id, store_slug, store_name FROM store_config WHERE store_slug = 'default'`);
    console.log('  ✅ Store config:', configRes.rows[0], '\n');

    // ── 4. Enable is_online_available for all active products ─────────────────
    console.log('Step 4: Marking all active products as online-available...');
    const updateRes = await client.query(`
      UPDATE products
      SET is_online_available = true
      WHERE deleted_at IS NULL AND is_active = true AND is_online_available = false
    `);
    console.log(`  ✅ ${updateRes.rowCount} product(s) now marked as online-available\n`);

    // ── 5. Generate slugs for any products still missing one ──────────────────
    console.log('Step 5: Generating slugs for products missing them...');
    const slugRes = await client.query(`
      UPDATE products
      SET slug = LOWER(
        REGEXP_REPLACE(
          REGEXP_REPLACE(product_name, '[^a-zA-Z0-9\\s-]', '', 'g'),
          '\\s+', '-', 'g'
        )
      ) || '-' || id
      WHERE slug IS NULL AND deleted_at IS NULL
    `);
    console.log(`  ✅ ${slugRes.rowCount} product(s) received new slugs\n`);

    // ── Summary ───────────────────────────────────────────────────────────────
    const totals = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM products WHERE is_online_available = true AND deleted_at IS NULL) as online_products,
        (SELECT COUNT(*) FROM products WHERE deleted_at IS NULL)                                as total_products,
        (SELECT COUNT(*) FROM store_config WHERE is_active = true)                             as active_stores
    `);
    console.log('Store setup complete!');
    console.log(`  Online products : ${totals.rows[0].online_products} / ${totals.rows[0].total_products}`);
    console.log(`  Active stores   : ${totals.rows[0].active_stores}`);
    console.log('\nYou can access the store at: http://localhost:3006  (add ?tenant=default if slug not auto-detected)');

  } catch (err) {
    console.error('❌ Store setup failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
