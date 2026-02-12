const { pool } = require('../config/db');

const fixSchema = async () => {
    try {
        console.log('Fixing Database Schema...');

        // 1. Rename orders to wholesale_orders if it exists and wholesale_orders doesn't
        await pool.query(`
            DO $$ 
            BEGIN
                IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders') 
                AND NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'wholesale_orders') THEN
                    ALTER TABLE orders RENAME TO wholesale_orders;
                END IF;
            END $$;
        `);
        console.log('✅ Checked/Renamed wholesale_orders');

        // 2. Rename order_items to wholesale_order_items
        await pool.query(`
            DO $$ 
            BEGIN
                IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'order_items') 
                AND NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'wholesale_order_items') THEN
                    ALTER TABLE order_items RENAME TO wholesale_order_items;
                END IF;
            END $$;
        `);
        console.log('✅ Checked/Renamed wholesale_order_items');

        // 3. Ensure branch_id and other necessary columns exist in wholesale_orders
        // Note: The previous inspection showed orders had branch_id missing? (Wait, let me check that again)
        // Inspection output showed: id, order_number, customer_id, order_type, order_date, status, subtotal, tax_amount, total_amount, total_weight, delivery_address_id, special_instructions, processed_by, confirmed_at, dispatched_at, delivered_at, completed_at, cancelled_at, created_at, updated_at.
        // It's missing branch_id and created_by (it has processed_by).
        
        await pool.query(`
            ALTER TABLE wholesale_orders ADD COLUMN IF NOT EXISTS branch_id INTEGER REFERENCES branches(id);
            ALTER TABLE wholesale_orders ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
            ALTER TABLE wholesale_orders ADD COLUMN IF NOT EXISTS payment_terms_days INTEGER DEFAULT 0;
            ALTER TABLE wholesale_orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
        `);
        console.log('✅ Enhanced wholesale_orders table');

        // 4. Create Payment Allocations (Now it will work)
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

        // 5. Create Budgets and Budget Line Items
        await pool.query(`
            CREATE TABLE IF NOT EXISTS budgets (
                id SERIAL PRIMARY KEY,
                branch_id INTEGER REFERENCES branches(id) ON DELETE CASCADE,
                name VARCHAR(255),
                total_amount DECIMAL(15, 2) NOT NULL,
                month INTEGER NOT NULL,
                year INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS budget_line_items (
                id SERIAL PRIMARY KEY,
                budget_id INTEGER REFERENCES budgets(id) ON DELETE CASCADE,
                expense_category_id INTEGER REFERENCES expense_categories(id),
                allocated_amount DECIMAL(15, 2) NOT NULL,
                spent_amount DECIMAL(15, 2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Budget tables created/verified');

        console.log('🚀 Schema Fix Complete!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error fixing schema:', err);
        process.exit(1);
    }
};

fixSchema();
