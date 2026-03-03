-- Migration 009: Create fiscal periods and global fiscal settings tables

CREATE TABLE IF NOT EXISTS fiscal_periods (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id),
  period_name VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'active', 'closed', 'locked')),
  is_active BOOLEAN DEFAULT FALSE,
  locked_at TIMESTAMP,
  locked_by UUID REFERENCES users(id),
  closed_at TIMESTAMP,
  closed_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fiscal_periods_org ON fiscal_periods(organization_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_periods_status ON fiscal_periods(status);
CREATE INDEX IF NOT EXISTS idx_fiscal_periods_active ON fiscal_periods(is_active) WHERE is_active = TRUE;

CREATE TABLE IF NOT EXISTS global_fiscal_settings (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id),
  fiscal_year_start_month INTEGER DEFAULT 1 CHECK (fiscal_year_start_month BETWEEN 1 AND 12),
  fiscal_year_start_day INTEGER DEFAULT 1 CHECK (fiscal_year_start_day BETWEEN 1 AND 31),
  auto_create_periods BOOLEAN DEFAULT FALSE,
  period_type VARCHAR(20) DEFAULT 'monthly' CHECK (period_type IN ('monthly', 'quarterly', 'annual')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id)
);
