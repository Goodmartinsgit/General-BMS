'use strict';

const { query, pool } = require('../config/db');

// ---------------------------------------------------------------------------
// Helper: get or create cart for a customer or session
// ---------------------------------------------------------------------------
async function getOrCreateCart(customerId, sessionId) {
  if (customerId) {
    // Authenticated customer
    const existing = await query(
      `SELECT * FROM carts WHERE customer_id = $1 LIMIT 1`,
      [customerId]
    );
    if (existing.rows.length > 0) return existing.rows[0];

    const created = await query(
      `INSERT INTO carts (customer_id, created_at, updated_at)
       VALUES ($1, NOW(), NOW()) RETURNING *`,
      [customerId]
    );
    return created.rows[0];
  } else if (sessionId) {
    // Guest session
    const existing = await query(
      `SELECT * FROM carts WHERE session_id = $1 AND customer_id IS NULL LIMIT 1`,
      [sessionId]
    );
    if (existing.rows.length > 0) return existing.rows[0];

    const created = await query(
      `INSERT INTO carts (session_id, created_at, updated_at)
       VALUES ($1, NOW(), NOW()) RETURNING *`,
      [sessionId]
    );
    return created.rows[0];
  }
  return null;
}

// ---------------------------------------------------------------------------
// Helper: build full cart response
// ---------------------------------------------------------------------------
async function buildCartResponse(cartId, couponCode, couponDiscount) {
  // Fetch items with product + variant info
  const itemsRes = await query(
    `SELECT
       ci.id,
       ci.product_id,
       ci.variant_id,
       ci.category_id,
       ci.quantity,
       ci.unit_price,
       p.product_name,
       p.slug as product_slug,
       p.product_images,
       p.product_code as sku,
       p.is_online_available,
       pv.sku as variant_sku,
       pv.variant_name,
       pv.variant_values as variant_attributes,
       cat_path.category_path as category_name,
       piv.v2_image_url,
       pca_img.cat_image_url,
       COALESCE(
         (SELECT SUM(quantity_available) FROM inventory WHERE product_id = ci.product_id),
         0
       ) as stock_qty,
       COALESCE(
         (SELECT SUM(quantity_on_hand) FROM variant_inventory WHERE variant_id = ci.variant_id),
         0
       ) as variant_stock_qty
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     LEFT JOIN product_variants pv ON pv.id = ci.variant_id
     LEFT JOIN LATERAL (
       WITH RECURSIVE cat_chain AS (
         SELECT id, category_name, parent_category_id, level
         FROM categories WHERE id = ci.category_id
         UNION ALL
         SELECT c.id, c.category_name, c.parent_category_id, c.level
         FROM categories c
         JOIN cat_chain cc ON c.id = cc.parent_category_id
         WHERE c.level > 1
       )
       SELECT string_agg(category_name, ' / ' ORDER BY level) as category_path
       FROM cat_chain
     ) cat_path ON true
     LEFT JOIN LATERAL (
       SELECT image_url as v2_image_url
       FROM product_images_v2
       WHERE product_id = ci.product_id
       ORDER BY is_primary DESC, display_order, id
       LIMIT 1
     ) piv ON true
     LEFT JOIN LATERAL (
       SELECT image_url as cat_image_url
       FROM product_category_assignments
       WHERE product_id = ci.product_id AND image_url IS NOT NULL
       LIMIT 1
     ) pca_img ON true
     WHERE ci.cart_id = $1
     ORDER BY ci.created_at ASC`,
    [cartId]
  );

  const items = itemsRes.rows.map((row) => {
    const rawImages = Array.isArray(row.product_images) ? row.product_images : [];
    // product_images JSONB may contain objects {url, alt} or plain URL strings
    let thumbnail = rawImages.length > 0
      ? (typeof rawImages[0] === 'object' && rawImages[0] !== null ? rawImages[0].url : rawImages[0])
      : undefined;
    // Fallback: product_images_v2 table, then category assignment images
    if (!thumbnail && row.v2_image_url) thumbnail = row.v2_image_url;
    if (!thumbnail && row.cat_image_url) thumbnail = row.cat_image_url;
    const unitPrice = parseFloat(row.unit_price || 0);
    const stockQty = row.variant_id ? parseInt(row.variant_stock_qty) : parseInt(row.stock_qty);
    const qty = parseInt(row.quantity);
    return {
      id: String(row.id),
      productId: String(row.product_id),
      variantId: row.variant_id ? String(row.variant_id) : undefined,
      categoryId: row.category_id ? String(row.category_id) : undefined,
      categoryName: row.category_name || undefined,
      quantity: qty,
      unitPrice,
      totalPrice: parseFloat((unitPrice * qty).toFixed(2)),
      product: {
        name: row.product_name,
        slug: row.product_slug || String(row.product_id),
        thumbnail,
        sku: row.variant_id ? (row.variant_sku || row.sku) : row.sku,
      },
      variant: row.variant_id ? {
        name: row.variant_name || '',
        options: row.variant_attributes || {},
      } : undefined,
      isAvailable: stockQty > 0,
      maxQuantity: stockQty > 0 ? stockQty : undefined,
    };
  });

  const subtotal = parseFloat(items.reduce((sum, i) => sum + i.totalPrice, 0).toFixed(2));
  const discount = parseFloat(couponDiscount || 0);
  const total = parseFloat(Math.max(0, subtotal - discount).toFixed(2));
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const now = new Date().toISOString();

  return {
    id: String(cartId),
    items,
    itemCount,
    subtotal,
    currency: 'NGN',
    couponCode: couponCode || undefined,
    couponDiscount: discount || undefined,
    shippingEstimate: 0,
    taxEstimate: 0,
    total,
    createdAt: now,
    updatedAt: now,
  };
}

