'use strict';

const axios = require('axios');

const CLOUD_API_BASE = 'https://graph.facebook.com/v21.0';

// ---------------------------------------------------------------------------
// WhatsApp Cloud API (official Meta API)
// ---------------------------------------------------------------------------

/**
 * Send a text message via WhatsApp Cloud API
 */
async function sendCloudTextMessage(phoneNumberId, accessToken, recipientPhone, text) {
  const url = `${CLOUD_API_BASE}/${phoneNumberId}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    to: normalizePhone(recipientPhone),
    type: 'text',
    text: { body: text },
  };

  const res = await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  return res.data;
}

/**
 * Send a template message via WhatsApp Cloud API
 * Used for OTP / auth codes, order confirmations, etc.
 */
async function sendCloudTemplateMessage(phoneNumberId, accessToken, recipientPhone, templateName, languageCode, components) {
  const url = `${CLOUD_API_BASE}/${phoneNumberId}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    to: normalizePhone(recipientPhone),
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode || 'en' },
      components: components || [],
    },
  };

  const res = await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  return res.data;
}

/**
 * Send a document (e.g. PDF receipt) via WhatsApp Cloud API
 */
async function sendCloudDocument(phoneNumberId, accessToken, recipientPhone, documentUrl, caption, filename) {
  const url = `${CLOUD_API_BASE}/${phoneNumberId}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    to: normalizePhone(recipientPhone),
    type: 'document',
    document: {
      link: documentUrl,
      caption: caption || '',
      filename: filename || 'receipt.pdf',
    },
  };

  const res = await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  return res.data;
}

// ---------------------------------------------------------------------------
// Unified send function — reads config from store_config row
// ---------------------------------------------------------------------------

/**
 * Send a WhatsApp message using store's Cloud API credentials.
 * @param {object} storeConfig - row from store_config with whatsapp_* columns
 * @param {string} recipientPhone - customer phone number
 * @param {string} message - text message body
 * @returns {object|null} API response or null on failure
 */
async function sendWhatsAppMessage(storeConfigOrPhone, messageOrText) {
  // Support legacy signature: sendWhatsAppMessage(phone, message)
  if (typeof storeConfigOrPhone === 'string') {
    return sendWhatsAppMessageLegacy(storeConfigOrPhone, messageOrText);
  }

  const config = storeConfigOrPhone;
  const message = messageOrText;

  if (!config.whatsapp_phone_number_id || !config.whatsapp_access_token) {
    console.warn('[WhatsApp] Cloud API not configured for this store');
    return null;
  }

  try {
    return await sendCloudTextMessage(
      config.whatsapp_phone_number_id,
      config.whatsapp_access_token,
      config.recipientPhone,
      message
    );
  } catch (error) {
    console.error('[WhatsApp Cloud API] Error:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Send text via store's WhatsApp Cloud API config
 */
async function sendText(storeConfig, recipientPhone, message) {
  if (!storeConfig.whatsapp_phone_number_id || !storeConfig.whatsapp_access_token) {
    console.warn('[WhatsApp] Cloud API not configured for this store');
    return null;
  }

  try {
    return await sendCloudTextMessage(
      storeConfig.whatsapp_phone_number_id,
      storeConfig.whatsapp_access_token,
      recipientPhone,
      message
    );
  } catch (error) {
    console.error('[WhatsApp Cloud API] sendText error:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Send document via store's WhatsApp Cloud API config
 */
async function sendDocument(storeConfig, recipientPhone, documentUrl, caption, filename) {
  if (!storeConfig.whatsapp_phone_number_id || !storeConfig.whatsapp_access_token) {
    console.warn('[WhatsApp] Cloud API not configured for this store');
    return null;
  }

  try {
    return await sendCloudDocument(
      storeConfig.whatsapp_phone_number_id,
      storeConfig.whatsapp_access_token,
      recipientPhone,
      documentUrl,
      caption,
      filename
    );
  } catch (error) {
    console.error('[WhatsApp Cloud API] sendDocument error:', error.response?.data || error.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Legacy Green API support (backward compat)
// ---------------------------------------------------------------------------
async function sendWhatsAppMessageLegacy(phone, message) {
  const instanceId = process.env.GREEN_API_INSTANCE_ID;
  const apiToken = process.env.GREEN_API_TOKEN;

  if (!instanceId || !apiToken) {
    console.warn('WhatsApp integration not configured (Missing Green API credentials)');
    return null;
  }

  try {
    const url = `https://api.green-api.com/waInstance${instanceId}/sendMessage/${apiToken}`;
    const payload = { chatId: `${phone}@c.us`, message };
    const response = await axios.post(url, payload);
    return response.data;
  } catch (error) {
    console.error('WhatsApp Error:', error.response?.data || error.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Normalize phone to international format without + prefix.
 * Accepts: 08012345678, +2348012345678, 2348012345678
 * Returns: 2348012345678 (for Cloud API, no @c.us needed)
 */
function normalizePhone(phone) {
  if (!phone) return '';
  let cleaned = phone.replace(/[\s\-()]/g, '');
  // Remove leading +
  if (cleaned.startsWith('+')) cleaned = cleaned.slice(1);
  // Convert Nigerian local format to international
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = '234' + cleaned.slice(1);
  }
  return cleaned;
}

module.exports = {
  sendText,
  sendDocument,
  sendCloudTextMessage,
  sendCloudTemplateMessage,
  sendCloudDocument,
  sendWhatsAppMessage,
  normalizePhone,
};
