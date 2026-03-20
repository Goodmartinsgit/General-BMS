'use strict';

const express = require('express');
const router = express.Router({ mergeParams: true });
const ctrl = require('../controllers/storeCustomerController');
const changeReqCtrl = require('../controllers/changeRequestController');
const { storeAuth, optionalStoreAuth } = require('../middleware/storeAuthMiddleware');
const sessionMiddleware = require('../middleware/sessionMiddleware');

// Auth (public)
router.post('/register', sessionMiddleware, ctrl.register);
router.post('/login', sessionMiddleware, ctrl.login);
router.post('/logout', ctrl.logout);
router.post('/forgot-password', ctrl.forgotPassword);
router.post('/reset-password', ctrl.resetPassword);
router.post('/verify-email', ctrl.verifyEmail);
router.post('/verify-otp', ctrl.verifyOtp);
router.post('/resend-otp', ctrl.resendOtp);
router.post('/resend-verification', storeAuth, ctrl.resendVerification);

// Profile (authenticated)
router.get('/profile', storeAuth, ctrl.getProfile);
router.patch('/profile', storeAuth, ctrl.updateProfile);
router.patch('/change-password', storeAuth, ctrl.changePassword);
router.patch('/change-email', storeAuth, ctrl.changeEmail);
router.delete('/account', storeAuth, ctrl.deleteAccount);

// Change requests (authenticated)
router.post('/change-request', storeAuth, changeReqCtrl.submitChangeRequest);
router.get('/change-requests', storeAuth, changeReqCtrl.getMyChangeRequests);

// Addresses (authenticated)
router.get('/addresses', storeAuth, ctrl.getAddresses);
router.post('/addresses', storeAuth, ctrl.addAddress);
router.patch('/addresses/:addressId', storeAuth, ctrl.updateAddress);
router.delete('/addresses/:addressId', storeAuth, ctrl.deleteAddress);
router.patch('/addresses/:addressId/default', storeAuth, ctrl.setDefaultAddress);

module.exports = router;
