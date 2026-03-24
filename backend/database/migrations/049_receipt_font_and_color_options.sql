-- Migration 049: Add receipt font weight, heading color, and label color

DO $$
BEGIN

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'receipt_config' AND column_name = 'receipt_font_weight'
  ) THEN
    ALTER TABLE receipt_config ADD COLUMN receipt_font_weight VARCHAR(20) DEFAULT 'normal';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'receipt_config' AND column_name = 'receipt_heading_color'
  ) THEN
    ALTER TABLE receipt_config ADD COLUMN receipt_heading_color VARCHAR(9) DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'receipt_config' AND column_name = 'receipt_label_color'
  ) THEN
    ALTER TABLE receipt_config ADD COLUMN receipt_label_color VARCHAR(9) DEFAULT '';
  END IF;

  RAISE NOTICE 'receipt_config font/color columns added successfully';

END $$;
