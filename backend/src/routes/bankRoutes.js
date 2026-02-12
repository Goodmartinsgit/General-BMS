const express = require('express');
const router = express.Router();
const bankController = require('../controllers/bankController');
const authenticateToken = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/channels', bankController.getBankChannels);
router.post('/channels', bankController.createBankChannel);
router.put('/channels/:id', bankController.updateBankChannel);
router.get('/channels/:id/history', bankController.getChannelHistory);
router.get('/summary', bankController.getCashFlowSummary);

module.exports = router;
