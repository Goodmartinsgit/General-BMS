-- Migration 005: Create recycle bin tables
-- These tables support the recycle bin feature (soft delete + restore + purge)

CREATE TABLE IF NOT EXISTS recycle_bin (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER NOT NULL,
  entity_data JSONB NOT NULL,
  deleted_by UUID REFERENCES users(id),
  deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deletion_reason VARCHAR(255),
  restore_deadline TIMESTAMP,
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
  action VARCHAR(20) NOT NULL,
  performed_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(50),
  user_agent TEXT,
  notes TEXT,
  entity_data_snapshot JSONB
);

CREATE TABLE IF NOT EXISTS purge_logs (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(50),
  entity_id INTEGER,
  entity_data_snapshot JSONB,
  purged_by UUID REFERENCES users(id),
  purged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  purge_reason TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_recycle_bin_entity_type ON recycle_bin(entity_type);
CREATE INDEX IF NOT EXISTS idx_recycle_bin_deleted_at ON recycle_bin(deleted_at);
CREATE INDEX IF NOT EXISTS idx_recycle_bin_is_permanently_deleted ON recycle_bin(is_permanently_deleted);
CREATE INDEX IF NOT EXISTS idx_deletion_audit_trail_entity ON deletion_audit_trail(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_purge_logs_entity ON purge_logs(entity_type);