// ---------------------------------------------------------------------------
// GET /api/store/:slug/cart
// ---------------------------------------------------------------------------
const getCart = async (req, res) => {
  try {
    const customerId = req.customer ? req.customer.customerId : null;
    const sessionId = req.sessionId;

    if (!customerId && !sessionId) {
      // Return empty cart
      return res.json({
        id: null, items: [], itemCount: 0, subtotal: 0,
        currency: 'NGN', shippingEstimate: 0, taxEstimate: 0,
        total: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      });
    }

    const cart = await getOrCreateCart(customerId, sessionId);
    if (!cart) {
      return res.json({
        id: null, items: [], itemCount: 0, subtotal: 0,
        currency: 'NGN', shippingEstimate: 0, taxEstimate: 0,
        total: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      });
    }

    const cartData = await buildCartResponse(cart.id, cart.coupon_code, cart.coupon_discount);
    res.json(cartData);
  } catch (err) {
    console.error('[storeCartController.getCart]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------------------------------------------------------------------------
// POST /api/store/:slug/cart/items   { productId, variantId?, quantity }
// ---------------------------------------------------------------------------
const addItem = async (req, res) => {
  try {
    const customerId = req.customer ? req.customer.customerId : null;
    const sessionId = req.sessionId;

    const { productId, variantId, categoryId, quantity = 1 } = req.body;

    if (!productId) return res.status(400).json({ message: 'productId is required' });
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1) return res.status(400).json({ message: 'quantity must be a positive integer' });

    if (!customerId && !sessionId) {
      return res.status(400).json({ message: 'Session ID or authentication required' });
    }

    // Verify product is available online
    const productRes = await query(
      `SELECT p.*, COALESCE(inv.total_qty, 0) as stock_qty
       FROM products p
       LEFT JOIN (SELECT product_id, SUM(quantity_available) as total_qty FROM inventory GROUP BY product_id) inv
         ON inv.product_id = p.id
       WHERE p.id = $1 AND p.is_online_available = true AND p.deleted_at IS NULL`,
      [productId]
    );
    if (productRes.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found or not available' });
    }
    const product = productRes.rows[0];

    // Determine unit price and check stock
    let unitPrice = parseFloat(product.retail_price || 0);
    if (categoryId) {
      // Use category assignment price/stock
      const pcaRes = await query(
        `SELECT pca.price_override, pca.stock_allocated
         FROM product_category_assignments pca
         WHERE pca.product_id = $1 AND pca.category_id = $2`,
        [productId, categoryId]
      );
      if (pcaRes.rows.length > 0) {
        const pca = pcaRes.rows[0];
        if (pca.price_override) unitPrice = parseFloat(pca.price_override);
      }
    } else if (variantId) {
      const varRes = await query(
        `SELECT pv.*,
                COALESCE(vi.total_qty, 0) as variant_stock
         FROM product_variants pv
         LEFT JOIN (SELECT variant_id, SUM(quantity_on_hand) as total_qty FROM variant_inventory GROUP BY variant_id) vi
           ON vi.variant_id = pv.id
         WHERE pv.id = $1 AND pv.product_id = $2 AND pv.is_active = true`,
        [variantId, productId]
      );
      if (varRes.rows.length === 0) {
        return res.status(404).json({ message: 'Variant not found' });
      }
      const variant = varRes.rows[0];
      if (parseInt(variant.variant_stock) < qty) {
        return res.status(400).json({ message: 'Insufficient stock for this variant', available: parseInt(variant.variant_stock) });
      }
      if (variant.selling_price) unitPrice = parseFloat(variant.selling_price);
    } else {
      if (parseInt(product.stock_qty) < qty) {
        return res.status(400).json({ message: 'Insufficient stock', available: parseInt(product.stock_qty) });
      }
    }

    // Get or create cart
    const cart = await getOrCreateCart(customerId, sessionId);

    // Upsert cart item (dedup includes category_id)
    const existing = await query(
      `SELECT id, quantity FROM cart_items
       WHERE cart_id = $1 AND product_id = $2
         AND (($3::int IS NULL AND variant_id IS NULL) OR variant_id = $3)
         AND (($4::int IS NULL AND category_id IS NULL) OR category_id = $4)`,
      [cart.id, productId, variantId || null, categoryId || null]
    );

    if (existing.rows.length > 0) {
      const newQty = parseInt(existing.rows[0].quantity) + qty;
      await query(
        `UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2`,
        [newQty, existing.rows[0].id]
      );
    } else {
      await query(
        `INSERT INTO cart_items (cart_id, product_id, variant_id, category_id, quantity, unit_price, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [cart.id, productId, variantId || null, categoryId || null, qty, unitPrice]
      );
    }

    // Update cart updated_at
    await query(`UPDATE carts SET updated_at = NOW() WHERE id = $1`, [cart.id]);

    const updatedCart = await query(`SELECT * FROM carts WHERE id = $1`, [cart.id]);
    const cartRow = updatedCart.rows[0];
    const cartData = await buildCartResponse(cart.id, cartRow.coupon_code, cartRow.coupon_discount);
    res.status(201).json(cartData);
  } catch (err) {
    console.error('[storeCartController.addItem]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------------------------------------------------------------------------
// PUT /api/store/:slug/cart/items/:itemId   { quantity }
// ---------------------------------------------------------------------------
const updateItem = async (req, res) => {
  try {
    const customerId = req.customer ? req.customer.customerId : null;
    const sessionId = req.sessionId;
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined) return res.status(400).json({ message: 'quantity is required' });
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 0) return res.status(400).json({ message: 'quantity must be >= 0' });

    // Find cart
    const cart = await getOrCreateCart(customerId, sessionId);
    if (!cart) return res.status(400).json({ message: 'Cart not found' });

    // Verify item belongs to this cart
    const itemRes = await query(
      `SELECT * FROM cart_items WHERE id = $1 AND cart_id = $2`,
      [itemId, cart.id]
    );
    if (itemRes.rows.length === 0) return res.status(404).json({ message: 'Cart item not found' });

    if (qty === 0) {
      await query(`DELETE FROM cart_items WHERE id = $1`, [itemId]);
    } else {
      await query(
        `UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2`,
        [qty, itemId]
      );
    }

    await query(`UPDATE carts SET updated_at = NOW() WHERE id = $1`, [cart.id]);

    const cartRow = (await query(`SELECT * FROM carts WHERE id = $1`, [cart.id])).rows[0];
    const cartData = await buildCartResponse(cart.id, cartRow.coupon_code, cartRow.coupon_discount);
    res.json(cartData);
  } catch (err) {
    console.error('[storeCartController.updateItem]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/store/:slug/cart/items/:itemId
// ---------------------------------------------------------------------------
const removeItem = async (req, res) => {
  try {
    const customerId = req.customer ? req.customer.customerId : null;
    const sessionId = req.sessionId;
    const { itemId } = req.params;

    const cart = await getOrCreateCart(customerId, sessionId);
    if (!cart) return res.status(400).json({ message: 'Cart not found' });

    const result = await query(
      `DELETE FROM cart_items WHERE id = $1 AND cart_id = $2 RETURNING id`,
      [itemId, cart.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Cart item not found' });

    await query(`UPDATE carts SET updated_at = NOW() WHERE id = $1`, [cart.id]);

    const cartRow = (await query(`SELECT * FROM carts WHERE id = $1`, [cart.id])).rows[0];
    const cartData = await buildCartResponse(cart.id, cartRow.coupon_code, cartRow.coupon_discount);
    res.json(cartData);
  } catch (err) {
    console.error('[storeCartController.removeItem]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/store/:slug/cart
// ---------------------------------------------------------------------------
const clearCart = async (req, res) => {
  try {
    const customerId = req.customer ? req.customer.customerId : null;
    const sessionId = req.sessionId;

    const cart = await getOrCreateCart(customerId, sessionId);
    if (!cart) {
      return res.json({
        id: null, items: [], itemCount: 0, subtotal: 0,
        currency: 'NGN', shippingEstimate: 0, taxEstimate: 0,
        total: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      });
    }

    await query(`DELETE FROM cart_items WHERE cart_id = $1`, [cart.id]);
    await query(
      `UPDATE carts SET coupon_code = NULL, coupon_discount = 0, updated_at = NOW() WHERE id = $1`,
      [cart.id]
    );

    res.json({
      id: String(cart.id), items: [], itemCount: 0, subtotal: 0,
      currency: 'NGN', shippingEstimate: 0, taxEstimate: 0,
      total: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[storeCartController.clearCart]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------------------------------------------------------------------------
// POST /api/store/:slug/cart/coupon   { couponCode }
// ---------------------------------------------------------------------------
const applyCoupon = async (req, res) => {
  try {
    const customerId = req.customer ? req.customer.customerId : null;
    const sessionId = req.sessionId;
    const { couponCode } = req.body;

    if (!couponCode) return res.status(400).json({ message: 'couponCode is required' });

    const cart = await getOrCreateCart(customerId, sessionId);
    if (!cart) return res.status(400).json({ message: 'Cart not found' });

    // Validate promotion
    const promoRes = await query(
      `SELECT * FROM promotions
       WHERE UPPER(promotion_code) = UPPER($1)
         AND is_active = true
         AND (start_date IS NULL OR start_date <= NOW())
         AND (end_date IS NULL OR end_date >= NOW())
         AND (usage_limit IS NULL OR current_usage_count < usage_limit)`,
      [couponCode]
    );

    if (promoRes.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired coupon code' });
    }
    const promo = promoRes.rows[0];

    // Get current cart subtotal to validate min purchase
    const itemsRes = await query(
      `SELECT ci.quantity, ci.unit_price FROM cart_items ci WHERE ci.cart_id = $1`,
      [cart.id]
    );
    if (itemsRes.rows.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty' });
    }
    const subtotal = itemsRes.rows.reduce((sum, r) => sum + parseFloat(r.unit_price) * parseInt(r.quantity), 0);

    if (promo.min_purchase_amount && subtotal < parseFloat(promo.min_purchase_amount)) {
      return res.status(400).json({
        message: `Minimum purchase of ${promo.min_purchase_amount} required for this coupon`,
        minPurchase: parseFloat(promo.min_purchase_amount),
      });
    }

    // Calculate discount
    let discount = 0;
    if (promo.promotion_type === 'percentage' && promo.discount_percentage) {
      discount = parseFloat(((subtotal * parseFloat(promo.discount_percentage)) / 100).toFixed(2));
    } else if (promo.discount_amount) {
      discount = parseFloat(promo.discount_amount);
    }
    // Cap discount at subtotal
    discount = Math.min(discount, subtotal);

    // Update cart
    await query(
      `UPDATE carts SET coupon_code = $1, coupon_discount = $2, updated_at = NOW() WHERE id = $3`,
      [couponCode.toUpperCase(), discount, cart.id]
    );

    const cartData = await buildCartResponse(cart.id, couponCode.toUpperCase(), discount);
    res.json({ ...cartData, couponMessage: `Coupon applied! You saved ${discount.toFixed(2)}` });
  } catch (err) {
    console.error('[storeCartController.applyCoupon]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/store/:slug/cart/coupon
// ---------------------------------------------------------------------------
const removeCoupon = async (req, res) => {
  try {
    const customerId = req.customer ? req.customer.customerId : null;
    const sessionId = req.sessionId;

    const cart = await getOrCreateCart(customerId, sessionId);
    if (!cart) return res.status(400).json({ message: 'Cart not found' });

    await query(
      `UPDATE carts SET coupon_code = NULL, coupon_discount = 0, updated_at = NOW() WHERE id = $1`,
      [cart.id]
    );

    const cartData = await buildCartResponse(cart.id, null, 0);
    res.json(cartData);
  } catch (err) {
    console.error('[storeCartController.removeCoupon]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getCart, addItem, updateItem, removeItem, clearCart, applyCoupon, removeCoupon };
