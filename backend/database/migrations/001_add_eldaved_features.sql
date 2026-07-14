-- Migration: Add Eldaved-BMS Retail Features
-- Date: 2026-01-31
-- Description: Comprehensive upgrade to add advanced retail features including tile calculator,
--              multi-branch inventory, enhanced categories, stock management, and more.

-- ============================================================================
-- PART 1: ENABLE EXTENSIONS
-- ============================================================================

-- Enable pg_trgm for full-text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- PART 2: ENHANCE EXISTING TABLES
-- ============================================================================

-- Enhance products table
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS product_type VARCHAR(20) DEFAULT 'physical',
  ADD COLUMN IF NOT EXISTS search_vector TSVECTOR,
  ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(15, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS model_images JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sale_count INTEGER DEFAULT 0;

-- Enhance branches table
ALTER TABLE branches
  ADD COLUMN IF NOT EXISTS main_branch BOOLEAN DEFAULT FALSE;

-- Update existing branch inventory table name if it exists, or reference the inventory table
-- Enhance inventory table (used as branch_inventory)
ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS branch_price_override DECIMAL(15, 2),
  ADD COLUMN IF NOT EXISTS last_counted_at TIMESTAMP;

-- Enhance sales table
ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS reversed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS reversed_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS reversal_reason VARCHAR(100),
  ADD COLUMN IF NOT EXISTS reversal_note TEXT,
  ADD COLUMN IF NOT EXISTS unreversed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS cost_total DECIMAL(15, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profit_total DECIMAL(15, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referrer_id INTEGER,
  ADD COLUMN IF NOT EXISTS referrer_commission DECIMAL(15, 2) DEFAULT 0;

-- Enhance customers table
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS customer_code VARCHAR(50) UNIQUE,
  ADD COLUMN IF NOT EXISTS business_name VARCHAR(150),
  ADD COLUMN IF NOT EXISTS business_type VARCHAR(50);

-- Enhance stock_transfers table (already exists)
ALTER TABLE stock_transfers
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Update status constraint to include more statuses
ALTER TABLE stock_transfers DROP CONSTRAINT IF EXISTS stock_transfers_status_check;
ALTER TABLE stock_transfers ADD CONSTRAINT stock_transfers_status_check
  CHECK (status IN ('pending', 'approved', 'in_transit', 'completed', 'cancelled'));

-- ============================================================================
-- PART 3: (Tile-specific tables removed - this BMS is general-purpose)
-- ============================================================================

-- ============================================================================
-- PART 4: (Tile calculator tables removed - this BMS is general-purpose)
-- ============================================================================

-- ============================================================================
-- PART 5: STOCK MANAGEMENT TABLES
-- ============================================================================

-- Stock damages table
CREATE TABLE IF NOT EXISTS stock_damages (
  id SERIAL PRIMARY KEY,
  damage_number VARCHAR(50) UNIQUE NOT NULL,
  product_id INTEGER REFERENCES products(id),
  branch_id INTEGER REFERENCES branches(id),
  quantity_damaged INTEGER NOT NULL,
  damage_type VARCHAR(50), -- broken, expired, defective, water_damage, etc.
  damage_reason TEXT,
  damage_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  estimated_loss DECIMAL(15, 2),
  attachments JSONB DEFAULT '[]', -- Array of image URLs
  reported_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approval_status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  approved_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PART 6: RECEIPT CONFIGURATION TABLE
-- ============================================================================

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
  paper_size VARCHAR(20) DEFAULT 'A4', -- A4, thermal_80mm, thermal_58mm
  template_style VARCHAR(20) DEFAULT 'modern', -- modern, classic, minimal
  custom_css TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id, branch_id)
);

-- ============================================================================
-- PART 7: SALE COMMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS sale_comments (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  attachments JSONB DEFAULT '[]', -- Array of file URLs
  comment_type VARCHAR(20) DEFAULT 'note', -- note, issue, resolution
  is_internal BOOLEAN DEFAULT FALSE, -- Internal staff notes vs customer-visible
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PART 8: REFERRERS/AGENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS referrers (
  id SERIAL PRIMARY KEY,
  referrer_code VARCHAR(50) UNIQUE NOT NULL,
  referrer_name VARCHAR(150) NOT NULL,
  referrer_type VARCHAR(20) DEFAULT 'individual', -- individual, company, agent
  contact_person VARCHAR(100),
  phone_number VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  commission_rate DECIMAL(5, 2) DEFAULT 0, -- Default commission percentage
  commission_type VARCHAR(20) DEFAULT 'percentage', -- percentage, fixed
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

-- ============================================================================
-- PART 9: PERFORMANCE TASKS TABLE (if not exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS retail_performance_tasks (
  id SERIAL PRIMARY KEY,
  task_code VARCHAR(50) UNIQUE NOT NULL,
  task_name VARCHAR(150) NOT NULL,
  task_type VARCHAR(20) DEFAULT 'sales_target', -- sales_target, revenue_target, product_target
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
  reward_type VARCHAR(50), -- cash, commission, bonus, points
  status VARCHAR(20) DEFAULT 'inactive', -- inactive, active, paused, completed, cancelled, expired
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

-- ============================================================================
-- PART 10: QUOTATIONS TABLE
-- ============================================================================

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
  status VARCHAR(20) DEFAULT 'draft', -- draft, sent, accepted, rejected, expired, converted
  converted_sale_id INTEGER REFERENCES sales(id),
  converted_at TIMESTAMP,
  source_calculation_id INTEGER, -- legacy field, tile_calculations table removed
  created_by UUID REFERENCES users(id),
  sent_at TIMESTAMP,
  sent_via VARCHAR(20), -- email, whatsapp, print
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

-- ============================================================================
-- PART 11: BANK CHANNELS & CASH FLOW
-- ============================================================================

CREATE TABLE IF NOT EXISTS bank_channels (
  id SERIAL PRIMARY KEY,
  channel_name VARCHAR(100) NOT NULL,
  channel_type VARCHAR(20) DEFAULT 'bank', -- bank, mobile_money, cash, card
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
  transaction_type VARCHAR(20) NOT NULL, -- inflow, outflow, transfer
  amount DECIMAL(15, 2) NOT NULL,
  balance_before DECIMAL(15, 2),
  balance_after DECIMAL(15, 2),
  category VARCHAR(50), -- sales, expense, supplier_payment, salary, etc.
  reference_type VARCHAR(50),
  reference_id INTEGER,
  description TEXT,
  performed_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approval_status VARCHAR(20) DEFAULT 'approved', -- pending, approved, rejected
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PART 12: RECYCLE BIN & AUDIT TRAIL
-- ============================================================================

CREATE TABLE IF NOT EXISTS recycle_bin (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL, -- products, sales, customers, etc.
  entity_id INTEGER NOT NULL,
  entity_data JSONB NOT NULL, -- Complete snapshot of deleted record
  deleted_by UUID REFERENCES users(id),
  deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deletion_reason VARCHAR(255),
  restore_deadline TIMESTAMP, -- Auto-purge after this date
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
  action VARCHAR(20) NOT NULL, -- soft_delete, restore, permanent_delete
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
  status VARCHAR(20) DEFAULT 'completed', -- completed, failed, partial
  error_log TEXT
);

-- ============================================================================
-- PART 13: ADD FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Add foreign key for sales referrer
ALTER TABLE sales
  ADD CONSTRAINT fk_sales_referrer FOREIGN KEY (referrer_id) REFERENCES referrers(id);

-- ============================================================================
-- PART 14: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_products_search_vector ON products USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_products_product_name_trgm ON products USING GIN(product_name gin_trgm_ops);

-- Product indexes
CREATE INDEX IF NOT EXISTS idx_products_product_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- Sales indexes
CREATE INDEX IF NOT EXISTS idx_sales_reversed_at ON sales(reversed_at);
CREATE INDEX IF NOT EXISTS idx_sales_referrer_id ON sales(referrer_id);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_branch_id ON sales(branch_id);

-- Inventory indexes
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_branch_id ON inventory(branch_id);

-- Stock transfers indexes
CREATE INDEX IF NOT EXISTS idx_stock_transfers_status ON stock_transfers(status);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_from_branch ON stock_transfers(from_branch_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_to_branch ON stock_transfers(to_branch_id);

-- (Tile calculator indexes removed)

-- Recycle bin indexes
CREATE INDEX IF NOT EXISTS idx_recycle_bin_entity_type ON recycle_bin(entity_type);
CREATE INDEX IF NOT EXISTS idx_recycle_bin_deleted_at ON recycle_bin(deleted_at);
CREATE INDEX IF NOT EXISTS idx_recycle_bin_is_permanently_deleted ON recycle_bin(is_permanently_deleted);

-- Performance tasks indexes
CREATE INDEX IF NOT EXISTS idx_performance_tasks_assigned_to ON retail_performance_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_performance_tasks_status ON retail_performance_tasks(status);
CREATE INDEX IF NOT EXISTS idx_performance_tasks_start_date ON retail_performance_tasks(start_date);
CREATE INDEX IF NOT EXISTS idx_performance_tasks_end_date ON retail_performance_tasks(end_date);

-- Quotations indexes
CREATE INDEX IF NOT EXISTS idx_quotations_customer_id ON quotations(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_quotation_date ON quotations(quotation_date);

-- Referrers indexes
CREATE INDEX IF NOT EXISTS idx_referrers_is_active ON referrers(is_active);
CREATE INDEX IF NOT EXISTS idx_referrers_referrer_code ON referrers(referrer_code);

-- ============================================================================
-- PART 15: CREATE TRIGGERS FOR AUTO-UPDATES
-- ============================================================================

-- Function to update search vector for products
CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.product_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.product_code, '')), 'A');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update search vector
DROP TRIGGER IF EXISTS trg_products_search_vector ON products;
CREATE TRIGGER trg_products_search_vector
  BEFORE INSERT OR UPDATE OF product_name, description, product_code
  ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_product_search_vector();

-- Function to auto-generate customer code
CREATE OR REPLACE FUNCTION generate_customer_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_code IS NULL THEN
    NEW.customer_code := 'CUS-' || LPAD(NEXTVAL('customers_id_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for customer code generation
DROP TRIGGER IF EXISTS trg_generate_customer_code ON customers;
CREATE TRIGGER trg_generate_customer_code
  BEFORE INSERT ON customers
  FOR EACH ROW
  EXECUTE FUNCTION generate_customer_code();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all relevant tables
DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_customers_updated_at ON customers;
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_sales_updated_at ON sales;
CREATE TRIGGER trg_sales_updated_at BEFORE UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_branches_updated_at ON branches;
CREATE TRIGGER trg_branches_updated_at BEFORE UPDATE ON branches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 16: INSERT DEFAULT/SEED DATA
-- ============================================================================

-- (Tile seed data removed)

-- Insert default receipt config (if organization exists)
INSERT INTO receipt_config (organization_id, business_name, paper_size, template_style)
SELECT 1, 'General BMS', 'A4', 'modern'
WHERE EXISTS (SELECT 1 FROM organizations WHERE id = 1)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Update search vectors for existing products
UPDATE products SET search_vector =
  setweight(to_tsvector('english', COALESCE(product_name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(product_code, '')), 'A')
WHERE search_vector IS NULL;

-- Set main branch flag for first branch if no main branch exists
UPDATE branches SET main_branch = TRUE
WHERE id = (SELECT MIN(id) FROM branches)
  AND NOT EXISTS (SELECT 1 FROM branches WHERE main_branch = TRUE);

-- Generate customer codes for existing customers without codes
UPDATE customers
SET customer_code = 'CUS-' || LPAD(id::TEXT, 5, '0')
WHERE customer_code IS NULL;
