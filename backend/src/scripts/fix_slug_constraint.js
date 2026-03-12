const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixConstraint() {
  try {
    console.log('🔧 Removing old slug unique constraint...\n');
    
    // Drop the old unique constraint on slug
    await pool.query('ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_slug_key');
    
    console.log('✅ Old constraint removed successfully!');
    console.log('✅ Categories can now have duplicate names under different parents.');
    
  } catch (error) {
    console.error('❌ Failed:', error.message);
  } finally {
    await pool.end();
  }
}

fixConstraint();
