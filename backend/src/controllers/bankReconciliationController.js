const { pool } = require('../config/db');

const getReconciliations = async (req, res) => {
    try {
        const { status, account_id, branch_id } = req.query;
        let q = `SELECT br.*, ga.name as account_name, ga.code as account_code,
                 u.full_name as reconciled_by_name
                 FROM bank_reconciliations br
                 LEFT JOIN gl_accounts ga ON br.account_id = ga.id
                 LEFT JOIN users u ON br.reconciled_by = u.id WHERE 1=1`;
        const params = [];
        let idx = 1;

        if (status) { params.push(status); q += ` AND br.status = $${idx++}`; }
        if (account_id) { params.push(account_id); q += ` AND br.account_id = $${idx++}`; }
        if (branch_id) { params.push(branch_id); q += ` AND br.branch_id = $${idx++}`; }

        q += ` ORDER BY br.statement_date DESC`;
        const result = await pool.query(q, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching reconciliations:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getReconciliationById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT br.*, ga.name as account_name, ga.code as account_code,
             u.full_name as reconciled_by_name
             FROM bank_reconciliations br
             LEFT JOIN gl_accounts ga ON br.account_id = ga.id
             LEFT JOIN users u ON br.reconciled_by = u.id
             WHERE br.id = $1`, [id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Reconciliation not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching reconciliation:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const createReconciliation = async (req, res) => {
    try {
        const { account_id, statement_date, statement_balance, book_balance, notes, branch_id } = req.body;
        const result = await pool.query(
            `INSERT INTO bank_reconciliations (account_id, statement_date, statement_balance, book_balance, notes, branch_id, reconciled_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [account_id, statement_date, statement_balance, book_balance, notes, branch_id, req.user.id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating reconciliation:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateReconciliation = async (req, res) => {
    try {
        const { id } = req.params;
        const { statement_balance, book_balance, adjusted_balance, notes, status } = req.body;

        const existing = await pool.query('SELECT status FROM bank_reconciliations WHERE id = $1', [id]);
        if (existing.rows.length === 0) return res.status(404).json({ message: 'Reconciliation not found' });
        if (existing.rows[0].status === 'completed') return res.status(400).json({ message: 'Cannot edit completed reconciliation' });

        const result = await pool.query(
            `UPDATE bank_reconciliations SET statement_balance = COALESCE($1, statement_balance),
             book_balance = COALESCE($2, book_balance), adjusted_balance = $3,
             notes = COALESCE($4, notes), status = COALESCE($5, status), updated_at = NOW()
             WHERE id = $6 RETURNING *`,
            [statement_balance, book_balance, adjusted_balance, notes, status, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating reconciliation:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const completeReconciliation = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `UPDATE bank_reconciliations SET status = 'completed', completed_at = NOW(), updated_at = NOW()
             WHERE id = $1 AND status != 'completed' RETURNING *`, [id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Reconciliation not found or already completed' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error completing reconciliation:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getReconciliations, getReconciliationById, createReconciliation, updateReconciliation, completeReconciliation };
