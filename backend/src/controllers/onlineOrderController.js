'use strict';

// Admin-facing controller for managing online orders
const { query, pool } = require('../config/db');
const { sendOrderReceipt } = require('../services/orderReceiptService');

// ---------------------------------------------------------------------------
// Internal helper: deduct inventory for fulfilled online orders
// Decrements quantity_on_hand + quantity_reserved, records stock_movements
// ---------------------------------------------------------------------------
async function deductInventory(client, orderId) {
  const items = await client.query(
    `SELECT * FROM online_order_items WHERE order_id = $1`,
    [orderId]
  );
  for (const item of items.rows) {
    if (!item.product_id) continue;
    await client.query(
      `UPDATE inventory
       SET quantity_on_hand = GREATEST(0, quantity_on_hand - $1),
           quantity_reserved = GREATEST(0, quantity_reserved - $1)
       WHERE product_id = $2`,
      [item.quantity, item.product_id]
    );
    await client.query(
      `INSERT INTO stock_movements
         (product_id, movement_type, quantity, reference_type, reference_id, notes, created_at)
       VALUES ($1, 'online_sale', $2, 'online_order', $3, $4, NOW())`,
      [item.product_id, -item.quantity, orderId, `Online order ${orderId}`]
    );
  }
}

// ---------------------------------------------------------------------------
// GET /api/admin/online-orders/stats
// ---------------------------------------------------------------------------
const getOrderStats = async (req, res) => {
  try {
    const statsRes = await query(
      `SELECT
         COUNT(*) FILTER (WHERE TRUE) as total,
         COUNT(*) FILTER (WHERE status = 'PENDING') as pending,
         COUNT(*) FILTER (WHERE payment_status = 'AWAITING_CONFIRMATION') as awaiting_confirmation,
         COUNT(*) FILTER (WHERE status = 'CONFIRMED') as confirmed,
         COUNT(*) FILTER (WHERE status = 'PROCESSING') as processing,
         COUNT(*) FILTER (WHERE status = 'SHIPPED') as shipped,
         COUNT(*) FILTER (WHERE status = 'DELIVERED') as delivered,
         COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled,
         COALESCE(SUM(total) FILTER (WHERE status NOT IN ('CANCELLED')), 0) as total_revenue,
         COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE) as today_orders,
         COALESCE(SUM(total) FILTER (WHERE created_at::date = CURRENT_DATE AND status != 'CANCELLED'), 0) as today_revenue
       FROM online_orders`
    );

    const s = statsRes.rows[0];
    res.json({
      total: parseInt(s.total),
      pending: parseInt(s.pending),
      awaitingConfirmation: parseInt(s.awaiting_confirmation),
      confirmed: parseInt(s.confirmed),
      processing: parseInt(s.processing),
      shipped: parseInt(s.shipped),
      delivered: parseInt(s.delivered),
      cancelled: parseInt(s.cancelled),
      totalRevenue: parseFloat(s.total_revenue),
      todayOrders: parseInt(s.today_orders),
      todayRevenue: parseFloat(s.today_revenue),
    });
  } catch (err) {
    console.error('[onlineOrderController.getOrderStats]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------------------------------------------------------------------------
// GET /api/admin/online-orders
// Filters: status, payment_status, date_from, date_to, search, page, limit
// ---------------------------------------------------------------------------
const getAllOrders = async (req, res) => {
  try {
    const {
      status,
      payment_status,
      date_from,
      date_to,
      search,
      page = 1,
      limit = 20,
    } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    const conditions = [];

    if (status && status !== 'all') {
      params.push(status.toUpperCase());
      conditions.push(`o.status = $${params.length}`);
    }
    if (payment_status && payment_status !== 'all') {
      params.push(payment_status.toUpperCase());
      conditions.push(`o.payment_status = $${params.length}`);
    }
    if (date_from) {
      params.push(date_from);
      conditions.push(`o.created_at::date >= $${params.length}::date`);
    }
    if (date_to) {
      params.push(date_to);
      conditions.push(`o.created_at::date <= $${params.length}::date`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(
        `(o.order_number ILIKE $${params.length}
          OR o.customer_name ILIKE $${params.length}
          OR o.customer_email ILIKE $${params.length}
          OR o.customer_phone ILIKE $${params.length})`
      );
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(
      `SELECT COUNT(*) FROM online_orders o ${where}`,
      params
    );
    const totalCount = parseInt(countRes.rows[0].count);

    params.push(parseInt(limit), offset);
    const result = await query(
      `SELECT
         o.id, o.order_number, o.status, o.payment_status, o.payment_method,
         o.customer_id, o.customer_name, o.customer_email, o.customer_phone,
         o.subtotal, o.discount_amount, o.tax_amount, o.shipping_amount, o.total,
         o.currency, o.coupon_code, o.proof_of_payment,
         o.created_at, o.updated_at, o.confirmed_at, o.shipped_at, o.delivered_at,
         o.tracking_number, o.shipping_carrier,
         bc.id as bank_channel_id, bc.channel_name, bc.bank_name, bc.account_name, bc.account_number,
         (SELECT COUNT(*) FROM online_order_items oi WHERE oi.order_id = o.id) as item_count,
         (SELECT json_agg(json_build_object('name', oi2.product_name, 'image', oi2.product_image, 'quantity', oi2.quantity))
          FROM online_order_items oi2 WHERE oi2.order_id = o.id LIMIT 3) as preview_items
       FROM online_orders o
       LEFT JOIN bank_channels bc ON bc.id = o.bank_channel_id
       ${where}
       ORDER BY o.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      orders: result.rows.map((row) => ({
        ...row,
        bankChannel: row.channel_name
          ? {
              id: row.bank_channel_id,
              channelName: row.channel_name,
              bankName: row.bank_name,
              accountName: row.account_name,
              accountNumber: row.account_number,
            }
          : null,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('[onlineOrderController.getAllOrders]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------------------------------------------------------------------------
// GET /api/admin/online-orders/:id
// ---------------------------------------------------------------------------
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT o.*,
              bc.id as bc_id, bc.channel_name, bc.bank_name,
              bc.account_name, bc.account_number, bc.channel_type
       FROM online_orders o
       LEFT JOIN bank_channels bc ON bc.id = o.bank_channel_id
       WHERE o.id = $1`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Order not found' });

    const order = result.rows[0];
    const itemsRes = await query(
      `SELECT * FROM online_order_items WHERE order_id = $1 ORDER BY id`,
      [id]
    );

    res.json({
      ...order,
      bankChannel: order.channel_name
        ? {
            id: order.bc_id,
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
    console.error('[onlineOrderController.getOrderById]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------------------------------------------------------------------------
// PUT /api/admin/online-orders/:id/status   { status, note }
// ---------------------------------------------------------------------------
const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

const updateOrderStatus = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    if (!status || !VALID_STATUSES.includes(status.toUpperCase())) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }
    const newStatus = status.toUpperCase();

    const orderRes = await client.query(`SELECT * FROM online_orders WHERE id = $1`, [id]);
    if (orderRes.rows.length === 0) return res.status(404).json({ message: 'Order not found' });
    const order = orderRes.rows[0];

    // Block processing if payment is awaiting confirmation (only allow PENDING or CANCELLED)
    if (
      order.payment_status === 'AWAITING_CONFIRMATION' &&
      !['PENDING', 'CANCELLED'].includes(newStatus)
    ) {
      client.release();
      return res.status(400).json({
        message: 'Payment must be confirmed before the order can be processed. Please confirm or reject the payment first.',
      });
    }

    const history = Array.isArray(order.status_history) ? order.status_history : [];
    history.push({
      status: newStatus,
      timestamp: new Date().toISOString(),
      note: note || `Status changed to ${newStatus}`,
      changedBy: req.user ? req.user.id : null,
    });

    // Build timestamp updates
    const timestampUpdates = [];
    const params = [newStatus, JSON.stringify(history)];

    if (newStatus === 'CONFIRMED' && !order.confirmed_at) {
      timestampUpdates.push(`confirmed_at = NOW()`);
    }
    if (newStatus === 'SHIPPED' && !order.shipped_at) {
      timestampUpdates.push(`shipped_at = NOW()`);
    }
    if (newStatus === 'DELIVERED' && !order.delivered_at) {
      timestampUpdates.push(`delivered_at = NOW()`);
    }
    if (newStatus === 'CANCELLED' && !order.cancelled_at) {
      timestampUpdates.push(`cancelled_at = NOW()`);
      if (note) {
        params.push(note);
        timestampUpdates.push(`cancellation_reason = $${params.length}`);
      }
    }

    params.push(id);
    const extraSets = timestampUpdates.length > 0 ? `, ${timestampUpdates.join(', ')}` : '';

    await client.query('BEGIN');

    await client.query(
      `UPDATE online_orders
       SET status = $1, status_history = $2::jsonb${extraSets}, updated_at = NOW()
       WHERE id = $${params.length}`,
      params
    );

    // When moving to CONFIRMED for a manual/bank_transfer order with PAID payment, deduct inventory
    if (
      newStatus === 'CONFIRMED' &&
      (order.payment_method === 'bank_transfer' || order.payment_method === 'manual') &&
      order.payment_status === 'PAID'
    ) {
      await deductInventory(client, id);
    }

    // Restore reservations if cancelled
    if (newStatus === 'CANCELLED') {
      await client.query(
        `UPDATE inventory i
         SET quantity_reserved = GREATEST(0, quantity_reserved - oi.quantity)
         FROM online_order_items oi
         WHERE oi.order_id = $1 AND i.product_id = oi.product_id`,
        [id]
      );
    }

    await client.query('COMMIT');

    const updatedRes = await query(`SELECT * FROM online_orders WHERE id = $1`, [id]);
    res.json(updatedRes.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[onlineOrderController.updateOrderStatus]', err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};

// ---------------------------------------------------------------------------
// PUT /api/admin/online-orders/:id/tracking  { trackingNumber, shippingCarrier, estimatedDelivery }
// ---------------------------------------------------------------------------
const updateTracking = async (req, res) => {
  try {
    const { id } = req.params;
    const trackingNumber = req.body.trackingNumber || req.body.tracking_number;
    const shippingCarrier = req.body.shippingCarrier || req.body.carrier;
    const estimatedDelivery = req.body.estimatedDelivery || req.body.estimated_delivery;

    if (!trackingNumber && !shippingCarrier && !estimatedDelivery) {
      return res.status(400).json({ message: 'At least one tracking field is required' });
    }

    const updates = [];
    const params = [];

    if (trackingNumber !== undefined) {
      params.push(trackingNumber);
      updates.push(`tracking_number = $${params.length}`);
    }
    if (shippingCarrier !== undefined) {
      params.push(shippingCarrier);
      updates.push(`shipping_carrier = $${params.length}`);
    }
    if (estimatedDelivery !== undefined) {
      params.push(estimatedDelivery);
      updates.push(`estimated_delivery = $${params.length}`);
    }

    params.push(id);
    const result = await query(
      `UPDATE online_orders SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${params.length} RETURNING *`,
      params
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Order not found' });

    res.json(result.rows[0]);
  } catch (err) {
    console.error('[onlineOrderController.updateTracking]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------------------------------------------------------------------------
// PUT /api/admin/online-orders/:id/notes  { adminNotes }
// ---------------------------------------------------------------------------
const updateAdminNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    if (adminNotes === undefined) {
      return res.status(400).json({ message: 'adminNotes is required' });
    }

    const result = await query(
      `UPDATE online_orders SET admin_notes = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [adminNotes, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Order not found' });

    res.json(result.rows[0]);
  } catch (err) {
    console.error('[onlineOrderController.updateAdminNotes]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------------------------------------------------------------------------
// PUT /api/admin/online-orders/:id/confirm-payment
// Sets payment_status = 'PAID', moves order to CONFIRMED, deducts inventory
// ---------------------------------------------------------------------------
const confirmPayment = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const adminId = req.user ? req.user.id : null;

    const orderRes = await client.query(`SELECT * FROM online_orders WHERE id = $1`, [id]);
    if (orderRes.rows.length === 0) return res.status(404).json({ message: 'Order not found' });
    const order = orderRes.rows[0];

    if (order.payment_status === 'PAID') {
      return res.status(400).json({ message: 'Payment has already been confirmed' });
    }

    const history = Array.isArray(order.status_history) ? order.status_history : [];
    history.push({
      status: 'CONFIRMED',
      timestamp: new Date().toISOString(),
      note: 'Payment confirmed by admin',
      changedBy: adminId,
    });

    await client.query('BEGIN');

    await client.query(
      `UPDATE online_orders
       SET payment_status = 'PAID',
           payment_confirmed_by = $1,
           payment_confirmed_at = NOW(),
           status = 'CONFIRMED',
           confirmed_at = NOW(),
           status_history = $2::jsonb,
           updated_at = NOW()
       WHERE id = $3`,
      [adminId, JSON.stringify(history), id]
    );

    // Deduct inventory now that payment is confirmed
    await deductInventory(client, id);

    await client.query('COMMIT');

    // Send order receipt to customer (async — don't block response)
    const updatedRes = await query(`SELECT * FROM online_orders WHERE id = $1`, [id]);
    const updatedOrder = updatedRes.rows[0];
    const itemsRes = await query(`SELECT * FROM online_order_items WHERE order_id = $1`, [id]);
    sendOrderReceipt(updatedOrder, itemsRes.rows).catch(err =>
      console.error('[confirmPayment] receipt send error:', err)
    );

    res.json({ ...updatedOrder, message: 'Payment confirmed and inventory updated' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[onlineOrderController.confirmPayment]', err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};

// ---------------------------------------------------------------------------
// PUT /api/admin/online-orders/:id/reject-payment  { reason }
// ---------------------------------------------------------------------------
const rejectPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const orderRes = await query(`SELECT * FROM online_orders WHERE id = $1`, [id]);
    if (orderRes.rows.length === 0) return res.status(404).json({ message: 'Order not found' });
    const order = orderRes.rows[0];

    if (order.payment_status === 'PAID') {
      return res.status(400).json({ message: 'Cannot reject a payment that is already confirmed' });
    }

    const history = Array.isArray(order.status_history) ? order.status_history : [];
    history.push({
      status: order.status,
      timestamp: new Date().toISOString(),
      note: `Payment rejected: ${reason}`,
      changedBy: req.user ? req.user.id : null,
    });

    const result = await query(
      `UPDATE online_orders
       SET payment_status = 'FAILED',
           payment_rejection_reason = $1,
           status_history = $2::jsonb,
           updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [reason, JSON.stringify(history), id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('[onlineOrderController.rejectPayment]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updateTracking,
  updateAdminNotes,
  confirmPayment,
  rejectPayment,
  getOrderStats,
};
