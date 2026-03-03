const { pool } = require('../config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        const migrationPath = path.join(__dirname, '../../database/migrations/003_create_wholesale_orders.sql');
        const sql = fs.readFileSync(migrationPath, 'utf-8');

        console.log('Running wholesale orders migration...');
        await pool.query(sql);
        console.log('✓ Wholesale orders tables created successfully!');

        // Verify tables were created
        const result = await pool.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN ('wholesale_orders', 'wholesale_order_items')
            ORDER BY table_name
        `);

        console.log('\nCreated tables:');
        result.rows.forEach(row => console.log(`  - ${row.table_name}`));

        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error.message);
        process.exit(1);
    }
}

runMigration();
