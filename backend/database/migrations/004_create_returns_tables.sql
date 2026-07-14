-- Migration: Create Returns and Exchanges Tables
-- Description: Creates tables for managing sales returns and product exchanges

-- Create return_reasons table (or add missing columns if it already exists)
CREATE TABLE IF NOT EXISTS return_reasons (
    id SERIAL PRIMARY KEY,
    reason_code VARCHAR(50) UNIQUE NOT NULL,
    reason_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add description column if it was created by base schema without it
ALTER TABLE return_reasons ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE return_reasons ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;
ALTER TABLE return_reasons ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create sales_returns table
CREATE TABLE IF NOT EXISTS sales_returns (
    id SERIAL PRIMARY KEY,
    return_number VARCHAR(50) UNIQUE NOT NULL,
    original_sale_id INT REFERENCES sales(id),
    customer_id INT REFERENCES customers(id),
    branch_id INT NOT NULL REFERENCES branches(id),
    return_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    return_type VARCHAR(50) DEFAULT 'refund', -- refund, exchange, store_credit
    reason_id INT REFERENCES return_reasons(id),
    reason_notes TEXT,
    subtotal DECIMAL(15, 2) DEFAULT 0,
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    restocking_fee DECIMAL(15, 2) DEFAULT 0,
    refund_amount DECIMAL(15, 2) DEFAULT 0,
    store_credit_amount DECIMAL(15, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, completed, rejected
    processed_by UUID,
    approved_by UUID,
    approved_at TIMESTAMP,
    completed_at TIMESTAMP,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    notes TEXT,
    attachments JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create sales_return_items table
CREATE TABLE IF NOT EXISTS sales_return_items (
    id SERIAL PRIMARY KEY,
    return_id INT NOT NULL REFERENCES sales_returns(id) ON DELETE CASCADE,
    sale_item_id INT REFERENCES sale_items(id),
    product_id INT NOT NULL REFERENCES products(id),
    variant_id INT REFERENCES product_variants(id),
    product_name VARCHAR(255) NOT NULL,
    quantity_returned INT NOT NULL,
    return_condition VARCHAR(50) DEFAULT 'new', -- new, used, damaged
    restock BOOLEAN DEFAULT TRUE,
    unit_price DECIMAL(15, 2) NOT NULL,
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    refund_amount DECIMAL(15, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create product_exchanges table
CREATE TABLE IF NOT EXISTS product_exchanges (
    id SERIAL PRIMARY KEY,
    exchange_number VARCHAR(50) UNIQUE NOT NULL,
    return_id INT NOT NULL REFERENCES sales_returns(id),
    customer_id INT REFERENCES customers(id),
    branch_id INT NOT NULL REFERENCES branches(id),
    price_difference DECIMAL(15, 2) DEFAULT 0,
    payment_method VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed, cancelled
    processed_by UUID,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create exchange_items table
CREATE TABLE IF NOT EXISTS exchange_items (
    id SERIAL PRIMARY KEY,
    exchange_id INT NOT NULL REFERENCES product_exchanges(id) ON DELETE CASCADE,
    returned_product_id INT NOT NULL REFERENCES products(id),
    returned_variant_id INT REFERENCES product_variants(id),
    returned_quantity INT NOT NULL,
    new_product_id INT NOT NULL REFERENCES products(id),
    new_variant_id INT REFERENCES product_variants(id),
    new_quantity INT NOT NULL,
    price_difference DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_returns_customer ON sales_returns(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_returns_branch ON sales_returns(branch_id);
CREATE INDEX IF NOT EXISTS idx_sales_returns_status ON sales_returns(status);
CREATE INDEX IF NOT EXISTS idx_sales_returns_return_date ON sales_returns(return_date);
CREATE INDEX IF NOT EXISTS idx_sales_returns_original_sale ON sales_returns(original_sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_return_items_return ON sales_return_items(return_id);
CREATE INDEX IF NOT EXISTS idx_sales_return_items_product ON sales_return_items(product_id);
CREATE INDEX IF NOT EXISTS idx_product_exchanges_return ON product_exchanges(return_id);
CREATE INDEX IF NOT EXISTS idx_exchange_items_exchange ON exchange_items(exchange_id);

-- Create triggers for auto-generating return number
CREATE OR REPLACE FUNCTION generate_return_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.return_number := 'RET-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('sales_returns_id_seq')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_return_number ON sales_returns;
CREATE TRIGGER trg_generate_return_number
    BEFORE INSERT ON sales_returns
    FOR EACH ROW
    WHEN (NEW.return_number IS NULL OR NEW.return_number = '')
    EXECUTE FUNCTION generate_return_number();

-- Create triggers for auto-generating exchange number
CREATE OR REPLACE FUNCTION generate_exchange_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.exchange_number := 'EXC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('product_exchanges_id_seq')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_exchange_number ON product_exchanges;
CREATE TRIGGER trg_generate_exchange_number
    BEFORE INSERT ON product_exchanges
    FOR EACH ROW
    WHEN (NEW.exchange_number IS NULL OR NEW.exchange_number = '')
    EXECUTE FUNCTION generate_exchange_number();

-- Insert default return reasons
INSERT INTO return_reasons (reason_code, reason_name, description, display_order) VALUES
    ('DEFECTIVE', 'Defective Product', 'Product is defective or not working properly', 1),
    ('WRONG_ITEM', 'Wrong Item Received', 'Customer received incorrect item', 2),
    ('SIZE_FIT', 'Size/Fit Issue', 'Product does not fit or is wrong size', 3),
    ('NOT_AS_DESCRIBED', 'Not as Described', 'Product does not match description', 4),
    ('DAMAGED', 'Damaged in Transit', 'Product was damaged during shipping', 5),
    ('QUALITY', 'Quality Issues', 'Product quality below expectations', 6),
    ('CHANGED_MIND', 'Changed Mind', 'Customer no longer wants the product', 7),
    ('DUPLICATE', 'Duplicate Order', 'Customer accidentally ordered duplicates', 8),
    ('OTHER', 'Other', 'Other reason not listed', 99)
ON CONFLICT (reason_code) DO NOTHING;

-- Add comments
COMMENT ON TABLE return_reasons IS 'Predefined reasons for returns';
COMMENT ON TABLE sales_returns IS 'Stores sales return information';
COMMENT ON TABLE sales_return_items IS 'Stores line items for returns';
COMMENT ON TABLE product_exchanges IS 'Stores product exchange information';
COMMENT ON TABLE exchange_items IS 'Stores line items for exchanges';
