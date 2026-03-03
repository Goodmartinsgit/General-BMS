-- Migration 018: Create Purchase Orders Tables
-- Creates purchase_orders, purchase_order_items, goods_received_notes, grn_items
-- and adds supplier tracking columns

-- ============================================================
-- Sequences for auto-numbering
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS po_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS grn_number_seq START 1;

-- ============================================================
-- Functions for auto-generating PO number and GRN number
-- ============================================================

CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.po_number := 'PO-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(NEXTVAL('po_number_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_grn_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.grn_number := 'GRN-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(NEXTVAL('grn_number_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Purchase Orders table
-- ============================================================

CREATE TABLE IF NOT EXISTS purchase_orders (
  id SERIAL PRIMARY KEY,
  po_number VARCHAR(50) UNIQUE NOT NULL DEFAULT '',
  supplier_id INTEGER REFERENCES suppliers(id),
  branch_id INTEGER REFERENCES branches(id),
  po_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expected_delivery_date TIMESTAMP,
  actual_delivery_date TIMESTAMP,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','confirmed','partially_received','received','cancelled')),
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

-- Trigger to auto-generate po_number
DROP TRIGGER IF EXISTS set_po_number ON purchase_orders;
CREATE TRIGGER set_po_number
  BEFORE INSERT ON purchase_orders
  FOR EACH ROW
  WHEN (NEW.po_number IS NULL OR NEW.po_number = '')
  EXECUTE FUNCTION generate_po_number();

-- ============================================================
-- Purchase Order Items table
-- ============================================================

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id SERIAL PRIMARY KEY,
  po_id INTEGER REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  variant_id INTEGER REFERENCES product_variants(id),
  product_name VARCHAR(255),
  quantity_ordered INTEGER NOT NULL,
  quantity_received INTEGER DEFAULT 0,
  unit_price DECIMAL(15,2) NOT NULL,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  line_total DECIMAL(15,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Goods Received Notes table
-- ============================================================

CREATE TABLE IF NOT EXISTS goods_received_notes (
  id SERIAL PRIMARY KEY,
  grn_number VARCHAR(50) UNIQUE NOT NULL DEFAULT '',
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

-- Trigger to auto-generate grn_number
DROP TRIGGER IF EXISTS set_grn_number ON goods_received_notes;
CREATE TRIGGER set_grn_number
  BEFORE INSERT ON goods_received_notes
  FOR EACH ROW
  WHEN (NEW.grn_number IS NULL OR NEW.grn_number = '')
  EXECUTE FUNCTION generate_grn_number();

-- ============================================================
-- GRN Items table
-- ============================================================

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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Add supplier tracking columns (if they don't exist)
-- ============================================================

ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS total_purchase_orders INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_purchase_amount DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_order_date TIMESTAMP;

-- ============================================================
-- Indexes for performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_branch ON purchase_orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_created_at ON purchase_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_po_items_po_id ON purchase_order_items(po_id);
CREATE INDEX IF NOT EXISTS idx_grn_po_id ON goods_received_notes(po_id);
CREATE INDEX IF NOT EXISTS idx_grn_items_grn_id ON grn_items(grn_id);
