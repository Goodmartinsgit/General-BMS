const { pool } = require('../config/db');

const authorize = (requiredPermissions) => {
    return async (req, res, next) => {
        try {
            // 1. Get user role from DB (as JWT might be stale)
            const userRes = await pool.query(
                `SELECT r.permissions 
                 FROM users u 
                 JOIN roles r ON u.role_id = r.id 
                 WHERE u.id = $1`,
                [req.user.id]
            );

            if (userRes.rows.length === 0) {
                return res.status(403).json({ message: 'Access denied: User role not found' });
            }

            const userPermissions = userRes.rows[0].permissions || {};

            // 2. Check if user has ALL required permissions
            // Note: requiredPermissions could be a string or an array of strings
            const permissionsToCheck = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
            
            const hasPermission = permissionsToCheck.every(p => userPermissions[p] === true || userPermissions['admin'] === true);

            if (!hasPermission) {
                return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
            }

            next();
        } catch (err) {
            console.error('Authorization error:', err);
            res.status(500).json({ message: 'Authorization server error' });
        }
    };
};

module.exports = authorize;
