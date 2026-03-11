const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkColumns() {
  try {
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='categories' 
      AND column_name IN ('level','path','slug','unit_of_measure','is_selection_attribute')
    `);
    
    console.log('Categories table columns found:', result.rows.map(r => r.column_name));
    
    if (result.rows.length < 5) {
      console.log('\n⚠️  Missing columns detected. Running migration 033...');
      const fs = require('fs');
      const path = require('path');
      const migrationPath = path.join(__dirname, '../../database/migrations/033_hierarchical_categories.sql');
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      await pool.query(migrationSQL);
      console.log('✅ Migration 033 completed!');
    } else {
      console.log('✅ All required columns exist');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkColumns();
