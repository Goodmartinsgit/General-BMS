'use strict';

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { query, pool } = require('../config/db');

// ---------------------------------------------------------------------------
// POST /api/store/webhooks/paystack
// Verifies Paystack HMAC-SHA512 signature and processes charge.success events
// ---------------------------------------------------------------------------
router.post('/', async (req, res) => {
  // Verify signature
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (secret) {
    const hash = crypto
      .createHmac('sha512', secret)
      .update(req.body)
      .digest('hex');
    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(401).json({ message: 'Invalid signature' });
    }
  }

  let event;
  try {
    event = JSON.parse(req.body.toString());
  } catch {
    return res.status(400).json({ message: 'Invalid JSON payload' });
  }

  if (event.event === 'charge.success') {
    const reference = event.data && event.data.reference;
    if (!reference) return res.sendStatus(200);

    const client = await pool.connect();
    try {
      const orderRes = await client.query(
        `SELECT * FROM online_orders WHERE payment_reference = $1`,
        [reference]
      );
      if (orderRes.rows.length === 0) return res.sendStatus(200);

      const order = orderRes.rows[0];
      if (order.payment_status === 'PAID') return res.sendStatus(200);

      const history = Array.isArray(order.status_history) ? order.status_history : [];
      history.push({
        status: 'CONFIRMED',
        timestamp: new Date().toISOString(),
        note: 'Payment confirmed via Paystack webhook',
      });

      await client.query('BEGIN');

      await client.query(
        `UPDATE online_orders
         SET payment_status = 'PAID',
             payment_confirmed_at = NOW(),
             paid_at = NOW(),
             status = CASE WHEN status = 'PENDING' THEN 'CONFIRMED' ELSE status END,
             confirmed_at = CASE WHEN status = 'PENDING' THEN NOW() ELSE confirmed_at END,
             status_history = $1::jsonb,
             updated_at = NOW()
         WHERE id = $2`,
        [JSON.stringify(history), order.id]
      );

      // Deduct inventory
      const items = await client.query(
        `SELECT * FROM online_order_items WHERE order_id = $1`,
        [order.id]
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
          [item.product_id, -item.quantity, order.id, `Paystack payment confirmed – order ${order.order_number}`]
        );
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      console.error('[storeWebhook.charge.success]', err);
    } finally {
      client.release();
    }
  }

  res.sendStatus(200);
});

module.exports = router;
