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
const authorize = require('../middleware/permissionMiddleware');

router.use(authenticateToken);

// ============================================================================
// RECYCLE BIN ROUTES
// ============================================================================

// Get all deleted items with filtering and pagination
router.get('/', authorize('view_recycle_bin'), getAllDeletedItems);

// Get recycle bin statistics
router.get('/statistics', authorize('view_recycle_bin'), getStatistics);

// Get deleted items by entity type
router.get('/entity/:entityType', authorize('view_recycle_bin'), getDeletedItemsByEntity);

// Restore item from recycle bin
router.post('/:id/restore', authorize('manage_recycle_bin'), restoreItem);

// Permanently delete item (purge)
router.delete('/:id/purge', authorize('manage_recycle_bin'), purgeItem);

// ============================================================================
// AUDIT & LOGS ROUTES
// ============================================================================

// Get deletion audit trail
router.get('/audit-trail', authorize('view_recycle_bin'), getDeletionAuditTrail);

// Get purge logs
router.get('/purge-logs', authorize('view_recycle_bin'), getPurgeLogs);

// ============================================================================
// AUTO-PURGE ROUTES
// ============================================================================

// Trigger auto-purge of old items
router.post('/auto-purge', authorize('manage_recycle_bin'), autoPurge);

module.exports = router;
