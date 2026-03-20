-- Migration 046: Enhance receipt_config table with template selection, delivery format,
-- currency settings, email/whatsapp templates, and display toggles.

DO $$
BEGIN

  -- Template selection (numeric ID 1-8)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'receipt_config' AND column_name = 'template_id'
  ) THEN
    ALTER TABLE receipt_config ADD COLUMN template_id INTEGER DEFAULT 1;
  END IF;

  -- Currency settings
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'receipt_config' AND column_name = 'currency_symbol'
  ) THEN
    ALTER TABLE receipt_config ADD COLUMN currency_symbol VARCHAR(5) DEFAULT '₦';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'receipt_config' AND column_name = 'currency_code'
  ) THEN
    ALTER TABLE receipt_config ADD COLUMN currency_code VARCHAR(5) DEFAULT 'NGN';
  END IF;

  -- Tax settings
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'receipt_config' AND column_name = 'tax_rate'
  ) THEN
    ALTER TABLE receipt_config ADD COLUMN tax_rate DECIMAL(5,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'receipt_config' AND column_name = 'tax_label'
  ) THEN
    ALTER TABLE receipt_config ADD COLUMN tax_label VARCHAR(20) DEFAULT 'VAT';
  END IF;

  -- Company website
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'receipt_config' AND column_name = 'company_website'
  ) THEN
    ALTER TABLE receipt_config ADD COLUMN company_website VARCHAR(200) DEFAULT '';
  END IF;

  -- Display toggles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'receipt_config' AND column_name = 'show_company_details'
  ) THEN
    ALTER TABLE receipt_config ADD COLUMN show_company_details BOOLEAN DEFAULT TRUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'receipt_config' AND column_name = 'show_tax_breakdown'
  ) THEN
    ALTER TABLE receipt_config ADD COLUMN show_tax_breakdown BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'receipt_config' AND column_name = 'show_payment_details'
  ) THEN
    ALTER TABLE receipt_config ADD COLUMN show_payment_details BOOLEAN DEFAULT TRUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'receipt_config' AND column_name = 'show_customer_details'
  ) THEN
    ALTER TABLE receipt_config ADD COLUMN show_customer_details BOOLEAN DEFAULT TRUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'receipt_config' AND column_name = 'show_referrer_details'
  ) THEN
    ALTER TABLE receipt_config ADD COLUMN show_referrer_details BOOLEAN DEFAULT TRUE;
  END IF;

  -- Email templates
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'receipt_config' AND column_name = 'email_subject_template'
  ) THEN
    ALTER TABLE receipt_config ADD COLUMN email_subject_template TEXT DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'receipt_config' AND column_name = 'email_body_template'
  ) THEN
    ALTER TABLE receipt_config ADD COLUMN email_body_template TEXT DEFAULT '';
  END IF;

  -- WhatsApp message template
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'receipt_config' AND column_name = 'whatsapp_message_template'
  ) THEN
    ALTER TABLE receipt_config ADD COLUMN whatsapp_message_template TEXT DEFAULT 'Hello {customer_name},

Thank you for your purchase at {company_name}!

📄 Receipt Number: {receipt_number}
💰 Total Amount: ₦{total_amount}

For any inquiries, please contact us.

Thank you for your business!

- {company_name} Team';
  END IF;

  -- Update delivery_format to support new values
  -- The existing column may have 'print' default, update to 'auto'
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'receipt_config' AND column_name = 'delivery_format'
  ) THEN
    ALTER TABLE receipt_config ALTER COLUMN delivery_format SET DEFAULT 'auto';
  END IF;

  -- Rename old columns to match new naming convention if needed
  -- company_name may not exist yet (old schema uses business_name)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'receipt_config' AND column_name = 'company_name'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'receipt_config' AND column_name = 'business_name'
    ) THEN
      ALTER TABLE receipt_config RENAME COLUMN business_name TO company_name;
    ELSE
      ALTER TABLE receipt_config ADD COLUMN company_name VARCHAR(150) DEFAULT '';
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'receipt_config' AND column_name = 'company_address'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'receipt_config' AND column_name = 'business_address'
    ) THEN
      ALTER TABLE receipt_config RENAME COLUMN business_address TO company_address;
    ELSE
      ALTER TABLE receipt_config ADD COLUMN company_address TEXT DEFAULT '';
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'receipt_config' AND column_name = 'company_phone'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'receipt_config' AND column_name = 'business_phone'
    ) THEN
      ALTER TABLE receipt_config RENAME COLUMN business_phone TO company_phone;
    ELSE
      ALTER TABLE receipt_config ADD COLUMN company_phone VARCHAR(20) DEFAULT '';
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'receipt_config' AND column_name = 'company_email'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'receipt_config' AND column_name = 'business_email'
    ) THEN
      ALTER TABLE receipt_config RENAME COLUMN business_email TO company_email;
    ELSE
      ALTER TABLE receipt_config ADD COLUMN company_email VARCHAR(100) DEFAULT '';
    END IF;
  END IF;

  -- Rename receipt_footer → footer_text (if old schema)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'receipt_config' AND column_name = 'footer_text'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'receipt_config' AND column_name = 'receipt_footer'
    ) THEN
      ALTER TABLE receipt_config RENAME COLUMN receipt_footer TO footer_text;
    ELSE
      ALTER TABLE receipt_config ADD COLUMN footer_text TEXT DEFAULT 'Thank you for your business!';
    END IF;
  END IF;

  -- Rename tax_registration_number → tax_number
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'receipt_config' AND column_name = 'tax_number'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'receipt_config' AND column_name = 'tax_registration_number'
    ) THEN
      ALTER TABLE receipt_config RENAME COLUMN tax_registration_number TO tax_number;
    ELSE
      ALTER TABLE receipt_config ADD COLUMN tax_number VARCHAR(50) DEFAULT '';
    END IF;
  END IF;

  -- Rename logo_url → company_logo_url
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'receipt_config' AND column_name = 'company_logo_url'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'receipt_config' AND column_name = 'logo_url'
    ) THEN
      ALTER TABLE receipt_config RENAME COLUMN logo_url TO company_logo_url;
    ELSE
      ALTER TABLE receipt_config ADD COLUMN company_logo_url TEXT DEFAULT '';
    END IF;
  END IF;

  -- show_tax_number toggle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'receipt_config' AND column_name = 'show_tax_number'
  ) THEN
    ALTER TABLE receipt_config ADD COLUMN show_tax_number BOOLEAN DEFAULT TRUE;
  END IF;

  RAISE NOTICE 'receipt_config table enhanced successfully';

END $$;
