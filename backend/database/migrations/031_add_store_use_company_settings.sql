-- Migration 031: Add use_company_settings and store_settings columns to store_config
-- Allows stores to toggle between inheriting company-wide settings or using their own.

ALTER TABLE store_config
  ADD COLUMN IF NOT EXISTS use_company_settings JSONB NOT NULL DEFAULT '{"general":true,"branding":true,"tax":true,"receipt":true,"payment":true,"notifications":true,"security":true,"display":true}',
  ADD COLUMN IF NOT EXISTS store_settings JSONB NOT NULL DEFAULT '{}';
