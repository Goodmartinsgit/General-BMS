-- Communication channel preference, registration settings, and WhatsApp Cloud API config
-- customer_channel: 'email' or 'whatsapp' — determines how the store communicates with customers

ALTER TABLE store_config
  ADD COLUMN IF NOT EXISTS customer_channel VARCHAR(20) DEFAULT 'email',
  ADD COLUMN IF NOT EXISTS require_registration BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS min_order_amount_for_guest DECIMAL(12,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS whatsapp_phone_number_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS whatsapp_business_account_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS whatsapp_access_token TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_verify_token VARCHAR(255);
