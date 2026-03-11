const fs = require('fs');
const path = require('path');
const { query } = require('../config/db');

async function checkAndApplyCategoryMigration() {
  try {
    // Check if the 'level' column exists in 'categories' table
    const checkResult = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='categories' AND column_name='level';
    `);

    if (checkResult.rows.length === 0) {
      console.log('Category hierarchy columns not found. Running migration 033...');
      
      const sqlPath = path.join(__dirname, '../../database/migrations/033_hierarchical_categories.sql');
      const sql = fs.readFileSync(sqlPath, 'utf8');
      
      await query(sql);
      console.log('Migration 033 applied successfully.');
    } else {
      console.log('Category hierarchy migration check: OK.');
    }
  } catch (err) {
    console.error('Error applying category migration on startup:', err);
  }
}

module.exports = checkAndApplyCategoryMigration;
