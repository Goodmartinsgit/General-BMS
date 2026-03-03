-- Migration 013: Create receipt_config table (if missing) and add delivery format options

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

ALTER TABLE receipt_config
  ADD COLUMN IF NOT EXISTS delivery_format VARCHAR(20) DEFAULT 'print',
  ADD COLUMN IF NOT EXISTS email_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS auto_send BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS include_qr_code BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT DEFAULT '';
