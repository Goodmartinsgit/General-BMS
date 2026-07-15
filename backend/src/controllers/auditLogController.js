const { pool } = require('../config/db');

const getAuditLogs = async (req, res) => {
    try {
        const { limit = 50, start_date, end_date, search, type } = req.query;

        let queryText = `
            SELECT al.id, al.user_id, al.action, al.resource_type, al.resource_id, 
                   al.details, al.ip_address, al.user_agent, al.created_at,
                   u.full_name as user_name, u.email as user_email
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
        `;

        const queryParams = [];
        const whereClauses = [];

        if (start_date) {
            queryParams.push(start_date);
            whereClauses.push(`al.created_at >= $${queryParams.length}`);
        }

        if (end_date) {
            queryParams.push(`${end_date} 23:59:59.999`);
            whereClauses.push(`al.created_at <= $${queryParams.length}`);
        }

        if (type) {
            queryParams.push(type.toLowerCase());
            whereClauses.push(`LOWER(al.resource_type) = $${queryParams.length}`);
        }

        if (search && search.trim() !== '') {
            queryParams.push(`%${search.trim().toLowerCase()}%`);
            const pIdx = queryParams.length;
            whereClauses.push(`(
                LOWER(al.action) LIKE $${pIdx} OR 
                LOWER(al.resource_type) LIKE $${pIdx} OR 
                LOWER(u.full_name) LIKE $${pIdx} OR 
                LOWER(u.email) LIKE $${pIdx} OR
                LOWER(COALESCE(al.details->>'message', '')) LIKE $${pIdx}
            )`);
        }

        if (whereClauses.length > 0) {
            queryText += ' WHERE ' + whereClauses.join(' AND ');
        }

        queryText += ' ORDER BY al.created_at DESC';

        if (limit) {
            queryParams.push(parseInt(limit, 10));
            queryText += ` LIMIT $${queryParams.length}`;
        }

        const result = await pool.query(queryText, queryParams);
        
        // Map fields to match frontend's expected keys
        const activities = result.rows.map(row => {
            const description = row.details?.message || `${row.action.toUpperCase()} ${row.resource_type.toUpperCase()}`;
            return {
                id: row.id,
                type: row.resource_type,
                action: row.action,
                description: description,
                user: row.user_name || 'System',
                user_email: row.user_email,
                timestamp: row.created_at,
                amount: row.details?.amount || null,
                details: row.details
            };
        });

        res.json(activities);
    } catch (err) {
        console.error('Error fetching audit logs:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getAuditLogs };
