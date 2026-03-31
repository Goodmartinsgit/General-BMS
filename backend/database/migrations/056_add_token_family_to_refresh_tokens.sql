-- Add token_family column for fast refresh token lookup
-- Instead of iterating all tokens with bcrypt.compare, we store a prefix
-- of the raw token for instant DB-level narrowing.

ALTER TABLE refresh_tokens
  ADD COLUMN IF NOT EXISTS token_family VARCHAR(16);

-- Index for fast lookup by token_family
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_family
  ON refresh_tokens(token_family)
  WHERE revoked_at IS NULL;

-- Cleanup: revoke all expired tokens to keep the table lean
UPDATE refresh_tokens SET revoked_at = NOW()
  WHERE expires_at < NOW() AND revoked_at IS NULL;
