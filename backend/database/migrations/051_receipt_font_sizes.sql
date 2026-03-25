-- Migration 051: Add receipt_font_sizes JSONB column for per-category font size control

DO $$
BEGIN

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'receipt_config' AND column_name = 'receipt_font_sizes'
  ) THEN
    ALTER TABLE receipt_config ADD COLUMN receipt_font_sizes JSONB DEFAULT '{}'::jsonb;
  END IF;

  RAISE NOTICE 'receipt_config receipt_font_sizes column added successfully';

END $$;
