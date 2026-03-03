-- Migration 008: Create settings table for persistent configuration storage
-- Replaces hardcoded settings stubs with DB-backed JSONB storage

CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id),
  category VARCHAR(50) NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id, category)
);

-- Seed default settings for existing organization
INSERT INTO settings (organization_id, category, settings)
SELECT o.id, cat.category, cat.defaults
FROM organizations o
CROSS JOIN (VALUES
  ('general', '{"currency": "NGN", "timezone": "Africa/Lagos", "date_format": "DD/MM/YYYY", "fiscal_year_start": "01"}'::jsonb),
  ('tax', '{"tax_enabled": true, "default_tax_rate": 0, "tax_inclusive": false, "tax_number": ""}'::jsonb),
  ('payment', '{"cash_enabled": true, "card_enabled": true, "bank_transfer_enabled": true, "mobile_money_enabled": false, "default_payment_method": "cash"}'::jsonb),
  ('notifications', '{"email_notifications": true, "low_stock_alerts": true, "low_stock_threshold": 10, "daily_summary": false, "order_notifications": true}'::jsonb),
  ('security', '{"session_timeout": 30, "require_password_change": false, "password_expiry_days": 90, "two_factor_enabled": false}'::jsonb),
  ('display', '{"items_per_page": 20, "default_view_mode": "grid", "show_product_images": true, "compact_mode": false, "theme": "midnight"}'::jsonb),
  ('receipt', '{"show_logo": true, "header_text": "", "footer_text": "Thank you for your business!", "show_tax_breakdown": true, "auto_print": false}'::jsonb)
) AS cat(category, defaults)
ON CONFLICT (organization_id, category) DO NOTHING;
