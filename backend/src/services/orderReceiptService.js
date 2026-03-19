'use strict';

const { query } = require('../config/db');
const { sendText } = require('./whatsappService');

// ---------------------------------------------------------------------------
// Format order receipt text (used for both WhatsApp and email fallback)
// ---------------------------------------------------------------------------
function formatReceiptText(order, items) {
  const lines = [
    `*Order Receipt*`,
    `Order: #${order.order_number}`,
    `Date: ${new Date(order.created_at).toLocaleDateString('en-NG', { dateStyle: 'long' })}`,
    ``,
    `*Items:*`,
  ];

  for (const item of items) {
    const unitPrice = parseFloat(item.unit_price || 0);
    const qty = parseInt(item.quantity || 1);
    lines.push(`  ${item.product_name} x${qty} — ₦${(unitPrice * qty).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`);
  }

  lines.push(``);
  lines.push(`Subtotal: ₦${parseFloat(order.subtotal || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`);

  if (parseFloat(order.shipping_amount || 0) > 0) {
    lines.push(`Shipping: ₦${parseFloat(order.shipping_amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`);
  }
  if (parseFloat(order.tax_amount || 0) > 0) {
    lines.push(`Tax: ₦${parseFloat(order.tax_amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`);
  }
  if (parseFloat(order.discount_amount || 0) > 0) {
    lines.push(`Discount: -₦${parseFloat(order.discount_amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`);
  }

  lines.push(`*Total: ₦${parseFloat(order.total || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}*`);
  lines.push(``);
  lines.push(`Payment: ${(order.payment_method || '').replace('_', ' ')}`);
  lines.push(`Status: ${order.payment_status}`);

  if (order.tracking_number) {
    lines.push(``);
    lines.push(`Tracking: ${order.tracking_number}`);
  }

  lines.push(``);
  lines.push(`Thank you for your order!`);

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Get store config for communication channel
// ---------------------------------------------------------------------------
async function getStoreConfig() {
  const res = await query(`SELECT * FROM store_config ORDER BY id LIMIT 1`);
  return res.rows[0] || null;
}

// ---------------------------------------------------------------------------
// Send order receipt via configured channel (email or WhatsApp)
// ---------------------------------------------------------------------------
async function sendOrderReceipt(order, items) {
  try {
    const storeConfig = await getStoreConfig();
    if (!storeConfig) {
      console.warn('[orderReceiptService] No store config found');
      return { sent: false, channel: 'none' };
    }

    const channel = storeConfig.customer_channel || 'email';
    const receiptText = formatReceiptText(order, items);

    if (channel === 'whatsapp') {
      const phone = order.customer_phone;
      if (!phone) {
        console.warn('[orderReceiptService] No customer phone for WhatsApp receipt');
        return { sent: false, channel: 'whatsapp', reason: 'no_phone' };
      }

      if (!storeConfig.whatsapp_phone_number_id || !storeConfig.whatsapp_access_token) {
        console.warn('[orderReceiptService] WhatsApp Cloud API not configured');
        return { sent: false, channel: 'whatsapp', reason: 'not_configured' };
      }

      const result = await sendText(storeConfig, phone, receiptText);
      console.log(`[orderReceiptService] WhatsApp receipt sent for order ${order.order_number}:`, result ? 'success' : 'failed');
      return { sent: !!result, channel: 'whatsapp' };
    } else {
      // Email channel — log for now (email service integration is future work)
      console.log(`[orderReceiptService] Email receipt for order ${order.order_number} to ${order.customer_email}`);
      console.log(`[EMAIL] Receipt:\n${receiptText}`);
      return { sent: true, channel: 'email' };
    }
  } catch (err) {
    console.error('[orderReceiptService] Error sending receipt:', err);
    return { sent: false, channel: 'unknown', error: err.message };
  }
}

module.exports = {
  sendOrderReceipt,
  formatReceiptText,
  getStoreConfig,
};
