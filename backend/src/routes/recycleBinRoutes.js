const express = require('express');
const router = express.Router();
const {
    getAllDeletedItems,
    getDeletedItemsByEntity,
    restoreItem,
    purgeItem,
    getDeletionAuditTrail,
    getPurgeLogs,
    autoPurge,
    getStatistics
} = require('../controllers/recycleBinController');
const authenticateToken = require('../middleware/authMiddleware');

router.use(authenticateToken);

// ============================================================================
// RECYCLE BIN ROUTES
// ============================================================================

// Get all deleted items with filtering and pagination
router.get('/', getAllDeletedItems);

// Get recycle bin statistics
router.get('/statistics', getStatistics);

// Get deleted items by entity type
router.get('/entity/:entityType', getDeletedItemsByEntity);

// Restore item from recycle bin
router.post('/:id/restore', restoreItem);

// Permanently delete item (purge)
router.delete('/:id/purge', purgeItem);

// ============================================================================
// AUDIT & LOGS ROUTES
// ============================================================================

// Get deletion audit trail
router.get('/audit-trail', getDeletionAuditTrail);

// Get purge logs
router.get('/purge-logs', getPurgeLogs);

// ============================================================================
// AUTO-PURGE ROUTES
// ============================================================================

// Trigger auto-purge of old items
router.post('/auto-purge', autoPurge);

module.exports = router;
