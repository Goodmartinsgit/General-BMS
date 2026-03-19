'use strict';

const { query } = require('../config/db');

// ---------------------------------------------------------------------------
// GET /api/webhooks/whatsapp — Meta webhook verification
// ---------------------------------------------------------------------------
const verifyWebhook = async (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode !== 'subscribe' || !token) {
    return res.sendStatus(403);
  }

  // Look up the verify token from store_config
  const configRes = await query(
    `SELECT whatsapp_verify_token FROM store_config ORDER BY id LIMIT 1`
  );
  const expectedToken = configRes.rows[0]?.whatsapp_verify_token;

  if (!expectedToken || token !== expectedToken) {
    console.warn('[WhatsApp Webhook] Verify token mismatch');
    return res.sendStatus(403);
  }

  console.log('[WhatsApp Webhook] Verification successful');
  res.status(200).send(challenge);
};

// ---------------------------------------------------------------------------
// POST /api/webhooks/whatsapp — Incoming messages & status updates
// ---------------------------------------------------------------------------
const handleWebhook = async (req, res) => {
  // Always respond 200 immediately to avoid Meta retries
  res.sendStatus(200);

  try {
    const body = req.body;
    if (!body || body.object !== 'whatsapp_business_account') return;

    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        if (change.field !== 'messages') continue;
        const value = change.value;

        // Handle message status updates (sent, delivered, read, failed)
        const statuses = value.statuses || [];
        for (const status of statuses) {
          console.log(`[WhatsApp Webhook] Message ${status.id} status: ${status.status}`);
          // Future: update message tracking table
        }

        // Handle incoming messages (customer replies)
        const messages = value.messages || [];
        for (const msg of messages) {
          const from = msg.from; // phone number
          const text = msg.text?.body || '';
          console.log(`[WhatsApp Webhook] Incoming message from ${from}: ${text}`);
          // Future: forward to admin notification system
        }
      }
    }
  } catch (err) {
    console.error('[WhatsApp Webhook] Processing error:', err);
  }
};

module.exports = { verifyWebhook, handleWebhook };
