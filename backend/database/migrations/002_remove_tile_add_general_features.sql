-- Migration: Remove Tile-Specific Features and Add General BMS Features
-- Date: 2026-01-31
-- Description: Transform from tile-industry-specific to general-purpose retail/wholesale BMS
--              Remove: Tile calculator, tile-specific categories
--              Add: Product variants, promotions, purchase orders, returns, serial tracking

-- ============================================================================
-- PART 1: REMOVE TILE-SPECIFIC TABLES
-- ============================================================================

-- Drop tile calculator tables
DROP TABLE IF EXISTS tile_calculations CASCADE;
DROP TABLE IF EXISTS tile_calculator_configs CASCADE;

-- Drop tile-specific category tables
DROP TABLE IF EXISTS product_optional_categories CASCADE;
DROP TABLE IF EXISTS optional_categories CASCADE;
DROP TABLE IF EXISTS tile_types CASCADE;
DROP TABLE IF EXISTS use_cases CASCADE;
DROP TABLE IF EXISTS sizes CASCADE;

-- ============================================================================
-- PART 2: REMOVE TILE-SPECIFIC COLUMNS FROM PRODUCTS
-- ============================================================================

ALTER TABLE products
  DROP COLUMN IF EXISTS calculator_enabled,
  DROP COLUMN IF EXISTS tile_type_id,
  DROP COLUMN IF EXISTS size_id,
  DROP COLUMN IF EXISTS use_case_id;

-- Remove tile/accessory constraint, make product_type more flexible
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_product_type_check;
ALTER TABLE products
  ALTER COLUMN product_type DROP DEFAULT,
  ALTER COLUMN product_type TYPE VARCHAR(50);

-- Set default for existing records
UPDATE products SET product_type = 'physical' WHERE product_type IS NULL;
ALTER TABLE products ALTER COLUMN product_type SET DEFAULT 'physical';

-- Add new product type constraint (physical, service, digital, bundle)
ALTER TABLE products
  ADD CONSTRAINT products_product_type_check
  CHECK (product_type IN ('physical', 'service', 'digital', 'bundle'));

-- ============================================================================
-- PART 3: ADD GENERAL CATEGORY SYSTEM
-- ============================================================================

-- Enhanced categories with hierarchical support
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS category_type VARCHAR(50) DEFAULT 'product', -- product, service, digital
  ADD COLUMN IF NOT EXISTS icon VARCHAR(100),
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS meta_keywords TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT;

-- Product tags for flexible categorization
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

-- ============================================================================
-- PART 4: PRODUCT VARIANTS & SKU MANAGEMENT
-- ============================================================================

