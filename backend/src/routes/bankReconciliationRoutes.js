const express = require('express');
const router = express.Router();
const { getReconciliations, getReconciliationById, createReconciliation, updateReconciliation, completeReconciliation } = require('../controllers/bankReconciliationController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

router.use(authenticateToken);

router.get('/', authorize('view_accounting'), getReconciliations);
router.get('/:id', authorize('view_accounting'), getReconciliationById);
router.post('/', authorize('manage_accounting'), createReconciliation);
router.put('/:id', authorize('manage_accounting'), updateReconciliation);
router.post('/:id/complete', authorize('manage_accounting'), completeReconciliation);

module.exports = router;
