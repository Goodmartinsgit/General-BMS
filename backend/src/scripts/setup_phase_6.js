const { pool } = require('../config/db');

const setupSchema = async () => {
    try {
        console.log('Starting Phase 6 Schema Setup...');

        // 1. Budget Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS budgets (
                id SERIAL PRIMARY KEY,
                branch_id INTEGER REFERENCES branches(id) ON DELETE CASCADE,
                category_id INTEGER, 
                amount DECIMAL(15, 2) NOT NULL,
                month INTEGER NOT NULL,
                year INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Budgets table created/verified');

        // 2. Budget Line Items (Granular tracking)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS budget_line_items (
                id SERIAL PRIMARY KEY,
                budget_id INTEGER REFERENCES budgets(id) ON DELETE CASCADE,
                expense_category VARCHAR(100),
                allocated_amount DECIMAL(15, 2) NOT NULL,
                spent_amount DECIMAL(15, 2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Budget line items table created/verified');

        // 3. Payment Allocations
        await pool.query(`
            CREATE TABLE IF NOT EXISTS payment_allocations (
                id SERIAL PRIMARY KEY,
                sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
                wholesale_order_id INTEGER REFERENCES wholesale_orders(id) ON DELETE CASCADE,
                amount DECIMAL(15, 2) NOT NULL,
                allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Payment allocations table created/verified');

        console.log('🚀 Phase 6 Schema Setup Complete!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error setting up Phase 6 schema:', err);
        process.exit(1);
    }
};

setupSchema();
