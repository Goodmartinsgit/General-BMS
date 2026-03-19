const { pool } = require('../config/db');

// Helper to record cash flow inside a transaction
const recordCashFlow = async (client, { channel_id, type, amount, source, reference_id, reference_number, description, performed_by }) => {
    // 1. Update channel balance
    const updateResult = await client.query(
        `UPDATE bank_channels 
         SET current_balance = current_balance + $1, updated_at = NOW() 
         WHERE id = $2 
         RETURNING current_balance`,
        [type === 'inflow' ? amount : -amount, channel_id]
    );

    if (updateResult.rows.length === 0) {
        throw new Error('Bank channel not found');
    }

    const balance_after = updateResult.rows[0].current_balance;

    // 2. Record Cash Flow entry
    await client.query(
        `INSERT INTO cash_flow (
            channel_id, type, amount, source, reference_id, 
            reference_number, description, balance_after, performed_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [channel_id, type, amount, source, reference_id, reference_number, description, balance_after, performed_by]
    );
};

const getBankChannels = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM bank_channels ORDER BY channel_name ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const createBankChannel = async (req, res) => {
    try {
        const { channel_name, bank_name, account_number, account_name, initial_balance, channel_type, usage_scope } = req.body;
        const result = await pool.query(
            `INSERT INTO bank_channels (channel_name, bank_name, account_number, account_name, initial_balance, current_balance, channel_type, usage_scope)
             VALUES ($1, $2, $3, $4, $5, $5, $6, $7) RETURNING *`,
            [channel_name, bank_name, account_number, account_name, initial_balance || 0, channel_type || 'bank', usage_scope || 'both']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateBankChannel = async (req, res) => {
    try {
        const { id } = req.params;
        const { channel_name, bank_name, account_number, account_name, is_active, channel_type, usage_scope } = req.body;
        const result = await pool.query(
            `UPDATE bank_channels
             SET channel_name = $1, bank_name = $2, account_number = $3, account_name = $4, is_active = $5,
                 channel_type = $6, usage_scope = $7, updated_at = NOW()
             WHERE id = $8 RETURNING *`,
            [channel_name, bank_name, account_number, account_name, is_active, channel_type || 'bank', usage_scope || 'both', id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getChannelHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate, endDate, limit = 50 } = req.query;
        let q = `SELECT cf.*, u.full_name as performer 
                 FROM cash_flow cf 
                 LEFT JOIN users u ON cf.performed_by = u.id 
                 WHERE cf.channel_id = $1`;
        const params = [id];

        if (startDate) {
            params.push(startDate);
            q += ` AND cf.created_at >= $${params.length}`;
        }
        if (endDate) {
            params.push(endDate);
            q += ` AND cf.created_at <= $${params.length}`;
        }

        q += ` ORDER BY cf.created_at DESC LIMIT $${params.length + 1}`;
        params.push(limit);

        const result = await pool.query(q, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getCashFlowSummary = async (req, res) => {
    try {
        const { branchId, startDate, endDate } = req.query;
        // Basic summary of inflows and outflows
        const result = await pool.query(`
            SELECT
                SUM(CASE WHEN type = 'inflow' THEN amount ELSE 0 END) as total_inflow,
                SUM(CASE WHEN type = 'outflow' THEN amount ELSE 0 END) as total_outflow,
                COUNT(*) as total_transactions
            FROM cash_flow
            WHERE created_at >= COALESCE($1, NOW() - INTERVAL '30 days')
              AND created_at <= COALESCE($2, NOW())
        `, [startDate || null, endDate || null]);
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    recordCashFlow,
    getBankChannels,
    createBankChannel,
    updateBankChannel,
    getChannelHistory,
    getCashFlowSummary
};
