-- Add avatar_url column to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS avatar_url TEXT;
