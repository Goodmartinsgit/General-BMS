const { pool } = require('../config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        const migrationPath = path.join(__dirname, '../../database/migrations/004_create_returns_tables.sql');
        const sql = fs.readFileSync(migrationPath, 'utf-8');

        console.log('Running returns tables migration...');
        await pool.query(sql);
        console.log('✓ Returns tables created successfully!');

        // Verify tables were created
        const result = await pool.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN ('return_reasons', 'sales_returns', 'sales_return_items', 'product_exchanges', 'exchange_items')
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
