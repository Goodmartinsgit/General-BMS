-- Migration 047: Add receipt color settings (background, text, accent)

DO $$
BEGIN

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'receipt_config' AND column_name = 'receipt_bg_color'
  ) THEN
    ALTER TABLE receipt_config ADD COLUMN receipt_bg_color VARCHAR(9) DEFAULT '#ffffff';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'receipt_config' AND column_name = 'receipt_text_color'
  ) THEN
    ALTER TABLE receipt_config ADD COLUMN receipt_text_color VARCHAR(9) DEFAULT '#111827';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'receipt_config' AND column_name = 'receipt_accent_color'
  ) THEN
    ALTER TABLE receipt_config ADD COLUMN receipt_accent_color VARCHAR(9) DEFAULT '';
  END IF;

  RAISE NOTICE 'receipt_config color columns added successfully';

END $$;
