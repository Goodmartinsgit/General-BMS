-- Customer change requests (email / whatsapp changes that require admin approval)
CREATE TABLE IF NOT EXISTS customer_change_requests (
  id            SERIAL PRIMARY KEY,
  customer_id   INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  request_type  VARCHAR(30) NOT NULL,  -- 'email' | 'whatsapp'
  current_value VARCHAR(255),
  new_value     VARCHAR(255) NOT NULL,
  reason        TEXT,
  status        VARCHAR(20) DEFAULT 'pending',  -- pending | approved | rejected
  admin_note    TEXT,
  reviewed_by   UUID REFERENCES users(id),
  reviewed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_change_requests_customer ON customer_change_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_change_requests_status ON customer_change_requests(status);
CREATE INDEX IF NOT EXISTS idx_change_requests_type ON customer_change_requests(request_type);
