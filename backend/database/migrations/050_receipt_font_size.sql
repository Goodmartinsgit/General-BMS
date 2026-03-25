-- Migration 050: Add receipt_font_size column to receipt_config

DO $$
BEGIN

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'receipt_config' AND column_name = 'receipt_font_size'
  ) THEN
    ALTER TABLE receipt_config ADD COLUMN receipt_font_size VARCHAR(20) DEFAULT 'small';
  END IF;

  RAISE NOTICE 'receipt_config receipt_font_size column added successfully';

END $$;
