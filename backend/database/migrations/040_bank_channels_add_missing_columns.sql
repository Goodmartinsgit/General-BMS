-- Migration 040: Add missing columns to bank_channels
-- The table may have been created by setup_cashflow.js which lacks several columns.

-- channel_type: bank, mobile_money, cash, card
ALTER TABLE bank_channels ADD COLUMN IF NOT EXISTS channel_type VARCHAR(20) DEFAULT 'bank';

-- usage_scope: where this channel can be used for payments
--   'bms'   = only in the BMS POS / back-office
--   'store'  = only in the online store checkout
--   'both'  = available everywhere
ALTER TABLE bank_channels ADD COLUMN IF NOT EXISTS usage_scope VARCHAR(10) DEFAULT 'both';

ALTER TABLE bank_channels ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'NGN';
ALTER TABLE bank_channels ADD COLUMN IF NOT EXISTS branch_id INTEGER REFERENCES branches(id);
ALTER TABLE bank_channels ADD COLUMN IF NOT EXISTS notes TEXT;
