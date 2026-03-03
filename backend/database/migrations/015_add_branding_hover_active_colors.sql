-- Migration 015: Add hover_color and active_text_color to branding_config

ALTER TABLE branding_config
  ADD COLUMN IF NOT EXISTS hover_color VARCHAR(20) DEFAULT '#C5A353',
  ADD COLUMN IF NOT EXISTS active_text_color VARCHAR(20) DEFAULT '#000000';
