const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditLogController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

router.get('/', authenticateToken, authorize('view_audit_logs'), getAuditLogs);

module.exports = router;
