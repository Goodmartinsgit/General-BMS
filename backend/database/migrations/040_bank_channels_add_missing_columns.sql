-- Migration 040: Add missing columns to bank_channels
-- The table may have been created by setup_cashflow.js which lacks channel_type,
-- account_name (wider), bank_name, branch_id, currency, opening_balance, notes columns.

ALTER TABLE bank_channels ADD COLUMN IF NOT EXISTS channel_type VARCHAR(20) DEFAULT 'bank';
ALTER TABLE bank_channels ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'NGN';
ALTER TABLE bank_channels ADD COLUMN IF NOT EXISTS branch_id INTEGER REFERENCES branches(id);
ALTER TABLE bank_channels ADD COLUMN IF NOT EXISTS notes TEXT;
