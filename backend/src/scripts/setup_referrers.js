const db = require('../config/db');

async function setup() {
  try {
    console.log('Starting Referrer system setup...');

    // 1. Create referrers table
    await db.query(`
      CREATE TABLE IF NOT EXISTS referrers (
        id SERIAL PRIMARY KEY,
        referrer_code VARCHAR(50) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL UNIQUE,
        email VARCHAR(255) UNIQUE,
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        commission_rate DECIMAL(5, 2) DEFAULT 5.00,
        commission_type VARCHAR(20) DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'fixed')),
        fixed_commission_amount DECIMAL(15, 2),
        total_referrals INTEGER DEFAULT 0,
        total_sales_value DECIMAL(15, 2) DEFAULT 0.00,
        total_commission_earned DECIMAL(15, 2) DEFAULT 0.00,
        total_commission_paid DECIMAL(15, 2) DEFAULT 0.00,
        commission_balance DECIMAL(15, 2) DEFAULT 0.00,
        bank_name VARCHAR(255),
        account_number VARCHAR(20),
        account_name VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        is_deleted BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        notes TEXT
      )
    `);
    console.log('- Created referrers table');

    // 2. Create commission_payments table
    await db.query(`
      CREATE TABLE IF NOT EXISTS commission_payments (
        id SERIAL PRIMARY KEY,
        payment_code VARCHAR(50) UNIQUE NOT NULL,
        referrer_id INTEGER NOT NULL REFERENCES referrers(id) ON DELETE RESTRICT,
        amount DECIMAL(15, 2) NOT NULL,
        payment_method VARCHAR(50),
        payment_date TIMESTAMP DEFAULT NOW(),
        reference_number VARCHAR(100),
        status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
        created_by UUID,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('- Created commission_payments table');

    // 3. Update customers table
    await db.query(`
      ALTER TABLE customers 
      ADD COLUMN IF NOT EXISTS referred_by INTEGER REFERENCES referrers(id) ON DELETE SET NULL
    `);
    console.log('- Updated customers table');

    // 4. Update sales table
    await db.query(`
      ALTER TABLE sales 
      ADD COLUMN IF NOT EXISTS referrer_id INTEGER REFERENCES referrers(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(15, 2) DEFAULT 0.00
    `);
    console.log('- Updated sales table');

    console.log('Setup completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Setup failed:', err);
    process.exit(1);
  }
}

setup();
