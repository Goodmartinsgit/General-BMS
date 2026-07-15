const express = require('express');
const router = express.Router();
const { login, refresh, logout, requestPasswordReset, verifyResetToken, resetPassword, changePassword, updateProfile } = require('../controllers/authController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');

router.post('/login', authLimiter, login);
router.post('/refresh', refresh);
router.post('/logout', authenticateToken, logout);

// Password reset (unauthenticated)
router.post('/forgot-password', passwordResetLimiter, requestPasswordReset);
router.post('/verify-reset-token', verifyResetToken);
router.post('/reset-password', resetPassword);

// Self-service account updates (authenticated)
router.post('/change-password', authenticateToken, authorize('change_password'), changePassword);
router.patch('/profile', authenticateToken, updateProfile);

module.exports = router;
