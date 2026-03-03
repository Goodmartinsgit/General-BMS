-- Migration 020: Add customer source tracking + create customer_auth table

-- Add source column to existing customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'shop';
-- source: 'shop' (POS/in-store), 'online' (storefront self-registered), 'manual' (admin-added)

ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_active_online BOOLEAN DEFAULT true;
-- Admin can suspend online access without deleting the customer record

CREATE INDEX IF NOT EXISTS idx_customers_source ON customers(source);

-- Separate auth table for storefront customers (staff use users table)
CREATE TABLE IF NOT EXISTS customer_auth (
  id SERIAL PRIMARY KEY,
  customer_id INT UNIQUE NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_email_verified BOOLEAN DEFAULT false,
  email_verification_token VARCHAR(255),
  email_verification_expires TIMESTAMPTZ,
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMPTZ,
  pending_email VARCHAR(255),
  pending_email_token VARCHAR(255),
  pending_email_expires TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_auth_email ON customer_auth(email);
CREATE INDEX IF NOT EXISTS idx_customer_auth_customer ON customer_auth(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_auth_reset_token ON customer_auth(password_reset_token);
CREATE INDEX IF NOT EXISTS idx_customer_auth_verify_token ON customer_auth(email_verification_token);
