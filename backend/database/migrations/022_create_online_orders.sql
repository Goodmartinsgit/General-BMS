-- Migration 022: Create online_orders and online_order_items tables
CREATE TABLE IF NOT EXISTS online_orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id INT REFERENCES customers(id) ON DELETE SET NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  customer_name VARCHAR(255),

  -- Amounts
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  shipping_amount DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'NGN',
  coupon_code VARCHAR(100),

  -- Addresses (JSONB snapshots at time of order)
  shipping_address JSONB NOT NULL,
  billing_address JSONB,

  -- Shipping
  shipping_method VARCHAR(100),
  shipping_carrier VARCHAR(100),
  tracking_number VARCHAR(255),
  estimated_delivery DATE,
  delivered_at TIMESTAMPTZ,

  -- Payment
  payment_method VARCHAR(50),
  payment_status VARCHAR(30) DEFAULT 'PENDING',
  -- PENDING | AWAITING_CONFIRMATION | PAID | FAILED | REFUNDED
  payment_reference VARCHAR(255),
  paid_at TIMESTAMPTZ,

  -- Manual bank transfer payment fields
  bank_channel_id INT REFERENCES bank_channels(id),
  proof_of_payment TEXT,
  payment_rejection_reason TEXT,
  payment_confirmed_by UUID REFERENCES users(id),
  payment_confirmed_at TIMESTAMPTZ,

  -- Order lifecycle
  status VARCHAR(30) DEFAULT 'PENDING',
  -- PENDING | CONFIRMED | PROCESSING | READY_FOR_PICKUP | SHIPPED | OUT_FOR_DELIVERY | DELIVERED | CANCELLED | REFUNDED
  status_history JSONB DEFAULT '[]',

  customer_notes TEXT,
  admin_notes TEXT,
  cancellation_reason TEXT,

  -- Fulfillment
  branch_id INT REFERENCES branches(id),

  -- Promotion
  promotion_id INT REFERENCES promotions(id),

  -- Timestamps
  confirmed_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_online_orders_customer ON online_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_online_orders_status ON online_orders(status);
CREATE INDEX IF NOT EXISTS idx_online_orders_payment_status ON online_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_online_orders_number ON online_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_online_orders_created ON online_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_online_orders_bank_channel ON online_orders(bank_channel_id);

CREATE TABLE IF NOT EXISTS online_order_items (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES online_orders(id) ON DELETE CASCADE,
  product_id INT REFERENCES products(id) ON DELETE SET NULL,
  variant_id INT REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  variant_info JSONB,
  sku VARCHAR(100),
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(12,2) NOT NULL,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  line_total DECIMAL(12,2) NOT NULL,
  product_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_online_order_items_order ON online_order_items(order_id);

-- Sequence for order number generation
CREATE SEQUENCE IF NOT EXISTS online_order_seq START 1;
