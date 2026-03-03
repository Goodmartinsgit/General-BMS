'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/storeCartController');
const { optionalStoreAuth } = require('../middleware/storeAuthMiddleware');
const sessionMiddleware = require('../middleware/sessionMiddleware');

const cartMiddleware = [sessionMiddleware, optionalStoreAuth];

router.get('/', cartMiddleware, ctrl.getCart);
router.post('/items', cartMiddleware, ctrl.addItem);
router.put('/items/:itemId', cartMiddleware, ctrl.updateItem);
router.delete('/items/:itemId', cartMiddleware, ctrl.removeItem);
router.delete('/', cartMiddleware, ctrl.clearCart);
router.post('/coupon', cartMiddleware, ctrl.applyCoupon);
router.delete('/coupon', cartMiddleware, ctrl.removeCoupon);

module.exports = router;
