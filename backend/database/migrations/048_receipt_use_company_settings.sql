-- Migration 048: Add use_company_branding and use_company_info toggles to receipt_config

DO $$
BEGIN

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'receipt_config' AND column_name = 'use_company_branding'
  ) THEN
    ALTER TABLE receipt_config ADD COLUMN use_company_branding BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'receipt_config' AND column_name = 'use_company_info'
  ) THEN
    ALTER TABLE receipt_config ADD COLUMN use_company_info BOOLEAN DEFAULT FALSE;
  END IF;

  RAISE NOTICE 'receipt_config company toggle columns added successfully';

END $$;
