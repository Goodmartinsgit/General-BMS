-- Add variant tracking and overall balance columns to stock_movements
ALTER TABLE stock_movements
  ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id),
  ADD COLUMN IF NOT EXISTS variant_id INTEGER REFERENCES product_variants(id),
  ADD COLUMN IF NOT EXISTS variant_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS total_stock_after INTEGER;

-- Index for faster lookups by product + category
CREATE INDEX IF NOT EXISTS idx_stock_movements_category ON stock_movements(product_id, category_id);
