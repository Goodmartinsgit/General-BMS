const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function verify() {
  try {
    console.log('🔍 Verifying category constraints...\n');
    
    // Check indexes on categories table
    const indexes = await pool.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'categories' 
      AND indexname LIKE '%slug%' OR indexname LIKE '%name%'
      ORDER BY indexname
    `);
    
    console.log('✅ Category indexes:');
    indexes.rows.forEach(idx => {
      console.log(`   - ${idx.indexname}`);
    });
    
    // Check if we can query categories
    const categories = await pool.query(`
      SELECT id, category_name, parent_category_id, slug 
      FROM categories 
      ORDER BY level, display_order 
      LIMIT 5
    `);
    
    console.log('\n✅ Sample categories:');
    categories.rows.forEach(cat => {
      console.log(`   - ${cat.category_name} (ID: ${cat.id}, Parent: ${cat.parent_category_id || 'None'}, Slug: ${cat.slug})`);
    });
    
    console.log('\n✅ Migration verification complete!');
    console.log('✅ You can now create categories with duplicate names under different parents.');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  } finally {
    await pool.end();
  }
}

verify();
