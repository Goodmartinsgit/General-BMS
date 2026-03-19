-- Widen movement_type from VARCHAR(20) to VARCHAR(50) to accommodate
-- online store movement types like 'order_reserved', 'order_released', etc.
ALTER TABLE stock_movements
  ALTER COLUMN movement_type TYPE VARCHAR(50);
