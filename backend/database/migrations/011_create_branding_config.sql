-- Migration 011: Create branding configuration table

CREATE TABLE IF NOT EXISTS branding_config (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id),
  logo_url TEXT,
  logo_type VARCHAR(20) DEFAULT 'icon_text' CHECK (logo_type IN ('icon_text', 'full', 'none')),
  logo_icon_text VARCHAR(10) DEFAULT 'BMS',
  company_name VARCHAR(150),
  primary_color VARCHAR(20) DEFAULT '#D4AF37',
  secondary_color VARCHAR(20) DEFAULT '#1a1a2e',
  accent_color VARCHAR(20) DEFAULT '#D4AF37',
  font_family VARCHAR(50) DEFAULT 'Inter',
  sidebar_bg_color VARCHAR(20),
  navbar_bg_color VARCHAR(20),
  button_color VARCHAR(20),
  background_color VARCHAR(20),
  sidebar_name_size VARCHAR(10) DEFAULT 'medium' CHECK (sidebar_name_size IN ('small', 'medium', 'large')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id)
);
