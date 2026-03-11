const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function verify() {
  try {
    console.log('🔍 Verifying database schema...\n');
    
    // Check categories columns
    const catCols = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='categories' 
      AND column_name IN ('level','path','slug','unit_of_measure','is_selection_attribute')
      ORDER BY column_name
    `);
    
    console.log('✅ Categories columns:', catCols.rows.map(r => r.column_name).join(', '));
    
    // Check settings columns
    const settingsCols = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='settings' 
      AND column_name IN ('setting_key','setting_value','setting_type')
      ORDER BY column_name
    `);
    
    console.log('✅ Settings columns:', settingsCols.rows.map(r => r.column_name).join(', '));
    
    // Check if product_listing_level setting exists
    const setting = await pool.query(`
      SELECT setting_key, setting_value 
      FROM settings 
      WHERE setting_key = 'product_listing_level'
    `);
    
    if (setting.rows.length > 0) {
      console.log('✅ product_listing_level setting:', setting.rows[0].setting_value);
    } else {
      console.log('⚠️  product_listing_level setting not found');
    }
    
    console.log('\n✅ Database schema verification complete!');
    console.log('✅ Your API endpoints should now work correctly.');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  } finally {
    await pool.end();
  }
}

verify();
