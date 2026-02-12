const { pool } = require('../config/db');


async function setupBankChannels() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('Creating bank_channels table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS bank_channels (
                id SERIAL PRIMARY KEY,
                channel_name VARCHAR(100) NOT NULL,
                bank_name VARCHAR(100),
                account_number VARCHAR(50),
                account_name VARCHAR(100),
                initial_balance DECIMAL(15, 2) DEFAULT 0,
                current_balance DECIMAL(15, 2) DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);

        console.log('Creating cash_flow table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS cash_flow (
                id SERIAL PRIMARY KEY,
                channel_id INTEGER REFERENCES bank_channels(id),
                type VARCHAR(10) NOT NULL CHECK (type IN ('inflow', 'outflow')),
                amount DECIMAL(15, 2) NOT NULL,
                source VARCHAR(50), -- 'sale', 'expense', 'commission', 'wholesale', 'manual'
                reference_id INTEGER,
                reference_number VARCHAR(100),
                description TEXT,
                balance_after DECIMAL(15, 2) NOT NULL,
                performed_by UUID REFERENCES users(id),

                created_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // Add channel_id to sales and expenses if they don't exist
        console.log('Updating sales and expenses tables...');
        await client.query(`
            ALTER TABLE sales ADD COLUMN IF NOT EXISTS channel_id INTEGER REFERENCES bank_channels(id);
            ALTER TABLE expenses ADD COLUMN IF NOT EXISTS channel_id INTEGER REFERENCES bank_channels(id);
        `);

        // Seed default channel if none exists
        const channelCheck = await client.query('SELECT id FROM bank_channels LIMIT 1');
        if (channelCheck.rows.length === 0) {
            console.log('Seeding default Cash channel...');
            await client.query(`
                INSERT INTO bank_channels (channel_name, bank_name, initial_balance, current_balance)
                VALUES ('Main Cash Drawer', 'Internal', 0, 0)
            `);
        }

        await client.query('COMMIT');
        console.log('Bank Channels and Cash Flow system setup successfully!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error setting up bank channels:', err);
    } finally {
        client.release();
    }
}

setupBankChannels().then(() => process.exit());
