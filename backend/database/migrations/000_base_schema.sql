-- Migration 000_base_schema: Full base schema for General-Purpose BMS
-- This MUST run first. All subsequent migrations depend on the tables created here.
-- Uses CREATE TABLE IF NOT EXISTS throughout, making it safe to re-run.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users & Auth
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  role_name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]',
  is_system_role BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20),
  role_id INTEGER REFERENCES roles(id),
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- 2. Organization & Branches
CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  organization_name VARCHAR(100) NOT NULL,
  registration_number VARCHAR(50),
  tax_id VARCHAR(50),
  email VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS branches (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id),
  branch_code VARCHAR(20) UNIQUE NOT NULL,
  branch_name VARCHAR(100) NOT NULL,
  address TEXT,
  city VARCHAR(50),
  state VARCHAR(50),
  country VARCHAR(50),
  phone_number VARCHAR(20),
  email VARCHAR(100),
  manager_user_id UUID REFERENCES users(id),
  main_branch BOOLEAN DEFAULT FALSE,
  is_warehouse BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  opening_hours JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_branches (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  branch_id INTEGER REFERENCES branches(id),
  is_primary_branch BOOLEAN DEFAULT FALSE,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by UUID REFERENCES users(id)
);

-- 3. Product Management
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL,
  description TEXT,
  parent_category_id INTEGER REFERENCES categories(id),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS brands (
  id SERIAL PRIMARY KEY,
  brand_name VARCHAR(100) NOT NULL,
  description TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  product_code VARCHAR(50) UNIQUE NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id INTEGER REFERENCES categories(id),
  brand_id INTEGER REFERENCES brands(id),
  product_type VARCHAR(50) DEFAULT 'physical' CHECK (product_type IN ('physical', 'service', 'digital', 'bundle')),
  base_unit VARCHAR(20) DEFAULT 'piece',
  weight_per_unit DECIMAL(10, 3),
  barcode VARCHAR(50),
  retail_price DECIMAL(15, 2) DEFAULT 0,
  wholesale_base_price DECIMAL(15, 2) DEFAULT 0,
  cost_price DECIMAL(15, 2) DEFAULT 0,
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  reorder_level INTEGER DEFAULT 10,
  max_stock_level INTEGER,
  product_images JSONB DEFAULT '[]',
  model_images JSONB DEFAULT '[]',
  specifications JSONB DEFAULT '{}',
  search_vector TSVECTOR,
  commission_amount DECIMAL(15, 2) DEFAULT 0,
  has_variants BOOLEAN DEFAULT FALSE,
  track_serial_numbers BOOLEAN DEFAULT FALSE,
  track_batches BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  sale_count INTEGER DEFAULT 0,
  is_retail_available BOOLEAN DEFAULT TRUE,
  is_wholesale_available BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_units (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  unit_name VARCHAR(20) NOT NULL,
  units_per_base DECIMAL(10, 2) NOT NULL,
  unit_price DECIMAL(15, 2),
  is_default_unit BOOLEAN DEFAULT FALSE
);

-- 4. Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  supplier_code VARCHAR(50) UNIQUE,
  supplier_name VARCHAR(100) NOT NULL,
  contact_person VARCHAR(100),
  email VARCHAR(100),
  phone_number VARCHAR(20),
  whatsapp_number VARCHAR(20),
  address TEXT,
  is_free_trade_zone BOOLEAN DEFAULT FALSE,
  ftz_certificate_url TEXT,
  tax_registration_number VARCHAR(50),
  payment_terms VARCHAR(100),
  supplier_rating DECIMAL(3,2) DEFAULT 0,
  total_purchase_orders INTEGER DEFAULT 0,
  total_purchase_amount DECIMAL(15,2) DEFAULT 0,
  last_order_date TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_suppliers (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  supplier_id INTEGER REFERENCES suppliers(id),
  supplier_product_code VARCHAR(50),
  unit_price DECIMAL(15, 2),
  lead_time_days INTEGER,
  is_preferred_supplier BOOLEAN DEFAULT FALSE,
  minimum_order_quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Inventory
CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  branch_id INTEGER REFERENCES branches(id),
  quantity_on_hand INTEGER DEFAULT 0,
  quantity_reserved INTEGER DEFAULT 0,
  quantity_available INTEGER GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
  branch_price_override DECIMAL(15, 2),
  last_restock_date TIMESTAMP,
  last_counted_date TIMESTAMP,
  last_counted_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, branch_id)
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  branch_id INTEGER REFERENCES branches(id),
  movement_type VARCHAR(20) NOT NULL, -- receipt, sale, adjustment, transfer_in, transfer_out, return
  quantity INTEGER NOT NULL,
  quantity_before INTEGER,
  quantity_after INTEGER,
  reference_type VARCHAR(50),
  reference_id VARCHAR(50),
  notes TEXT,
  performed_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_transfers (
  id SERIAL PRIMARY KEY,
  transfer_number VARCHAR(50) UNIQUE NOT NULL,
  from_branch_id INTEGER REFERENCES branches(id),
  to_branch_id INTEGER REFERENCES branches(id),
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, in_transit, completed, cancelled
  initiated_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  received_by UUID REFERENCES users(id),
  transfer_date TIMESTAMP,
  received_date TIMESTAMP,
  completed_at TIMESTAMP,
  cancellation_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_transfer_items (
  id SERIAL PRIMARY KEY,
  transfer_id INTEGER REFERENCES stock_transfers(id),
  product_id INTEGER REFERENCES products(id),
  quantity_requested INTEGER NOT NULL,
  quantity_received INTEGER,
  notes TEXT
);

-- 6. Customer Management
CREATE TABLE IF NOT EXISTS price_tiers (
  id SERIAL PRIMARY KEY,
  tier_name VARCHAR(50) NOT NULL,
  tier_code VARCHAR(20) UNIQUE NOT NULL,
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  customer_number VARCHAR(50) UNIQUE,
  customer_code VARCHAR(50) UNIQUE,
  customer_type VARCHAR(20) DEFAULT 'retail', -- retail, wholesale, both
  customer_name VARCHAR(100) NOT NULL,
  business_name VARCHAR(150),
  business_type VARCHAR(50),
  contact_person VARCHAR(100),
  email VARCHAR(100),
  phone_number VARCHAR(20),
  alternative_phone VARCHAR(20),
  address TEXT,
  city VARCHAR(50),
  state VARCHAR(50),
  country VARCHAR(50),
  tax_id VARCHAR(50),
  price_tier_id INTEGER REFERENCES price_tiers(id),
  credit_limit DECIMAL(15, 2) DEFAULT 0,
  payment_terms_days INTEGER DEFAULT 0,
  current_balance DECIMAL(15, 2) DEFAULT 0,
  store_credit_balance DECIMAL(15, 2) DEFAULT 0,
  total_purchases DECIMAL(15, 2) DEFAULT 0,
  total_returns DECIMAL(15, 2) DEFAULT 0,
  average_order_value DECIMAL(15, 2) DEFAULT 0,
  last_purchase_date TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  suspended BOOLEAN DEFAULT FALSE,
  suspension_reason TEXT,
  loyalty_points INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer_addresses (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  address_type VARCHAR(20) DEFAULT 'delivery',
  address_label VARCHAR(50),
  full_address TEXT,
  city VARCHAR(50),
  state VARCHAR(50),
  postal_code VARCHAR(20),
  country VARCHAR(50),
  contact_person VARCHAR(100),
  contact_phone VARCHAR(20),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer_product_prices (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  product_id INTEGER REFERENCES products(id),
  custom_price DECIMAL(15, 2) NOT NULL,
  effective_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  effective_to TIMESTAMP,
  created_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Sales & Orders
CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  sale_number VARCHAR(50) UNIQUE NOT NULL,
  sale_type VARCHAR(20) DEFAULT 'retail', -- retail, wholesale
  customer_id INTEGER REFERENCES customers(id),
  branch_id INTEGER REFERENCES branches(id),
  referrer_id INTEGER,
  referrer_commission DECIMAL(15, 2) DEFAULT 0,
  promotion_id INTEGER,
  promotion_discount DECIMAL(15, 2) DEFAULT 0,
  coupon_code VARCHAR(50),
  sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  subtotal DECIMAL(15, 2) DEFAULT 0,
  tax_amount DECIMAL(15, 2) DEFAULT 0,
  discount_amount DECIMAL(15, 2) DEFAULT 0,
  total_amount DECIMAL(15, 2) DEFAULT 0,
  cost_total DECIMAL(15, 2) DEFAULT 0,
  profit_total DECIMAL(15, 2) DEFAULT 0,
  amount_paid DECIMAL(15, 2) DEFAULT 0,
  payment_status VARCHAR(20) DEFAULT 'pending', -- paid, partial, pending, overdue
  payment_method VARCHAR(20),
  payment_reference VARCHAR(100),
  notes TEXT,
  sale_source VARCHAR(20) DEFAULT 'pos',
  processed_by UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'completed', -- completed, pending, cancelled, returned
  reversed_at TIMESTAMP,
  reversed_by UUID REFERENCES users(id),
  reversal_reason VARCHAR(100),
  reversal_note TEXT,
  unreversed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sale_items (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER REFERENCES sales(id),
  product_id INTEGER REFERENCES products(id),
  variant_id INTEGER,
  product_name VARCHAR(255),
  variant_name VARCHAR(255),
  serial_number VARCHAR(100),
  batch_number VARCHAR(100),
  quantity INTEGER NOT NULL,
  unit_type VARCHAR(20),
  unit_price DECIMAL(15, 2) NOT NULL,
  discount_amount DECIMAL(15, 2) DEFAULT 0,
  tax_amount DECIMAL(15, 2) DEFAULT 0,
  line_total DECIMAL(15, 2) NOT NULL,
  cost_price DECIMAL(15, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id INTEGER REFERENCES customers(id),
  order_type VARCHAR(20) DEFAULT 'manual', -- whatsapp, manual, phone
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'new', -- new, confirmed, forwarded, loaded, dispatched, delivered, completed, cancelled
  subtotal DECIMAL(15, 2) DEFAULT 0,
  tax_amount DECIMAL(15, 2) DEFAULT 0,
  total_amount DECIMAL(15, 2) DEFAULT 0,
  total_weight DECIMAL(10, 3) DEFAULT 0,
  delivery_address_id INTEGER REFERENCES customer_addresses(id),
  special_instructions TEXT,
  processed_by UUID REFERENCES users(id),
  confirmed_at TIMESTAMP,
  dispatched_at TIMESTAMP,
  delivered_at TIMESTAMP,
  completed_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_type VARCHAR(20),
  unit_price DECIMAL(15, 2),
  line_total DECIMAL(15, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Payments & Expenses
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  payment_number VARCHAR(50) UNIQUE NOT NULL,
  payment_type VARCHAR(20) NOT NULL, -- received, paid
  customer_id INTEGER REFERENCES customers(id),
  supplier_id INTEGER REFERENCES suppliers(id),
  related_to VARCHAR(50), -- sale, order, expense
  related_id INTEGER,
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  amount DECIMAL(15, 2) NOT NULL,
  payment_method VARCHAR(20),
  payment_reference VARCHAR(100),
  notes TEXT,
  recorded_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expense_categories (
  id SERIAL PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  expense_number VARCHAR(50) UNIQUE,
  expense_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  amount DECIMAL(15, 2) NOT NULL,
  category_id INTEGER REFERENCES expense_categories(id),
  branch_id INTEGER REFERENCES branches(id),
  description TEXT,
  receipt_url TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, paid
  submitted_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- GENERAL-PURPOSE BMS FEATURES
-- ============================================================================

-- Enable pg_trgm for full-text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enhanced categories
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS category_type VARCHAR(50) DEFAULT 'product',
  ADD COLUMN IF NOT EXISTS icon VARCHAR(100),
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS meta_keywords TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT;

-- 9. Enhanced Categories with Hierarchical Support
-- (categories table already exists, see above)

-- Product Tags for Flexible Categorization
CREATE TABLE IF NOT EXISTS product_tags (
  id SERIAL PRIMARY KEY,
  tag_name VARCHAR(100) UNIQUE NOT NULL,
  tag_color VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_tag_mappings (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES product_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, tag_id)
);

-- 10. Product Variants & SKU Management
CREATE TABLE IF NOT EXISTS product_variant_options (
  id SERIAL PRIMARY KEY,
  option_name VARCHAR(100) UNIQUE NOT NULL,
  option_type VARCHAR(20) DEFAULT 'text',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
);

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
);

CREATE TABLE IF NOT EXISTS variant_inventory (
  id SERIAL PRIMARY KEY,
  variant_id INTEGER REFERENCES product_variants(id) ON DELETE CASCADE,
  branch_id INTEGER REFERENCES branches(id) ON DELETE CASCADE,
  quantity_on_hand INTEGER DEFAULT 0,
  quantity_reserved INTEGER DEFAULT 0,
  quantity_available INTEGER GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
  branch_price_override DECIMAL(15,2),
  last_restock_date TIMESTAMP,
  last_counted_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(variant_id, branch_id)
);

-- 11. Promotions & Discounts Engine
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
);

CREATE TABLE IF NOT EXISTS promotion_usage (
  id SERIAL PRIMARY KEY,
  promotion_id INTEGER REFERENCES promotions(id) ON DELETE CASCADE,
  sale_id INTEGER REFERENCES sales(id),
  customer_id INTEGER REFERENCES customers(id),
  discount_applied DECIMAL(15,2) NOT NULL,
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id SERIAL PRIMARY KEY,
  po_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id INTEGER REFERENCES suppliers(id),
  branch_id INTEGER REFERENCES branches(id),
  po_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expected_delivery_date TIMESTAMP,
  actual_delivery_date TIMESTAMP,
  status VARCHAR(20) DEFAULT 'draft',
  payment_status VARCHAR(20) DEFAULT 'pending',
  subtotal DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  shipping_cost DECIMAL(15,2) DEFAULT 0,
  other_charges DECIMAL(15,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) DEFAULT 0,
  amount_paid DECIMAL(15,2) DEFAULT 0,
  payment_terms VARCHAR(100),
  delivery_address TEXT,
  notes TEXT,
  internal_notes TEXT,
  attachments JSONB DEFAULT '[]',
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  cancelled_by UUID REFERENCES users(id),
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id SERIAL PRIMARY KEY,
  po_id INTEGER REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  variant_id INTEGER REFERENCES product_variants(id),
  product_name VARCHAR(255),
  quantity_ordered INTEGER NOT NULL,
  quantity_received INTEGER DEFAULT 0,
  quantity_pending INTEGER GENERATED ALWAYS AS (quantity_ordered - quantity_received) STORED,
  unit_price DECIMAL(15,2) NOT NULL,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  line_total DECIMAL(15,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS goods_received_notes (
  id SERIAL PRIMARY KEY,
  grn_number VARCHAR(50) UNIQUE NOT NULL,
  po_id INTEGER REFERENCES purchase_orders(id),
  supplier_id INTEGER REFERENCES suppliers(id),
  branch_id INTEGER REFERENCES branches(id),
  received_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  received_by UUID REFERENCES users(id),
  quality_check_status VARCHAR(20) DEFAULT 'pending',
  notes TEXT,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS grn_items (
  id SERIAL PRIMARY KEY,
  grn_id INTEGER REFERENCES goods_received_notes(id) ON DELETE CASCADE,
  po_item_id INTEGER REFERENCES purchase_order_items(id),
  product_id INTEGER REFERENCES products(id),
  variant_id INTEGER REFERENCES product_variants(id),
  quantity_received INTEGER NOT NULL,
  quantity_accepted INTEGER,
  quantity_rejected INTEGER DEFAULT 0,
  rejection_reason TEXT,
  batch_number VARCHAR(100),
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Returns & Exchanges Management
CREATE TABLE IF NOT EXISTS return_reasons (
  id SERIAL PRIMARY KEY,
  reason_code VARCHAR(20) UNIQUE NOT NULL,
  reason_name VARCHAR(100) NOT NULL,
  reason_type VARCHAR(20) DEFAULT 'customer',
  requires_approval BOOLEAN DEFAULT FALSE,
  allow_restock BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales_returns (
  id SERIAL PRIMARY KEY,
  return_number VARCHAR(50) UNIQUE NOT NULL,
  original_sale_id INTEGER REFERENCES sales(id),
  customer_id INTEGER REFERENCES customers(id),
  branch_id INTEGER REFERENCES branches(id),
  return_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  return_type VARCHAR(20) DEFAULT 'refund',
  reason_id INTEGER REFERENCES return_reasons(id),
  reason_notes TEXT,
  subtotal DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  restocking_fee DECIMAL(15,2) DEFAULT 0,
  refund_amount DECIMAL(15,2) DEFAULT 0,
  store_credit_amount DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',
  payment_method VARCHAR(20),
  payment_reference VARCHAR(100),
  processed_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  completed_at TIMESTAMP,
  notes TEXT,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales_return_items (
  id SERIAL PRIMARY KEY,
  return_id INTEGER REFERENCES sales_returns(id) ON DELETE CASCADE,
  sale_item_id INTEGER REFERENCES sale_items(id),
  product_id INTEGER REFERENCES products(id),
  variant_id INTEGER REFERENCES product_variants(id),
  product_name VARCHAR(255),
  quantity_returned INTEGER NOT NULL,
  return_condition VARCHAR(20) DEFAULT 'new',
  restock BOOLEAN DEFAULT TRUE,
  unit_price DECIMAL(15,2) NOT NULL,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  refund_amount DECIMAL(15,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_exchanges (
  id SERIAL PRIMARY KEY,
  exchange_number VARCHAR(50) UNIQUE NOT NULL,
  return_id INTEGER REFERENCES sales_returns(id),
  new_sale_id INTEGER REFERENCES sales(id),
  customer_id INTEGER REFERENCES customers(id),
  branch_id INTEGER REFERENCES branches(id),
  exchange_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  price_difference DECIMAL(15,2) DEFAULT 0,
  payment_method VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending',
  processed_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exchange_items (
  id SERIAL PRIMARY KEY,
  exchange_id INTEGER REFERENCES product_exchanges(id) ON DELETE CASCADE,
  returned_product_id INTEGER REFERENCES products(id),
  returned_variant_id INTEGER REFERENCES product_variants(id),
  returned_quantity INTEGER NOT NULL,
  new_product_id INTEGER REFERENCES products(id),
  new_variant_id INTEGER REFERENCES product_variants(id),
  new_quantity INTEGER NOT NULL,
  price_difference DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. Serial Number & Batch Tracking
CREATE TABLE IF NOT EXISTS serial_numbers (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  variant_id INTEGER REFERENCES product_variants(id),
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
  po_id INTEGER REFERENCES purchase_orders(id),
  grn_id INTEGER REFERENCES goods_received_notes(id),
  sale_id INTEGER REFERENCES sales(id),
  sale_item_id INTEGER REFERENCES sale_items(id),
  return_id INTEGER REFERENCES sales_returns(id),
  purchased_date DATE,
  sold_date TIMESTAMP,
  customer_id INTEGER REFERENCES customers(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_batches (
  id SERIAL PRIMARY KEY,
  batch_number VARCHAR(100) UNIQUE NOT NULL,
  product_id INTEGER REFERENCES products(id),
  variant_id INTEGER REFERENCES product_variants(id),
  manufacturing_date DATE,
  expiry_date DATE,
  initial_quantity INTEGER NOT NULL,
  current_quantity INTEGER DEFAULT 0,
  supplier_id INTEGER REFERENCES suppliers(id),
  po_id INTEGER REFERENCES purchase_orders(id),
  grn_id INTEGER REFERENCES goods_received_notes(id),
  unit_cost DECIMAL(15,2),
  status VARCHAR(20) DEFAULT 'active',
  quality_status VARCHAR(20) DEFAULT 'passed',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS batch_movements (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER REFERENCES product_batches(id) ON DELETE CASCADE,
  movement_type VARCHAR(20) NOT NULL,
  quantity INTEGER NOT NULL,
  quantity_before INTEGER,
  quantity_after INTEGER,
  reference_type VARCHAR(50),
  reference_id INTEGER,
  branch_id INTEGER REFERENCES branches(id),
  performed_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. Product Bundles/Kits
CREATE TABLE IF NOT EXISTS product_bundles (
  id SERIAL PRIMARY KEY,
  bundle_product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  bundle_type VARCHAR(20) DEFAULT 'fixed',
  discount_type VARCHAR(20) DEFAULT 'percentage',
  discount_value DECIMAL(15,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bundle_items (
  id SERIAL PRIMARY KEY,
  bundle_id INTEGER REFERENCES product_bundles(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  variant_id INTEGER REFERENCES product_variants(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  is_optional BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. Stock Damages
CREATE TABLE IF NOT EXISTS stock_damages (
  id SERIAL PRIMARY KEY,
  damage_number VARCHAR(50) UNIQUE NOT NULL,
  product_id INTEGER REFERENCES products(id),
  branch_id INTEGER REFERENCES branches(id),
  quantity_damaged INTEGER NOT NULL,
  damage_type VARCHAR(50),
  damage_reason TEXT,
  damage_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  estimated_loss DECIMAL(15, 2),
  attachments JSONB DEFAULT '[]',
  reported_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approval_status VARCHAR(20) DEFAULT 'pending',
  approved_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Receipt Configuration
CREATE TABLE IF NOT EXISTS receipt_config (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id),
  branch_id INTEGER REFERENCES branches(id),
  logo_url TEXT,
  business_name VARCHAR(150),
  business_address TEXT,
  business_phone VARCHAR(20),
  business_email VARCHAR(100),
  tax_registration_number VARCHAR(50),
  receipt_header TEXT,
  receipt_footer TEXT,
  show_logo BOOLEAN DEFAULT TRUE,
  show_barcode BOOLEAN DEFAULT TRUE,
  show_qr_code BOOLEAN DEFAULT FALSE,
  paper_size VARCHAR(20) DEFAULT 'A4',
  template_style VARCHAR(20) DEFAULT 'modern',
  custom_css TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id, branch_id)
);

-- 13. Sale Comments
CREATE TABLE IF NOT EXISTS sale_comments (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  comment_type VARCHAR(20) DEFAULT 'note',
  is_internal BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. Referrers/Agents
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
);

-- 15. Performance Tasks
CREATE TABLE IF NOT EXISTS retail_performance_tasks (
  id SERIAL PRIMARY KEY,
  task_code VARCHAR(50) UNIQUE NOT NULL,
  task_name VARCHAR(150) NOT NULL,
  task_type VARCHAR(20) DEFAULT 'sales_target',
  assigned_to UUID REFERENCES users(id),
  branch_id INTEGER REFERENCES branches(id),
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  target_amount DECIMAL(15, 2),
  target_quantity INTEGER,
  target_product_id INTEGER REFERENCES products(id),
  current_progress DECIMAL(15, 2) DEFAULT 0,
  current_quantity INTEGER DEFAULT 0,
  completion_percentage DECIMAL(5, 2) DEFAULT 0,
  reward_amount DECIMAL(15, 2),
  reward_type VARCHAR(50),
  status VARCHAR(20) DEFAULT 'inactive',
  is_active BOOLEAN DEFAULT TRUE,
  pause_count INTEGER DEFAULT 0,
  pause_history JSONB DEFAULT '[]',
  extended_count INTEGER DEFAULT 0,
  early_end_reason TEXT,
  ended_early_at TIMESTAMP,
  activated_at TIMESTAMP,
  completed_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  created_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. Quotations
CREATE TABLE IF NOT EXISTS quotations (
  id SERIAL PRIMARY KEY,
  quotation_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id INTEGER REFERENCES customers(id),
  customer_name VARCHAR(150),
  customer_phone VARCHAR(20),
  customer_email VARCHAR(100),
  branch_id INTEGER REFERENCES branches(id),
  quotation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  valid_until TIMESTAMP,
  subtotal DECIMAL(15, 2) DEFAULT 0,
  tax_amount DECIMAL(15, 2) DEFAULT 0,
  discount_amount DECIMAL(15, 2) DEFAULT 0,
  total_amount DECIMAL(15, 2) DEFAULT 0,
  notes TEXT,
  terms_and_conditions TEXT,
  status VARCHAR(20) DEFAULT 'draft',
  converted_sale_id INTEGER REFERENCES sales(id),
  converted_at TIMESTAMP,
  source_calculation_id INTEGER,  -- legacy tile_calculations ref (table removed)
  created_by UUID REFERENCES users(id),
  sent_at TIMESTAMP,
  sent_via VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quotation_items (
  id SERIAL PRIMARY KEY,
  quotation_id INTEGER REFERENCES quotations(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  product_name VARCHAR(255),
  description TEXT,
  quantity INTEGER NOT NULL,
  unit_type VARCHAR(20),
  unit_price DECIMAL(15, 2) NOT NULL,
  discount_amount DECIMAL(15, 2) DEFAULT 0,
  tax_amount DECIMAL(15, 2) DEFAULT 0,
  line_total DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 17. Bank Channels & Cash Flow
CREATE TABLE IF NOT EXISTS bank_channels (
  id SERIAL PRIMARY KEY,
  channel_name VARCHAR(100) NOT NULL,
  channel_type VARCHAR(20) DEFAULT 'bank',
  account_number VARCHAR(50),
  account_name VARCHAR(150),
  bank_name VARCHAR(100),
  branch_id INTEGER REFERENCES branches(id),
  currency VARCHAR(10) DEFAULT 'NGN',
  current_balance DECIMAL(15, 2) DEFAULT 0,
  opening_balance DECIMAL(15, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cash_flows (
  id SERIAL PRIMARY KEY,
  transaction_number VARCHAR(50) UNIQUE NOT NULL,
  transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  bank_channel_id INTEGER REFERENCES bank_channels(id),
  transaction_type VARCHAR(20) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  balance_before DECIMAL(15, 2),
  balance_after DECIMAL(15, 2),
  category VARCHAR(50),
  reference_type VARCHAR(50),
  reference_id INTEGER,
  description TEXT,
  performed_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approval_status VARCHAR(20) DEFAULT 'approved',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 18. Recycle Bin & Audit Trail
CREATE TABLE IF NOT EXISTS recycle_bin (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER NOT NULL,
  entity_data JSONB NOT NULL,
  deleted_by UUID REFERENCES users(id),
  deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deletion_reason VARCHAR(255),
  restore_deadline TIMESTAMP,
  restored_at TIMESTAMP,
  restored_by UUID REFERENCES users(id),
  is_permanently_deleted BOOLEAN DEFAULT FALSE,
  permanently_deleted_at TIMESTAMP,
  permanently_deleted_by UUID REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS deletion_audit_trail (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER NOT NULL,
  action VARCHAR(20) NOT NULL,
  performed_by UUID REFERENCES users(id),
  performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(50),
  user_agent TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS purge_logs (
  id SERIAL PRIMARY KEY,
  purge_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  entity_type VARCHAR(50),
  entities_purged INTEGER DEFAULT 0,
  purge_criteria TEXT,
  performed_by UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'completed',
  error_log TEXT
);

