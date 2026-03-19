'use strict';

// Customer-facing order management
const { query } = require('../config/db');

// ---------------------------------------------------------------------------
// GET /api/store/:slug/orders  (requires storeAuth)
// ---------------------------------------------------------------------------
const getOrders = async (req, res) => {
  try {
    const { customerId } = req.customer;
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [customerId];
    let where = `WHERE o.customer_id = $1`;
    if (status && status !== 'all') {
      params.push(status.toUpperCase());
      where += ` AND o.status = $${params.length}`;
    }

    const countRes = await query(`SELECT COUNT(*) FROM online_orders o ${where}`, params);
    params.push(parseInt(limit), offset);
    const result = await query(
      `SELECT o.id, o.order_number, o.status, o.payment_status, o.payment_method,
              o.subtotal, o.total, o.currency, o.created_at, o.confirmed_at, o.shipped_at,
              o.delivered_at, o.tracking_number, o.shipping_carrier,
              (SELECT COUNT(*) FROM online_order_items WHERE order_id = o.id) as item_count,
              (SELECT json_agg(json_build_object('name', product_name, 'image', product_image, 'quantity', quantity))
               FROM online_order_items WHERE order_id = o.id LIMIT 3) as preview_items
       FROM online_orders o ${where}
       ORDER BY o.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const total = parseInt(countRes.rows[0].count);
    res.json({
      orders: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('[storeOrderController.getOrders]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------------------------------------------------------------------------
// GET /api/store/:slug/orders/:orderId  (requires storeAuth)
// ---------------------------------------------------------------------------
const getOrderById = async (req, res) => {
  try {
    const { customerId } = req.customer;
    const { orderId } = req.params;
    const result = await query(
      `SELECT o.*,
              bc.channel_name, bc.bank_name, bc.account_name, bc.account_number, bc.channel_type
       FROM online_orders o
       LEFT JOIN bank_channels bc ON bc.id = o.bank_channel_id
       WHERE o.id = $1 AND o.customer_id = $2`,
      [orderId, customerId]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Order not found' });

    const order = result.rows[0];
    const itemsRes = await query(
      `SELECT * FROM online_order_items WHERE order_id = $1 ORDER BY id`,
      [orderId]
    );

    res.json({
      ...order,
      bankChannel: order.channel_name
        ? {
            id: order.bank_channel_id,
            channelName: order.channel_name,
            bankName: order.bank_name,
            accountName: order.account_name,
            accountNumber: order.account_number,
            channelType: order.channel_type,
          }
        : null,
      items: itemsRes.rows,
    });
  } catch (err) {
    console.error('[storeOrderController.getOrderById]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------------------------------------------------------------------------
// POST /api/store/:slug/orders/:orderId/cancel  (requires storeAuth)
// ---------------------------------------------------------------------------
const cancelOrder = async (req, res) => {
  try {
    const { customerId } = req.customer;
    const { orderId } = req.params;
    const { reason } = req.body;

    const result = await query(
      `SELECT * FROM online_orders WHERE id = $1 AND customer_id = $2`,
      [orderId, customerId]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Order not found' });
    const order = result.rows[0];

    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      return res.status(400).json({ message: 'Order cannot be cancelled at this stage' });
    }

    const history = Array.isArray(order.status_history) ? order.status_history : [];
    history.push({
      status: 'CANCELLED',
      timestamp: new Date().toISOString(),
      note: reason || 'Cancelled by customer',
    });

    await query(
      `UPDATE online_orders
       SET status = 'CANCELLED', cancellation_reason = $1,
           cancelled_at = NOW(), status_history = $2::jsonb, updated_at = NOW()
       WHERE id = $3`,
      [reason || 'Cancelled by customer', JSON.stringify(history), orderId]
    );

    // Restore inventory reservations
    await query(
      `UPDATE inventory i
       SET quantity_reserved = GREATEST(0, quantity_reserved - oi.quantity)
       FROM online_order_items oi
       WHERE oi.order_id = $1 AND i.product_id = oi.product_id`,
      [orderId]
    );

    res.json({ message: 'Order cancelled successfully' });
  } catch (err) {
    console.error('[storeOrderController.cancelOrder]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------------------------------------------------------------------------
// POST /api/store/:slug/orders/:orderId/proof-of-payment  (requires storeAuth)
// ---------------------------------------------------------------------------
const uploadProofOfPayment = async (req, res) => {
  try {
    const { customerId } = req.customer;
    const { orderId } = req.params;

    const orderRes = await query(
      `SELECT * FROM online_orders WHERE id = $1 AND customer_id = $2 AND payment_method IN ('bank_transfer', 'manual')`,
      [orderId, customerId]
    );
    if (orderRes.rows.length === 0) return res.status(404).json({ message: 'Order not found' });

    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

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

    res.json({ proofUrl: uploadResult.secure_url, message: 'Proof of payment uploaded' });
  } catch (err) {
    console.error('[storeOrderController.uploadProofOfPayment]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------------------------------------------------------------------------
// GET /api/store/:slug/orders/track/:orderNumber  (PUBLIC — no auth)
// Query: ?phone=08012345678 (or ?email= for backward compat)
// ---------------------------------------------------------------------------
const trackOrder = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { phone, email } = req.query;

    if (!orderNumber) return res.status(400).json({ message: 'Order number is required' });
    if (!phone && !email) return res.status(400).json({ message: 'Phone number is required to look up your order' });

    // Support both phone and email lookup for backward compatibility
    const lookupField = phone ? 'o.customer_phone' : 'LOWER(o.customer_email)';
    const lookupValue = phone || email;
    const lookupParam = phone ? lookupValue : lookupValue.toLowerCase();

    const result = await query(
      `SELECT o.order_number, o.status, o.payment_status, o.payment_method,
              o.tracking_number, o.shipping_carrier, o.estimated_delivery,
              o.subtotal, o.shipping_amount, o.tax_amount, o.discount_amount, o.total, o.currency,
              o.created_at, o.confirmed_at, o.shipped_at, o.delivered_at,
              o.shipping_address,
              (SELECT COUNT(*) FROM online_order_items WHERE order_id = o.id) AS item_count
       FROM online_orders o
       WHERE o.order_number = $1 AND ${lookupField} = $2`,
      [orderNumber, lookupParam]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found. Please check your order number and phone number.' });
    }

    const r = result.rows[0];
    res.json({
      orderNumber:       r.order_number,
      status:            r.status,
      paymentStatus:     r.payment_status,
      paymentMethod:     r.payment_method,
      trackingNumber:    r.tracking_number   || null,
      shippingCarrier:   r.shipping_carrier  || null,
      estimatedDelivery: r.estimated_delivery || null,
      subtotal:          parseFloat(r.subtotal        || 0),
      shippingAmount:    parseFloat(r.shipping_amount  || 0),
      taxAmount:         parseFloat(r.tax_amount       || 0),
      discountAmount:    parseFloat(r.discount_amount  || 0),
      total:             parseFloat(r.total            || 0),
      currency:          r.currency  || 'NGN',
      itemCount:         parseInt(r.item_count || 0),
      shippingAddress:   r.shipping_address || null,
      createdAt:         r.created_at,
      confirmedAt:       r.confirmed_at  || null,
      shippedAt:         r.shipped_at    || null,
      deliveredAt:       r.delivered_at  || null,
    });
  } catch (err) {
    console.error('[storeOrderController.trackOrder]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getOrders, getOrderById, cancelOrder, uploadProofOfPayment, trackOrder };
