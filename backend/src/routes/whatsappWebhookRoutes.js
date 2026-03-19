'use strict';

const express = require('express');
const router = express.Router();
const { verifyWebhook, handleWebhook } = require('../controllers/whatsappWebhookController');

// These endpoints are public — Meta calls them directly
router.get('/', verifyWebhook);
router.post('/', handleWebhook);

module.exports = router;
