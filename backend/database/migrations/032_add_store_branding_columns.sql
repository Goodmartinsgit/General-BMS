-- Migration 032: Add missing branding columns to store_config
-- These columns are referenced by formatConfig() in storeConfigController.js
-- and exist in branding_config but were never added to store_config.

ALTER TABLE store_config
  ADD COLUMN IF NOT EXISTS hover_color       VARCHAR(20),
  ADD COLUMN IF NOT EXISTS active_text_color VARCHAR(20),
  ADD COLUMN IF NOT EXISTS sidebar_bg_color  VARCHAR(20),
  ADD COLUMN IF NOT EXISTS navbar_bg_color   VARCHAR(20),
  ADD COLUMN IF NOT EXISTS button_color      VARCHAR(20),
  ADD COLUMN IF NOT EXISTS logo_type         VARCHAR(50) DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS sidebar_name_size VARCHAR(20) DEFAULT 'text-lg';