-- Variant options (e.g., "Size", "Color", "Material")
CREATE TABLE IF NOT EXISTS product_variant_options (
  id SERIAL PRIMARY KEY,
  option_name VARCHAR(100) UNIQUE NOT NULL,
  option_type VARCHAR(20) DEFAULT 'text', -- text, color, image
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Variant option values (e.g., "Small", "Medium", "Large")
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

-- Product variants (specific combinations)
CREATE TABLE IF NOT EXISTS product_variants (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  sku VARCHAR(100) UNIQUE NOT NULL,
  variant_name VARCHAR(255),
  variant_values JSONB NOT NULL DEFAULT '{}', -- {"size": "Large", "color": "Red"}
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

-- Variant inventory per branch
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

-- ============================================================================
-- PART 5: PROMOTIONS & DISCOUNTS ENGINE
-- ============================================================================

CREATE TABLE IF NOT EXISTS promotions (
  id SERIAL PRIMARY KEY,
  promotion_code VARCHAR(50) UNIQUE NOT NULL,
  promotion_name VARCHAR(150) NOT NULL,
  description TEXT,
  promotion_type VARCHAR(30) NOT NULL, -- percentage, fixed_amount, bogo, bulk_discount, free_shipping
  discount_percentage DECIMAL(5,2),
  discount_amount DECIMAL(15,2),
  buy_quantity INTEGER, -- For BOGO: Buy X
  get_quantity INTEGER, -- For BOGO: Get Y
  min_purchase_amount DECIMAL(15,2),
  min_quantity INTEGER,
  max_discount_amount DECIMAL(15,2),
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  usage_limit INTEGER, -- Max total uses
  usage_per_customer INTEGER DEFAULT 1,
  current_usage_count INTEGER DEFAULT 0,
  applicable_to VARCHAR(20) DEFAULT 'all', -- all, products, categories, customers, branches
  applicable_products JSONB DEFAULT '[]',
  applicable_categories JSONB DEFAULT '[]',
  applicable_customers JSONB DEFAULT '[]',
  applicable_branches JSONB DEFAULT '[]',
  stackable BOOLEAN DEFAULT FALSE, -- Can be used with other promotions
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

-- ============================================================================
-- PART 6: PURCHASE ORDERS & ENHANCED SUPPLIER MANAGEMENT
-- ============================================================================

-- Enhance suppliers table
ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS supplier_rating DECIMAL(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_purchase_orders INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_purchase_amount DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_order_date TIMESTAMP;

-- Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id SERIAL PRIMARY KEY,
  po_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id INTEGER REFERENCES suppliers(id),
  branch_id INTEGER REFERENCES branches(id),
  po_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expected_delivery_date TIMESTAMP,
  actual_delivery_date TIMESTAMP,
  status VARCHAR(20) DEFAULT 'draft', -- draft, sent, confirmed, partially_received, received, cancelled
  payment_status VARCHAR(20) DEFAULT 'pending', -- pending, partial, paid
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

-- Goods Received Notes
CREATE TABLE IF NOT EXISTS goods_received_notes (
  id SERIAL PRIMARY KEY,
  grn_number VARCHAR(50) UNIQUE NOT NULL,
  po_id INTEGER REFERENCES purchase_orders(id),
  supplier_id INTEGER REFERENCES suppliers(id),
  branch_id INTEGER REFERENCES branches(id),
  received_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  received_by UUID REFERENCES users(id),
  quality_check_status VARCHAR(20) DEFAULT 'pending', -- pending, passed, failed, partial
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

-- ============================================================================
-- PART 7: RETURNS & EXCHANGES MANAGEMENT
-- ============================================================================

-- Return reasons
CREATE TABLE IF NOT EXISTS return_reasons (
  id SERIAL PRIMARY KEY,
  reason_code VARCHAR(20) UNIQUE NOT NULL,
  reason_name VARCHAR(100) NOT NULL,
  reason_type VARCHAR(20) DEFAULT 'customer', -- customer, quality, damaged, expired, other
  requires_approval BOOLEAN DEFAULT FALSE,
  allow_restock BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales Returns
CREATE TABLE IF NOT EXISTS sales_returns (
  id SERIAL PRIMARY KEY,
  return_number VARCHAR(50) UNIQUE NOT NULL,
  original_sale_id INTEGER REFERENCES sales(id),
  customer_id INTEGER REFERENCES customers(id),
  branch_id INTEGER REFERENCES branches(id),
  return_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  return_type VARCHAR(20) DEFAULT 'refund', -- refund, exchange, store_credit
  reason_id INTEGER REFERENCES return_reasons(id),
  reason_notes TEXT,
  subtotal DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  restocking_fee DECIMAL(15,2) DEFAULT 0,
  refund_amount DECIMAL(15,2) DEFAULT 0,
  store_credit_amount DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, completed, cancelled
  payment_method VARCHAR(20), -- For refunds
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
  return_condition VARCHAR(20) DEFAULT 'new', -- new, used, damaged, defective
  restock BOOLEAN DEFAULT TRUE,
  unit_price DECIMAL(15,2) NOT NULL,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  refund_amount DECIMAL(15,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product Exchanges
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
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed, cancelled
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

-- ============================================================================
-- PART 8: SERIAL NUMBER & BATCH TRACKING
-- ============================================================================

-- Serial Numbers for individual item tracking
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
  status VARCHAR(20) DEFAULT 'in_stock', -- in_stock, sold, returned, defective, scrapped
  condition VARCHAR(20) DEFAULT 'new', -- new, refurbished, used
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

-- Batch/Lot Tracking
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
  status VARCHAR(20) DEFAULT 'active', -- active, expired, recalled, depleted
  quality_status VARCHAR(20) DEFAULT 'passed', -- passed, failed, quarantine
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Batch movements
CREATE TABLE IF NOT EXISTS batch_movements (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER REFERENCES product_batches(id) ON DELETE CASCADE,
  movement_type VARCHAR(20) NOT NULL, -- sale, return, adjustment, disposal
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

-- ============================================================================
-- PART 9: PRODUCT BUNDLES/KITS
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_bundles (
  id SERIAL PRIMARY KEY,
  bundle_product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  bundle_type VARCHAR(20) DEFAULT 'fixed', -- fixed, dynamic
  discount_type VARCHAR(20) DEFAULT 'percentage', -- percentage, fixed_amount
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

-- ============================================================================
-- PART 10: ENHANCE EXISTING TABLES
-- ============================================================================

-- Add variant support to sale_items
ALTER TABLE sale_items
  ADD COLUMN IF NOT EXISTS variant_id INTEGER REFERENCES product_variants(id),
  ADD COLUMN IF NOT EXISTS variant_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS serial_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS batch_number VARCHAR(100);

-- Add promotion tracking to sales
ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS promotion_id INTEGER REFERENCES promotions(id),
  ADD COLUMN IF NOT EXISTS promotion_discount DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50);

-- Add store credit to customers
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS store_credit_balance DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_purchases DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_returns DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS average_order_value DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_purchase_date TIMESTAMP;

-- ============================================================================
-- PART 11: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Product variants indexes
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_is_active ON product_variants(is_active);
CREATE INDEX IF NOT EXISTS idx_variant_inventory_variant_id ON variant_inventory(variant_id);
CREATE INDEX IF NOT EXISTS idx_variant_inventory_branch_id ON variant_inventory(branch_id);

-- Promotions indexes
CREATE INDEX IF NOT EXISTS idx_promotions_code ON promotions(promotion_code);
CREATE INDEX IF NOT EXISTS idx_promotions_active_dates ON promotions(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_promotion_usage_promotion_id ON promotion_usage(promotion_id);
CREATE INDEX IF NOT EXISTS idx_promotion_usage_customer_id ON promotion_usage(customer_id);

-- Purchase orders indexes
CREATE INDEX IF NOT EXISTS idx_purchase_orders_po_number ON purchase_orders(po_number);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_po_date ON purchase_orders(po_date);
CREATE INDEX IF NOT EXISTS idx_po_items_po_id ON purchase_order_items(po_id);
CREATE INDEX IF NOT EXISTS idx_grn_po_id ON goods_received_notes(po_id);

-- Returns indexes
CREATE INDEX IF NOT EXISTS idx_sales_returns_return_number ON sales_returns(return_number);
CREATE INDEX IF NOT EXISTS idx_sales_returns_sale_id ON sales_returns(original_sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_returns_customer_id ON sales_returns(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_returns_status ON sales_returns(status);
CREATE INDEX IF NOT EXISTS idx_return_items_return_id ON sales_return_items(return_id);
CREATE INDEX IF NOT EXISTS idx_exchanges_return_id ON product_exchanges(return_id);

-- Serial numbers indexes
CREATE INDEX IF NOT EXISTS idx_serial_numbers_serial ON serial_numbers(serial_number);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_product_id ON serial_numbers(product_id);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_status ON serial_numbers(status);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_branch_id ON serial_numbers(branch_id);
CREATE INDEX IF NOT EXISTS idx_batches_batch_number ON product_batches(batch_number);
CREATE INDEX IF NOT EXISTS idx_batches_expiry_date ON product_batches(expiry_date);

-- Product tags indexes
CREATE INDEX IF NOT EXISTS idx_product_tags_name ON product_tags(tag_name);
CREATE INDEX IF NOT EXISTS idx_product_tag_mappings_product_id ON product_tag_mappings(product_id);

-- ============================================================================
-- PART 12: CREATE TRIGGERS
-- ============================================================================

-- Auto-generate PO number
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.po_number IS NULL THEN
    NEW.po_number := 'PO-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' ||
                     LPAD(NEXTVAL('purchase_orders_id_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_po_number ON purchase_orders;
CREATE TRIGGER trg_generate_po_number
  BEFORE INSERT ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_po_number();

-- Auto-generate return number
CREATE OR REPLACE FUNCTION generate_return_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.return_number IS NULL THEN
    NEW.return_number := 'RET-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' ||
                         LPAD(NEXTVAL('sales_returns_id_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_return_number ON sales_returns;
CREATE TRIGGER trg_generate_return_number
  BEFORE INSERT ON sales_returns
  FOR EACH ROW
  EXECUTE FUNCTION generate_return_number();

-- Auto-generate GRN number
CREATE OR REPLACE FUNCTION generate_grn_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.grn_number IS NULL THEN
    NEW.grn_number := 'GRN-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' ||
                      LPAD(NEXTVAL('goods_received_notes_id_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_grn_number ON goods_received_notes;
CREATE TRIGGER trg_generate_grn_number
  BEFORE INSERT ON goods_received_notes
  FOR EACH ROW
  EXECUTE FUNCTION generate_grn_number();

-- ============================================================================
-- PART 13: INSERT SEED DATA
-- ============================================================================

-- Insert default return reasons
INSERT INTO return_reasons (reason_code, reason_name, reason_type, allow_restock)
VALUES
  ('DEFECTIVE', 'Defective/Faulty Product', 'quality', TRUE),
  ('WRONG_ITEM', 'Wrong Item Received', 'customer', TRUE),
  ('DAMAGED', 'Damaged During Shipping', 'damaged', FALSE),
  ('NOT_AS_DESC', 'Not As Described', 'customer', TRUE),
  ('EXPIRED', 'Expired Product', 'expired', FALSE),
  ('CHANGED_MIND', 'Customer Changed Mind', 'customer', TRUE),
  ('DUPLICATE', 'Duplicate Order', 'customer', TRUE),
  ('SIZE_ISSUE', 'Size/Fit Issue', 'customer', TRUE),
  ('QUALITY', 'Poor Quality', 'quality', FALSE),
  ('OTHER', 'Other Reason', 'other', TRUE)
ON CONFLICT (reason_code) DO NOTHING;

-- Insert default variant options (examples)
INSERT INTO product_variant_options (option_name, option_type, display_order)
VALUES
  ('Size', 'text', 1),
  ('Color', 'color', 2),
  ('Material', 'text', 3),
  ('Style', 'text', 4)
ON CONFLICT (option_name) DO NOTHING;

-- Insert default variant values for Size
INSERT INTO product_variant_values (option_id, value_name, display_order)
SELECT id, value, ord FROM product_variant_options,
  (VALUES ('XS', 1), ('S', 2), ('M', 3), ('L', 4), ('XL', 5), ('XXL', 6)) AS v(value, ord)
WHERE option_name = 'Size'
ON CONFLICT (option_id, value_name) DO NOTHING;

-- Insert default product tags
INSERT INTO product_tags (tag_name, tag_color)
VALUES
  ('New Arrival', '#10b981'),
  ('Best Seller', '#f59e0b'),
  ('Sale', '#ef4444'),
  ('Clearance', '#8b5cf6'),
  ('Limited Edition', '#ec4899'),
  ('Recommended', '#3b82f6')
ON CONFLICT (tag_name) DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Update product type for existing products
UPDATE products
SET product_type = 'physical'
WHERE product_type NOT IN ('physical', 'service', 'digital', 'bundle');
