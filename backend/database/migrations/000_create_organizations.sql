-- Migration 000: Create organizations table (base table)
-- This should run before all other migrations

CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  organization_name VARCHAR(150) NOT NULL DEFAULT 'General BMS',
  logo_url TEXT,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(100),
  website VARCHAR(100),
  tax_number VARCHAR(50),
  registration_number VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default organization if none exists
INSERT INTO organizations (organization_name, created_at)
SELECT 'General BMS', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM organizations LIMIT 1);
