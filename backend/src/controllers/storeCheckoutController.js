'use strict';

const { query, pool } = require('../config/db');
const { checkoutSchema } = require('../validators/storeValidators');

// ---------------------------------------------------------------------------
// Helper: deduct quantity_reserved for each order item
// Called during checkout; actual quantity_on_hand deducted on payment confirmation
// ---------------------------------------------------------------------------
async function reserveInventory(client, orderId) {
  const items = await client.query(
    `SELECT * FROM online_order_items WHERE order_id = $1`,
    [orderId]
  );
  for (const item of items.rows) {
    if (!item.product_id) continue;
    await client.query(
      `UPDATE inventory
       SET quantity_reserved = COALESCE(quantity_reserved, 0) + $1
       WHERE product_id = $2`,
      [item.quantity, item.product_id]
    );
    await client.query(
      `INSERT INTO stock_movements
         (product_id, movement_type, quantity, reference_type, reference_id, notes, created_at)
       VALUES ($1, 'online_order_reserved', $2, 'online_order', $3, $4, NOW())`,
      [item.product_id, item.quantity, orderId, `Online order ${orderId} reserved`]
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/store/:slug/checkout
// ---------------------------------------------------------------------------
const checkout = async (req, res) => {
  const client = await pool.connect();
  try {
    // Validate request body
    const { error, value } = checkoutSchema.validate(req.body, { abortEarly: false, allowUnknown: true, stripUnknown: true });
    if (error) {
      console.error('[storeCheckoutController.checkout] Validation errors:', error.details.map(d => d.message));
      console.error('[storeCheckoutController.checkout] Body keys:', Object.keys(req.body));
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.details.map((d) => d.message),
      });
    }

    const {
      email,
      shippingAddress,
      billingAddress,
      paymentMethod,
      bankChannelId,
      shippingAmount: clientShippingAmount,
      notes,
    } = value;

    // Identify the customer / session
    const customerId = req.customer ? req.customer.customerId : null;
    const sessionId = req.sessionId;

    // Find the cart
    let cartRes;
    if (customerId) {
      cartRes = await client.query(
        `SELECT * FROM carts WHERE customer_id = $1 LIMIT 1`,
        [customerId]
      );
    } else if (sessionId) {
      cartRes = await client.query(
        `SELECT * FROM carts WHERE session_id = $1 AND customer_id IS NULL LIMIT 1`,
        [sessionId]
      );
    }

    if (!cartRes || cartRes.rows.length === 0) {
      console.error('[storeCheckoutController.checkout] No cart found. customerId:', customerId, 'sessionId:', sessionId);
      return res.status(400).json({ message: 'Your cart is empty' });
    }
    const cart = cartRes.rows[0];

    // Fetch cart items with product info
    const itemsRes = await client.query(
      `SELECT ci.*, p.product_name, p.product_images, p.product_code as sku,
              p.is_online_available, p.retail_price,
              pv.sku as variant_sku, pv.retail_price as variant_price,
              cat.category_name as cat_name,
              piv.v2_image_url,
              pca_img.cat_image_url,
              COALESCE(
                (SELECT SUM(COALESCE(quantity_on_hand,0) - COALESCE(quantity_reserved,0)) FROM inventory WHERE product_id = ci.product_id),
                0
              ) as stock_qty,
              COALESCE(
                (SELECT SUM(COALESCE(quantity_on_hand,0) - COALESCE(quantity_reserved,0)) FROM variant_inventory WHERE variant_id = ci.variant_id),
                0
              ) as variant_stock_qty,
              pca_stock.cat_stock_allocated
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       LEFT JOIN product_variants pv ON pv.id = ci.variant_id
       LEFT JOIN categories cat ON cat.id = ci.category_id
       LEFT JOIN LATERAL (
         SELECT COALESCE(stock_allocated, 0) as cat_stock_allocated
         FROM product_category_assignments
         WHERE product_id = ci.product_id AND category_id = ci.category_id
         LIMIT 1
       ) pca_stock ON ci.category_id IS NOT NULL
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
       WHERE ci.cart_id = $1`,
      [cart.id]
    );

    if (itemsRes.rows.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty' });
    }

    // Re-verify stock for each item
    for (const item of itemsRes.rows) {
      if (!item.is_online_available) {
        return res.status(400).json({ message: `Product "${item.product_name}" is no longer available` });
      }
      // Determine available stock: category assignment → variant → inventory
      let availableStock;
      if (item.category_id && item.cat_stock_allocated !== null && item.cat_stock_allocated !== undefined) {
        availableStock = parseInt(item.cat_stock_allocated);
      } else if (item.variant_id) {
        availableStock = parseInt(item.variant_stock_qty);
      } else {
        availableStock = parseInt(item.stock_qty);
      }
      if (availableStock < parseInt(item.quantity)) {
        return res.status(400).json({
          message: `Insufficient stock for "${item.product_name}"`,
          available: availableStock,
          requested: parseInt(item.quantity),
        });
      }
    }

    // Calculate subtotal
    let subtotal = itemsRes.rows.reduce((sum, item) => {
      const price = parseFloat(item.unit_price || item.retail_price || 0);
      return sum + price * parseInt(item.quantity);
    }, 0);
    subtotal = parseFloat(subtotal.toFixed(2));

    // Re-validate coupon if present
    let couponCode = cart.coupon_code || null;
    let couponDiscount = 0;
    if (couponCode) {
      const promoRes = await client.query(
        `SELECT * FROM promotions
         WHERE UPPER(promotion_code) = UPPER($1)
           AND is_active = true
           AND (start_date IS NULL OR start_date <= NOW())
           AND (end_date IS NULL OR end_date >= NOW())
           AND (usage_limit IS NULL OR current_usage_count < usage_limit)`,
        [couponCode]
      );
      if (promoRes.rows.length > 0) {
        const promo = promoRes.rows[0];
        if (promo.promotion_type === 'percentage' && promo.discount_percentage) {
          couponDiscount = parseFloat(((subtotal * parseFloat(promo.discount_percentage)) / 100).toFixed(2));
        } else if (promo.discount_amount) {
          couponDiscount = parseFloat(parseFloat(promo.discount_amount).toFixed(2));
        }
        couponDiscount = Math.min(couponDiscount, subtotal);
      } else {
        // Coupon is no longer valid — ignore it
        couponCode = null;
        couponDiscount = 0;
      }
    }

    // Tax and shipping — shipping comes from frontend (computed from deliveryConfig zones)
    const taxRate = 0; // 0% for now — could pull from store_config.tax_rate
    const shippingAmount = parseFloat(clientShippingAmount) || 0;
    const taxAmount = parseFloat(((subtotal - couponDiscount) * taxRate).toFixed(2));
    const total = parseFloat((subtotal - couponDiscount + taxAmount + shippingAmount).toFixed(2));

    // Validate bank channel if bank_transfer or manual
    const isManualPayment = paymentMethod === 'bank_transfer' || paymentMethod === 'manual';
    let bankChannelRow = null;
    if (isManualPayment) {
      if (!bankChannelId) {
        return res.status(400).json({ message: 'Bank channel is required for bank transfer' });
      }
      const bcRes = await client.query(
        `SELECT * FROM bank_channels WHERE id = $1 AND is_active = true`,
        [bankChannelId]
      );
      if (bcRes.rows.length === 0) {
        return res.status(400).json({ message: 'Invalid or inactive bank channel' });
      }
      bankChannelRow = bcRes.rows[0];
    }

    // Generate order number: ORD-YYYYMMDD-XXXX
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
    const countRes = await client.query(
      `SELECT COUNT(*) FROM online_orders WHERE created_at::date = CURRENT_DATE`
    );
    const seqNum = parseInt(countRes.rows[0].count) + 1;
    const orderNumber = `ORD-${datePart}-${String(seqNum).padStart(4, '0')}`;

    // Determine customer info
    let customerName = email.split('@')[0]; // fallback
    let customerPhone = shippingAddress.phone || '';

    if (customerId) {
      const custRes = await client.query(
        `SELECT customer_name, phone_number FROM customers WHERE id = $1`,
        [customerId]
      );
      if (custRes.rows.length > 0) {
        customerName = custRes.rows[0].customer_name || customerName;
        customerPhone = custRes.rows[0].phone_number || customerPhone;
      }
    } else {
      customerName = `${shippingAddress.firstName} ${shippingAddress.lastName}`.trim();
      customerPhone = shippingAddress.phone || '';
    }

    // Determine payment status
    const paymentStatus = isManualPayment ? 'AWAITING_CONFIRMATION' : 'PENDING';
    const orderStatus = 'PENDING';
    const statusHistory = [
      { status: 'PENDING', timestamp: now.toISOString(), note: 'Order placed' },
    ];

    await client.query('BEGIN');

    // Insert online_order
    const orderInsert = await client.query(
      `INSERT INTO online_orders (
         order_number, customer_id, customer_email, customer_name, customer_phone,
         subtotal, shipping_amount, tax_amount, discount_amount, total,
         currency, coupon_code,
         shipping_address, billing_address,
         payment_method, payment_status,
         bank_channel_id,
         status, status_history,
         customer_notes, created_at, updated_at
       ) VALUES (
         $1, $2, $3, $4, $5,
         $6, $7, $8, $9, $10,
         'NGN', $11,
         $12::jsonb, $13::jsonb,
         $14, $15,
         $16,
         $17, $18::jsonb,
         $19, NOW(), NOW()
       ) RETURNING *`,
      [
        orderNumber,
        customerId || null,
        email.toLowerCase(),
        customerName,
        customerPhone,
        subtotal, shippingAmount, taxAmount, couponDiscount, total,
        couponCode || null,
        JSON.stringify(shippingAddress),
        JSON.stringify(billingAddress || shippingAddress),
        paymentMethod, paymentStatus,
        bankChannelId || null,
        orderStatus, JSON.stringify(statusHistory),
        notes || null,
      ]
    );
    const order = orderInsert.rows[0];

    // Insert order items (snapshot product details)
    for (const item of itemsRes.rows) {
      const images = Array.isArray(item.product_images) ? item.product_images : [];
      const firstImg = images[0] || null;
      let productImage = firstImg && typeof firstImg === 'object' ? firstImg.url : firstImg;
      if (!productImage && item.v2_image_url) productImage = item.v2_image_url;
      if (!productImage && item.cat_image_url) productImage = item.cat_image_url;
      const unitPrice = parseFloat(item.unit_price || item.retail_price || 0);
      const effectiveSku = item.variant_id ? (item.variant_sku || item.sku) : item.sku;

      // Append category name to product name when present
      const displayName = item.cat_name
        ? `${item.product_name} — ${item.cat_name}`
        : item.product_name;

      await client.query(
        `INSERT INTO online_order_items
           (order_id, product_id, variant_id, category_id, category_name,
            product_name, product_image, sku,
            unit_price, quantity, total_price, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
        [
          order.id,
          item.product_id,
          item.variant_id || null,
          item.category_id || null,
          item.cat_name || null,
          displayName,
          productImage,
          effectiveSku,
          unitPrice,
          parseInt(item.quantity),
          parseFloat((unitPrice * parseInt(item.quantity)).toFixed(2)),
        ]
      );
    }

    // Reserve inventory (update quantity_reserved + stock_movements)
    await reserveInventory(client, order.id);

    // Increment coupon usage count
    if (couponCode) {
      await client.query(
        `UPDATE promotions
         SET current_usage_count = current_usage_count + 1
         WHERE UPPER(promotion_code) = UPPER($1)`,
        [couponCode]
      );
    }

    // If the guest has an account (by email), link customer_id
    if (!customerId) {
      const existingAuth = await client.query(
        `SELECT ca.customer_id FROM customer_auth ca
         JOIN customers c ON c.id = ca.customer_id
         WHERE ca.email = LOWER($1) AND c.deleted_at IS NULL`,
        [email]
      );
      if (existingAuth.rows.length > 0) {
        await client.query(
          `UPDATE online_orders SET customer_id = $1 WHERE id = $2`,
          [existingAuth.rows[0].customer_id, order.id]
        );
      }
    }

    // Clear cart
    await client.query(`DELETE FROM cart_items WHERE cart_id = $1`, [cart.id]);
    await client.query(
      `UPDATE carts SET coupon_code = NULL, coupon_discount = 0, updated_at = NOW() WHERE id = $1`,
      [cart.id]
    );

    await client.query('COMMIT');

    // Fetch final order with items
    const finalOrderRes = await query(
      `SELECT o.*, bc.channel_name, bc.bank_name, bc.account_name, bc.account_number, bc.channel_type
       FROM online_orders o
       LEFT JOIN bank_channels bc ON bc.id = o.bank_channel_id
       WHERE o.id = $1`,
      [order.id]
    );
    const finalOrderItemsRes = await query(
      `SELECT * FROM online_order_items WHERE order_id = $1 ORDER BY id`,
      [order.id]
    );
    const finalOrder = finalOrderRes.rows[0];

    const responsePayload = {
      order: {
        ...finalOrder,
        items: finalOrderItemsRes.rows,
      },
    };

    if (isManualPayment && bankChannelRow) {
      responsePayload.bankChannel = {
        id: bankChannelRow.id,
        channelName: bankChannelRow.channel_name,
        bankName: bankChannelRow.bank_name,
        accountName: bankChannelRow.account_name,
        accountNumber: bankChannelRow.account_number,
        channelType: bankChannelRow.channel_type,
      };
    }

    res.status(201).json(responsePayload);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[storeCheckoutController.checkout]', err);
    res.status(500).json({ message: 'Server error during checkout' });
  } finally {
    client.release();
  }
};

// ---------------------------------------------------------------------------
// GET /api/store/:slug/checkout/verify?reference=xxx
// ---------------------------------------------------------------------------
const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.query;
    if (!reference) {
      return res.status(400).json({ message: 'Payment reference is required' });
    }

    const result = await query(
      `SELECT o.id, o.order_number, o.payment_status, o.payment_method,
              o.status, o.total, o.currency, o.paid_at, o.created_at
       FROM online_orders o
       WHERE o.payment_reference = $1`,
      [reference]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found for this payment reference' });
    }

    const order = result.rows[0];
    res.json({
      reference,
      orderNumber: order.order_number,
      paymentStatus: order.payment_status,
      orderStatus: order.status,
      total: parseFloat(order.total),
      currency: order.currency,
      paidAt: order.paid_at,
    });
  } catch (err) {
    console.error('[storeCheckoutController.verifyPayment]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------------------------------------------------------------------------
// POST /api/store/:slug/checkout/proof-of-payment/:orderId
// Requires: multer upload.single('proof') at route level
// ---------------------------------------------------------------------------
const uploadProofOfPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { email } = req.body; // For guest orders — identify by email
    const customerId = req.customer ? req.customer.customerId : null;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Find the order
    let orderRes;
    if (customerId) {
      orderRes = await query(
        `SELECT * FROM online_orders WHERE id = $1 AND customer_id = $2 AND payment_method IN ('bank_transfer', 'manual')`,
        [orderId, customerId]
      );
    } else if (email) {
      orderRes = await query(
        `SELECT * FROM online_orders WHERE id = $1 AND LOWER(customer_email) = LOWER($2) AND payment_method IN ('bank_transfer', 'manual')`,
        [orderId, email]
      );
    } else {
      return res.status(400).json({ message: 'Authentication or email required' });
    }

    if (!orderRes || orderRes.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orderRes.rows[0];
    if (!['AWAITING_CONFIRMATION', 'PENDING'].includes(order.payment_status)) {
      return res.status(400).json({ message: 'Payment proof cannot be uploaded for this order status' });
    }

    // Upload to Cloudinary
    const { cloudinary } = require('../config/cloudinary');
    const streamifier = require('streamifier');

    const uploadFromBuffer = (buffer) =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'bms/payments', resource_type: 'auto' },
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
        streamifier.createReadStream(buffer).pipe(stream);
      });

    const uploadResult = await uploadFromBuffer(req.file.buffer);

    await query(
      `UPDATE online_orders SET proof_of_payment = $1, updated_at = NOW() WHERE id = $2`,
      [uploadResult.secure_url, orderId]
    );

    res.json({
      proofUrl: uploadResult.secure_url,
      message: 'Proof of payment uploaded successfully',
    });
  } catch (err) {
    console.error('[storeCheckoutController.uploadProofOfPayment]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { checkout, verifyPayment, uploadProofOfPayment };
