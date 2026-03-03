const express = require('express');
const router = express.Router();
const bankController = require('../controllers/bankController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

router.use(authenticateToken);

router.get('/channels', authorize('view_banks'), bankController.getBankChannels);
router.post('/channels', authorize('manage_banks'), bankController.createBankChannel);
router.put('/channels/:id', authorize('manage_banks'), bankController.updateBankChannel);
router.get('/channels/:id/history', authorize('view_banks'), bankController.getChannelHistory);
router.get('/summary', authorize('view_banks'), bankController.getCashFlowSummary);

module.exports = router;
