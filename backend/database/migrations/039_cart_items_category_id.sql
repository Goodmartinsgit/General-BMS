-- Migration 039: Add category_id to cart_items and online_order_items
--
-- Allows the same product to appear multiple times in a cart/order
-- with different category leaf selections (e.g. Bra Cup Size 32 + Size 34).

-- 1. Add category_id column to cart_items
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS category_id INT REFERENCES categories(id);

-- 2. Drop old unique constraint that doesn't account for category
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_cart_id_product_id_variant_id_key;

-- 3. Create new unique index that includes category_id
CREATE UNIQUE INDEX cart_items_unique_item
  ON cart_items(cart_id, product_id, COALESCE(variant_id, 0), COALESCE(category_id, 0));

-- 4. Add category_id to online_order_items for order history
ALTER TABLE online_order_items ADD COLUMN IF NOT EXISTS category_id INT REFERENCES categories(id);
ALTER TABLE online_order_items ADD COLUMN IF NOT EXISTS category_name VARCHAR(255);
