-- Add WhatsApp number and OTP verification columns to customer_auth
ALTER TABLE customer_auth
  ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS otp_code VARCHAR(6),
  ADD COLUMN IF NOT EXISTS otp_expires TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Index for WhatsApp login lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_auth_whatsapp
  ON customer_auth (whatsapp_number)
  WHERE whatsapp_number IS NOT NULL;

-- Backfill: mark existing email-verified accounts as verified
UPDATE customer_auth SET is_verified = true WHERE is_email_verified = true;
