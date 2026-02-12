const { pool } = require('../config/db');

const setupQuotations = async () => {
    const client = await pool.connect();
    try {
        console.log('Starting Quotations database setup...');

        // 1. Create quotations table
        console.log('Creating quotations table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS quotations (
                id SERIAL PRIMARY KEY,
                quotation_number VARCHAR(50) UNIQUE NOT NULL,
                customer_id INTEGER REFERENCES customers(id),
                branch_id INTEGER REFERENCES branches(id),
                total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
                status VARCHAR(20) DEFAULT 'Pending', -- Pending, Converted, Expired, Cancelled
                valid_until DATE,
                notes TEXT,
                created_by UUID REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP
            );
        `);

        // 2. Create quotation_items table
        console.log('Creating quotation_items table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS quotation_items (
                id SERIAL PRIMARY KEY,
                quotation_id INTEGER REFERENCES quotations(id) ON DELETE CASCADE,
                product_id INTEGER REFERENCES products(id),
                quantity INTEGER NOT NULL,
                unit_price DECIMAL(15,2) NOT NULL,
                subtotal DECIMAL(15,2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('Quotations setup completed successfully!');
    } catch (err) {
        console.error('Error setting up quotations:', err);
    } finally {
        client.release();
        process.exit();
    }
};

setupQuotations();
