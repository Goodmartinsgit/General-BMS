const { pool } = require('../config/db');

async function applyMigrations() {
  const client = await pool.connect();
  try {
    // Create product_variant_options
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_variant_options (
        id SERIAL PRIMARY KEY,
        option_name VARCHAR(100) UNIQUE NOT NULL,
        option_type VARCHAR(20) DEFAULT 'text',
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);
    console.log('Created product_variant_options');

    // Create product_variant_values
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_variant_values (
        id SERIAL PRIMARY KEY,
        option_id INTEGER REFERENCES product_variant_options(id) ON DELETE CASCADE,
        value_name VARCHAR(100) NOT NULL,
        value_code VARCHAR(50),
        hex_color VARCHAR(7),
        image_url TEXT,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(option_id, value_name)
      )`);
    console.log('Created product_variant_values');

    // Create product_variants
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_variants (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        sku VARCHAR(100) UNIQUE NOT NULL,
        variant_name VARCHAR(255),
        variant_values JSONB NOT NULL DEFAULT '{}',
        price_adjustment DECIMAL(15,2) DEFAULT 0,
        retail_price DECIMAL(15,2),
        wholesale_price DECIMAL(15,2),
        cost_price DECIMAL(15,2),
        barcode VARCHAR(100),
        weight_per_unit DECIMAL(10,3),
        image_url TEXT,
        is_default BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        reorder_level INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);
    console.log('Created product_variants');

    // Create variant_inventory
    await client.query(`
      CREATE TABLE IF NOT EXISTS variant_inventory (
        id SERIAL PRIMARY KEY,
        variant_id INTEGER REFERENCES product_variants(id) ON DELETE CASCADE,
        branch_id INTEGER REFERENCES branches(id) ON DELETE CASCADE,
        quantity_on_hand INTEGER DEFAULT 0,
        quantity_reserved INTEGER DEFAULT 0,
        branch_price_override DECIMAL(15,2),
        last_restock_date TIMESTAMP,
        last_counted_at TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(variant_id, branch_id)
      )`);
    console.log('Created variant_inventory');

    // Create promotions
    await client.query(`
      CREATE TABLE IF NOT EXISTS promotions (
        id SERIAL PRIMARY KEY,
        promotion_code VARCHAR(50) UNIQUE NOT NULL,
        promotion_name VARCHAR(150) NOT NULL,
        description TEXT,
        promotion_type VARCHAR(30) NOT NULL,
        discount_percentage DECIMAL(5,2),
        discount_amount DECIMAL(15,2),
        buy_quantity INTEGER,
        get_quantity INTEGER,
        min_purchase_amount DECIMAL(15,2),
        min_quantity INTEGER,
        max_discount_amount DECIMAL(15,2),
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        usage_limit INTEGER,
        usage_per_customer INTEGER DEFAULT 1,
        current_usage_count INTEGER DEFAULT 0,
        applicable_to VARCHAR(20) DEFAULT 'all',
        applicable_products JSONB DEFAULT '[]',
        applicable_categories JSONB DEFAULT '[]',
        applicable_customers JSONB DEFAULT '[]',
        applicable_branches JSONB DEFAULT '[]',
        stackable BOOLEAN DEFAULT FALSE,
        priority INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);
    console.log('Created promotions');

    // Create promotion_usage
    await client.query(`
      CREATE TABLE IF NOT EXISTS promotion_usage (
        id SERIAL PRIMARY KEY,
        promotion_id INTEGER REFERENCES promotions(id) ON DELETE CASCADE,
        sale_id INTEGER REFERENCES sales(id),
        customer_id INTEGER REFERENCES customers(id),
        discount_applied DECIMAL(15,2) NOT NULL,
        used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);
    console.log('Created promotion_usage');

    // Create referrers
    await client.query(`
      CREATE TABLE IF NOT EXISTS referrers (
        id SERIAL PRIMARY KEY,
        referrer_code VARCHAR(50) UNIQUE NOT NULL,
        referrer_name VARCHAR(150) NOT NULL,
        referrer_type VARCHAR(20) DEFAULT 'individual',
        contact_person VARCHAR(100),
        phone_number VARCHAR(20),
        email VARCHAR(100),
        address TEXT,
        commission_rate DECIMAL(5, 2) DEFAULT 0,
        commission_type VARCHAR(20) DEFAULT 'percentage',
        fixed_commission_amount DECIMAL(15, 2),
        payment_terms VARCHAR(100),
        bank_account_name VARCHAR(100),
        bank_account_number VARCHAR(50),
        bank_name VARCHAR(100),
        total_referrals INTEGER DEFAULT 0,
        total_commission_earned DECIMAL(15, 2) DEFAULT 0,
        total_commission_paid DECIMAL(15, 2) DEFAULT 0,
        commission_balance DECIMAL(15, 2) DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      )`);
    console.log('Created referrers');

    // Create serial_numbers
    await client.query(`
      CREATE TABLE IF NOT EXISTS serial_numbers (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id),
        variant_id INTEGER,
        serial_number VARCHAR(100) UNIQUE NOT NULL,
        batch_number VARCHAR(100),
        manufacturing_date DATE,
        expiry_date DATE,
        warranty_months INTEGER,
        warranty_start_date DATE,
        warranty_expiry_date DATE,
        status VARCHAR(20) DEFAULT 'in_stock',
        condition VARCHAR(20) DEFAULT 'new',
        branch_id INTEGER REFERENCES branches(id),
        supplier_id INTEGER REFERENCES suppliers(id),
        sale_id INTEGER REFERENCES sales(id),
        sale_item_id INTEGER REFERENCES sale_items(id),
        sold_date TIMESTAMP,
        customer_id INTEGER REFERENCES customers(id),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);
    console.log('Created serial_numbers');

    // Create sale_item_serials
    await client.query(`
      CREATE TABLE IF NOT EXISTS sale_item_serials (
        id SERIAL PRIMARY KEY,
        sale_item_id INTEGER REFERENCES sale_items(id) ON DELETE CASCADE,
        serial_number_id INTEGER REFERENCES serial_numbers(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);
    console.log('Created sale_item_serials');

    // Create product_batches
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_batches (
        id SERIAL PRIMARY KEY,
        batch_number VARCHAR(100) UNIQUE NOT NULL,
        product_id INTEGER REFERENCES products(id),
        variant_id INTEGER,
        manufacturing_date DATE,
        expiry_date DATE,
        initial_quantity INTEGER NOT NULL,
        current_quantity INTEGER DEFAULT 0,
        supplier_id INTEGER REFERENCES suppliers(id),
        unit_cost DECIMAL(15,2),
        status VARCHAR(20) DEFAULT 'active',
        quality_status VARCHAR(20) DEFAULT 'passed',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);
    console.log('Created product_batches');

    // Create product_tags
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_tags (
        id SERIAL PRIMARY KEY,
        tag_name VARCHAR(100) UNIQUE NOT NULL,
        tag_color VARCHAR(20),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);
    console.log('Created product_tags');

    // Create product_tag_mappings
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_tag_mappings (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        tag_id INTEGER REFERENCES product_tags(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(product_id, tag_id)
      )`);
    console.log('Created product_tag_mappings');

    // Add FK constraints (ignore if they already exist)
    const fks = [
      { name: 'fk_sales_promotion', sql: 'ALTER TABLE sales ADD CONSTRAINT fk_sales_promotion FOREIGN KEY (promotion_id) REFERENCES promotions(id)' },
      { name: 'fk_sales_referrer', sql: 'ALTER TABLE sales ADD CONSTRAINT fk_sales_referrer FOREIGN KEY (referrer_id) REFERENCES referrers(id)' },
      { name: 'fk_sale_items_variant', sql: 'ALTER TABLE sale_items ADD CONSTRAINT fk_sale_items_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id)' },
      { name: 'fk_sale_items_batch', sql: 'ALTER TABLE sale_items ADD CONSTRAINT fk_sale_items_batch FOREIGN KEY (batch_id) REFERENCES product_batches(id)' },
      { name: 'fk_serial_variant', sql: 'ALTER TABLE serial_numbers ADD CONSTRAINT fk_serial_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id)' },
      { name: 'fk_batch_variant', sql: 'ALTER TABLE product_batches ADD CONSTRAINT fk_batch_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id)' },
    ];
    for (const fk of fks) {
      try {
        await client.query(fk.sql);
        console.log('Added FK:', fk.name);
      } catch (e) {
        console.log('FK skipped (exists):', fk.name);
      }
    }

    // Add product_type constraint if missing
    try {
      await client.query(`ALTER TABLE products DROP CONSTRAINT IF EXISTS products_product_type_check`);
      await client.query(`ALTER TABLE products ADD CONSTRAINT products_product_type_check CHECK (product_type IN ('physical', 'service', 'digital', 'bundle'))`);
      console.log('Added product_type constraint');
    } catch (e) {
      console.log('product_type constraint skipped:', e.message);
    }

    // Add has_variants and tracking columns to products
    await client.query(`ALTER TABLE products
      ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS track_serial_numbers BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS track_batches BOOLEAN DEFAULT FALSE`);
    console.log('Added variant/tracking columns to products');

    // Add unreverse_reason to sales
    await client.query(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS unreverse_reason TEXT`);
    console.log('Added unreverse_reason to sales');

    // ── Store Config extensions (migrations 030, 031, 032) ──────────────────
    await client.query(`ALTER TABLE store_config ADD COLUMN IF NOT EXISTS delivery_config JSONB DEFAULT '{}'`);
    console.log('Added delivery_config to store_config');

    await client.query(`ALTER TABLE store_config
      ADD COLUMN IF NOT EXISTS use_company_settings JSONB NOT NULL DEFAULT '{"general":true,"branding":true,"tax":true,"receipt":true,"payment":true,"notifications":true,"security":true,"display":true}',
      ADD COLUMN IF NOT EXISTS store_settings JSONB NOT NULL DEFAULT '{}'`);
    console.log('Added use_company_settings and store_settings to store_config');

    await client.query(`ALTER TABLE store_config
      ADD COLUMN IF NOT EXISTS hover_color       VARCHAR(20),
      ADD COLUMN IF NOT EXISTS active_text_color VARCHAR(20),
      ADD COLUMN IF NOT EXISTS sidebar_bg_color  VARCHAR(20),
      ADD COLUMN IF NOT EXISTS navbar_bg_color   VARCHAR(20),
      ADD COLUMN IF NOT EXISTS button_color      VARCHAR(20),
      ADD COLUMN IF NOT EXISTS logo_type         VARCHAR(50) DEFAULT 'image',
      ADD COLUMN IF NOT EXISTS sidebar_name_size VARCHAR(20) DEFAULT 'text-lg'`);
    console.log('Added branding columns to store_config');

    console.log('\n=== All migrations applied successfully! ===');

  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigrations();
