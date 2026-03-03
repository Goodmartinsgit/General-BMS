-- Migration 012: Create demo mode configuration table

CREATE TABLE IF NOT EXISTS demo_config (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id),
  demo_mode_enabled BOOLEAN DEFAULT FALSE,
  blur_financial_data BOOLEAN DEFAULT FALSE,
  blur_customer_data BOOLEAN DEFAULT FALSE,
  blur_supplier_data BOOLEAN DEFAULT FALSE,
  blur_sales_figures BOOLEAN DEFAULT FALSE,
  blur_inventory_values BOOLEAN DEFAULT FALSE,
  blur_account_balances BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id)
);
