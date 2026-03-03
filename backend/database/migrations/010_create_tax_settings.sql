-- Migration 010: Create dedicated tax settings table

CREATE TABLE IF NOT EXISTS tax_settings (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id),
  tax_enabled BOOLEAN DEFAULT TRUE,
  standard_rate DECIMAL(5,2) DEFAULT 0,
  reduced_rate DECIMAL(5,2) DEFAULT 0,
  zero_rate DECIMAL(5,2) DEFAULT 0,
  tax_application_mode VARCHAR(20) DEFAULT 'exclusive' CHECK (tax_application_mode IN ('inclusive', 'exclusive')),
  tax_number VARCHAR(50),
  effective_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id)
);
