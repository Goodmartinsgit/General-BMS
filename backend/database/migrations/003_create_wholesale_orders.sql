-- Migration: Create Wholesale Orders Tables
-- Description: Creates tables for managing wholesale/B2B orders

-- Create wholesale_orders table
CREATE TABLE IF NOT EXISTS wholesale_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT NOT NULL REFERENCES customers(id),
    branch_id INT NOT NULL REFERENCES branches(id),
    total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    payment_terms_days INT DEFAULT 0,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'Pending',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Create wholesale_order_items table
CREATE TABLE IF NOT EXISTS wholesale_order_items (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES wholesale_orders(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id),
    quantity INT NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL,
    subtotal DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wholesale_orders_customer ON wholesale_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_wholesale_orders_branch ON wholesale_orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_wholesale_orders_status ON wholesale_orders(status);
CREATE INDEX IF NOT EXISTS idx_wholesale_orders_created_at ON wholesale_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_wholesale_order_items_order ON wholesale_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_wholesale_order_items_product ON wholesale_order_items(product_id);

-- Add comment
COMMENT ON TABLE wholesale_orders IS 'Stores wholesale/B2B order information';
COMMENT ON TABLE wholesale_order_items IS 'Stores line items for wholesale orders';
