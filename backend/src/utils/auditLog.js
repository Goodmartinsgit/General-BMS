const { query } = require('../config/db');
const logger = require('../config/logger');

async function logAudit(req, action, resourceType, resourceId, details = {}) {
    try {
        await query(
            `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                req.user?.id || null,
                action,
                resourceType,
                resourceId,
                JSON.stringify(details),
                req.ip,
                req.get('user-agent')
            ]
        );
    } catch (err) {
        logger.error('Audit log write failed', { error: err.message, action, resourceType, resourceId });
    }
}

module.exports = logAudit;
