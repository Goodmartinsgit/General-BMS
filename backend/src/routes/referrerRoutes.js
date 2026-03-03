const express = require('express');
const router = express.Router();
const referrerController = require('../controllers/referrerController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

router.get('/', authenticateToken, authorize('view_referrers'), referrerController.getAllReferrers);
router.get('/:id', authenticateToken, authorize('view_referrers'), referrerController.getReferrerById);
router.post('/', authenticateToken, authorize('manage_referrers'), referrerController.createReferrer);
router.put('/:id', authenticateToken, authorize('manage_referrers'), referrerController.updateReferrer);
router.delete('/:id', authenticateToken, authorize('manage_referrers'), referrerController.deleteReferrer);

router.get('/:id/commissions', authenticateToken, authorize('view_referrers'), referrerController.getReferrerCommissions);
router.post('/pay-commission', authenticateToken, authorize('manage_referrers'), referrerController.payCommission);

module.exports = router;
