const { query } = require('./src/config/db');

async function run() {
  try {
    await query("DELETE FROM settings WHERE setting_key = 'product_listing_level';");
    await query("ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_listing_category BOOLEAN DEFAULT FALSE;");
    await query("ALTER TABLE product_category_assignments ADD COLUMN IF NOT EXISTS cost_price_override DECIMAL(15,2), ADD COLUMN IF NOT EXISTS image_url VARCHAR(255);");
    console.log('Migration successful.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

run();
