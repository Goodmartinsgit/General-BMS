const express = require('express');
const router = express.Router();
const referrerController = require('../controllers/referrerController');
const authenticateToken = require('../middleware/authMiddleware');

router.get('/', authenticateToken, referrerController.getAllReferrers);
router.get('/:id', authenticateToken, referrerController.getReferrerById);
router.post('/', authenticateToken, referrerController.createReferrer);
router.put('/:id', authenticateToken, referrerController.updateReferrer);
router.delete('/:id', authenticateToken, referrerController.deleteReferrer);

router.get('/:id/commissions', authenticateToken, referrerController.getReferrerCommissions);
router.post('/pay-commission', authenticateToken, referrerController.payCommission);

module.exports = router;
