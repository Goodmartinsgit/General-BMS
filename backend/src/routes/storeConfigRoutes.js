const express = require('express');
const router = express.Router();
const { getConfigBySlug, getConfigByDomain, getDefaultConfig } = require('../controllers/storeConfigController');

// Public storefront endpoints
router.get('/config/domain/:domain', getConfigByDomain);
router.get('/config/default', getDefaultConfig);
router.get('/config/:slug', getConfigBySlug);

module.exports = router;
