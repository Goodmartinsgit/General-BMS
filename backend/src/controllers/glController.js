const { pool } = require('../config/db');

// ==================== CHART OF ACCOUNTS ====================

const getAccounts = async (req, res) => {
    try {
        const { type, category, search, is_active } = req.query;
        let q = `SELECT a.*, p.name as parent_account_name
                 FROM gl_accounts a
                 LEFT JOIN gl_accounts p ON a.parent_id = p.id
                 WHERE 1=1`;
        const params = [];

        if (type) {
            params.push(type);
            q += ` AND a.type = $${params.length}`;
        }
        if (category) {
            params.push(category);
            q += ` AND a.category = $${params.length}`;
        }
        if (search) {
            params.push(`%${search}%`);
            q += ` AND (a.name ILIKE $${params.length} OR a.code ILIKE $${params.length})`;
        }
        if (is_active !== undefined) {
            params.push(is_active === 'true');
            q += ` AND a.is_active = $${params.length}`;
        }

        q += ` ORDER BY a.code ASC`;

        const result = await pool.query(q, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching GL accounts:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAccountById = async (req, res) => {
    try {
        const { id } = req.params;

        const accountResult = await pool.query(
            `SELECT a.*, p.name as parent_account_name
             FROM gl_accounts a
             LEFT JOIN gl_accounts p ON a.parent_id = p.id
             WHERE a.id = $1`,
            [id]
        );

        if (accountResult.rows.length === 0) {
            return res.status(404).json({ message: 'Account not found' });
        }

        const balanceResult = await pool.query(
            `SELECT
                COALESCE(SUM(jl.debit_amount), 0) as total_debits,
                COALESCE(SUM(jl.credit_amount), 0) as total_credits
             FROM journal_entry_lines jl
             JOIN journal_entries je ON jl.entry_id = je.id
             WHERE jl.account_id = $1 AND je.status = 'posted'`,
            [id]
        );

        const account = accountResult.rows[0];
        const { total_debits, total_credits } = balanceResult.rows[0];

        const debitNormal = ['asset', 'expense'].includes(account.type);
        account.balance = debitNormal
            ? parseFloat(total_debits) - parseFloat(total_credits)
            : parseFloat(total_credits) - parseFloat(total_debits);
        account.total_debits = parseFloat(total_debits);
        account.total_credits = parseFloat(total_credits);

        res.json(account);
    } catch (err) {
        console.error('Error fetching GL account:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const createAccount = async (req, res) => {
    try {
        const {
            account_code, account_name, account_type, category,
            parent_id, description, is_header, normal_balance
        } = req.body;

        const result = await pool.query(
            `INSERT INTO gl_accounts (code, name, type, category, parent_id, description, is_header, normal_balance)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [account_code, account_name, account_type, category, parent_id || null, description, is_header || false, normal_balance || 'debit']
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating GL account:', err);
        if (err.code === '23505') {
            return res.status(400).json({ message: 'Account code already exists' });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

const updateAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            account_code, account_name, account_type, category,
            parent_id, description, is_header, normal_balance
        } = req.body;

        const result = await pool.query(
            `UPDATE gl_accounts
             SET code = COALESCE($1, code),
                 name = COALESCE($2, name),
                 type = COALESCE($3, type),
                 category = COALESCE($4, category),
                 parent_id = $5,
                 description = COALESCE($6, description),
                 is_header = COALESCE($7, is_header),
                 normal_balance = COALESCE($8, normal_balance),
                 updated_at = NOW()
             WHERE id = $9 RETURNING *`,
            [account_code, account_name, account_type, category, parent_id || null, description, is_header, normal_balance, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Account not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating GL account:', err);
        if (err.code === '23505') {
            return res.status(400).json({ message: 'Account code already exists' });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteAccount = async (req, res) => {
    try {
        const { id } = req.params;

        const usageCheck = await pool.query(
            `SELECT COUNT(*) as count FROM journal_entry_lines jl
             JOIN journal_entries je ON jl.entry_id = je.id
             WHERE jl.account_id = $1 AND je.status = 'posted'`,
            [id]
        );

        if (parseInt(usageCheck.rows[0].count) > 0) {
            return res.status(400).json({ message: 'Cannot delete account with posted journal entries. Deactivate it instead.' });
        }

        const result = await pool.query(
            `UPDATE gl_accounts SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Account not found' });
        }

        res.json({ message: 'Account deactivated', account: result.rows[0] });
    } catch (err) {
        console.error('Error deleting GL account:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAccountTree = async (req, res) => {
    try {
        const result = await pool.query(
            `WITH RECURSIVE account_tree AS (
                SELECT id, code, name, type, category,
                       parent_id, is_header, is_active, normal_balance, description, 0 as depth
                FROM gl_accounts
                WHERE parent_id IS NULL AND is_active = true
                UNION ALL
                SELECT a.id, a.code, a.name, a.type, a.category,
                       a.parent_id, a.is_header, a.is_active, a.normal_balance, a.description, t.depth + 1
                FROM gl_accounts a
                JOIN account_tree t ON a.parent_id = t.id
                WHERE a.is_active = true
            )
            SELECT * FROM account_tree ORDER BY code ASC`
        );

        const accounts = result.rows;
        const accountMap = {};
        const tree = [];

        accounts.forEach(acc => {
            acc.children = [];
            accountMap[acc.id] = acc;
        });

        accounts.forEach(acc => {
            if (acc.parent_id && accountMap[acc.parent_id]) {
                accountMap[acc.parent_id].children.push(acc);
            } else {
                tree.push(acc);
            }
        });

        res.json(tree);
    } catch (err) {
        console.error('Error fetching account tree:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getTrialBalance = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let dateFilter = '';
        const params = [];

        if (start_date) {
            params.push(start_date);
            dateFilter += ` AND je.entry_date >= $${params.length}`;
        }
        if (end_date) {
            params.push(end_date);
            dateFilter += ` AND je.entry_date <= $${params.length}`;
        }

        const result = await pool.query(
            `SELECT
                a.id, a.code, a.name, a.type, a.normal_balance,
                COALESCE(SUM(jl.debit_amount), 0) as total_debits,
                COALESCE(SUM(jl.credit_amount), 0) as total_credits
             FROM gl_accounts a
             LEFT JOIN journal_entry_lines jl ON a.id = jl.account_id
             LEFT JOIN journal_entries je ON jl.entry_id = je.id AND je.status = 'posted' ${dateFilter}
             WHERE a.is_active = true AND a.is_header = false
             GROUP BY a.id, a.code, a.name, a.type, a.normal_balance
             HAVING COALESCE(SUM(jl.debit_amount), 0) != 0 OR COALESCE(SUM(jl.credit_amount), 0) != 0
             ORDER BY a.code ASC`,
            params
        );

        const rows = result.rows.map(row => ({
            ...row,
            total_debits: parseFloat(row.total_debits),
            total_credits: parseFloat(row.total_credits),
            balance: parseFloat(row.total_debits) - parseFloat(row.total_credits)
        }));

        const totals = rows.reduce((acc, row) => ({
            total_debits: acc.total_debits + row.total_debits,
            total_credits: acc.total_credits + row.total_credits
        }), { total_debits: 0, total_credits: 0 });

        res.json({ accounts: rows, totals });
    } catch (err) {
        console.error('Error fetching trial balance:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// ==================== JOURNAL ENTRIES ====================

const getJournalEntries = async (req, res) => {
    try {
        const { status, start_date, end_date, entry_type, search } = req.query;
        let q = `SELECT je.*, u.full_name as created_by_name,
                        ap.full_name as approved_by_name,
                        po.full_name as posted_by_name
                 FROM journal_entries je
                 JOIN users u ON je.created_by = u.id
                 LEFT JOIN users ap ON je.approved_by = ap.id
                 LEFT JOIN users po ON je.posted_by = po.id
                 WHERE 1=1`;
        const params = [];

        if (status) {
            params.push(status);
            q += ` AND je.status = $${params.length}`;
        }
        if (start_date) {
            params.push(start_date);
            q += ` AND je.entry_date >= $${params.length}`;
        }
        if (end_date) {
            params.push(end_date);
            q += ` AND je.entry_date <= $${params.length}`;
        }
        if (entry_type) {
            params.push(entry_type);
            q += ` AND je.type = $${params.length}`;
        }
        if (search) {
            params.push(`%${search}%`);
            q += ` AND (je.entry_number ILIKE $${params.length} OR je.description ILIKE $${params.length} OR je.source_reference ILIKE $${params.length})`;
        }

        q += ` ORDER BY je.entry_date DESC, je.created_at DESC`;

        const result = await pool.query(q, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching journal entries:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getJournalEntryById = async (req, res) => {
    try {
        const { id } = req.params;

        const entryResult = await pool.query(
            `SELECT je.*, u.full_name as created_by_name,
                    ap.full_name as approved_by_name,
                    po.full_name as posted_by_name
             FROM journal_entries je
             JOIN users u ON je.created_by = u.id
             LEFT JOIN users ap ON je.approved_by = ap.id
             LEFT JOIN users po ON je.posted_by = po.id
             WHERE je.id = $1`,
            [id]
        );

        if (entryResult.rows.length === 0) {
            return res.status(404).json({ message: 'Journal entry not found' });
        }

        const linesResult = await pool.query(
            `SELECT jl.*, a.code, a.name, a.type
             FROM journal_entry_lines jl
             JOIN gl_accounts a ON jl.account_id = a.id
             WHERE jl.entry_id = $1
             ORDER BY jl.id ASC`,
            [id]
        );

        const entry = entryResult.rows[0];
        entry.lines = linesResult.rows;

        res.json(entry);
    } catch (err) {
        console.error('Error fetching journal entry:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const createJournalEntry = async (req, res) => {
    const client = await pool.connect();
    try {
        const { entry_date, entry_type, description, reference, lines } = req.body;
        const created_by = req.user.id;

        if (!lines || lines.length < 2) {
            return res.status(400).json({ message: 'Journal entry must have at least 2 lines' });
        }

        const totalDebits = lines.reduce((sum, l) => sum + parseFloat(l.debit_amount || 0), 0);
        const totalCredits = lines.reduce((sum, l) => sum + parseFloat(l.credit_amount || 0), 0);

        if (Math.abs(totalDebits - totalCredits) > 0.01) {
            return res.status(400).json({
                message: 'Total debits must equal total credits',
                total_debits: totalDebits,
                total_credits: totalCredits
            });
        }

        await client.query('BEGIN');

        const entry_number = `JE-${Date.now().toString().slice(-8)}`;

        const entryResult = await client.query(
            `INSERT INTO journal_entries (entry_number, entry_date, type, description, source_reference, total_debit, total_credit, status, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft', $8) RETURNING *`,
            [entry_number, entry_date || new Date(), entry_type || 'standard', description, reference, totalDebits, totalCredits, created_by]
        );

        const entry = entryResult.rows[0];

        for (const line of lines) {
            await client.query(
                `INSERT INTO journal_entry_lines (entry_id, account_id, description, debit_amount, credit_amount, cost_center_id)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [entry.id, line.account_id, line.description || '', parseFloat(line.debit_amount || 0), parseFloat(line.credit_amount || 0), line.cost_center_id || null]
            );
        }

        await client.query('COMMIT');

        const fullEntry = await pool.query(
            `SELECT je.*, u.full_name as created_by_name
             FROM journal_entries je
             JOIN users u ON je.created_by = u.id
             WHERE je.id = $1`,
            [entry.id]
        );

        const linesResult = await pool.query(
            `SELECT jl.*, a.code, a.name
             FROM journal_entry_lines jl
             JOIN gl_accounts a ON jl.account_id = a.id
             WHERE jl.entry_id = $1
             ORDER BY jl.id ASC`,
            [entry.id]
        );

        const result = fullEntry.rows[0];
        result.lines = linesResult.rows;

        res.status(201).json(result);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating journal entry:', err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};

const updateJournalEntry = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { entry_date, entry_type, description, reference, lines } = req.body;

        const existing = await client.query('SELECT status FROM journal_entries WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ message: 'Journal entry not found' });
        }
        if (existing.rows[0].status !== 'draft') {
            return res.status(400).json({ message: 'Only draft journal entries can be edited' });
        }

        await client.query('BEGIN');

        if (entry_date || entry_type || description || reference) {
            await client.query(
                `UPDATE journal_entries
                 SET entry_date = COALESCE($1, entry_date),
                     type = COALESCE($2, type),
                     description = COALESCE($3, description),
                     source_reference = COALESCE($4, source_reference),
                     updated_at = NOW()
                 WHERE id = $5`,
                [entry_date, entry_type, description, reference, id]
            );
        }

        if (lines && lines.length >= 2) {
            const totalDebits = lines.reduce((sum, l) => sum + parseFloat(l.debit_amount || 0), 0);
            const totalCredits = lines.reduce((sum, l) => sum + parseFloat(l.credit_amount || 0), 0);

            if (Math.abs(totalDebits - totalCredits) > 0.01) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    message: 'Total debits must equal total credits',
                    total_debits: totalDebits,
                    total_credits: totalCredits
                });
            }

            await client.query('DELETE FROM journal_entry_lines WHERE entry_id = $1', [id]);

            for (const line of lines) {
                await client.query(
                    `INSERT INTO journal_entry_lines (entry_id, account_id, description, debit_amount, credit_amount, cost_center_id)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [id, line.account_id, line.description || '', parseFloat(line.debit_amount || 0), parseFloat(line.credit_amount || 0), line.cost_center_id || null]
                );
            }

            await client.query(
                `UPDATE journal_entries SET total_debit = $1, total_credit = $2, updated_at = NOW() WHERE id = $3`,
                [totalDebits, totalCredits, id]
            );
        }

        await client.query('COMMIT');

        const result = await pool.query(
            `SELECT je.*, u.full_name as created_by_name
             FROM journal_entries je
             JOIN users u ON je.created_by = u.id
             WHERE je.id = $1`,
            [id]
        );

        const linesResult = await pool.query(
            `SELECT jl.*, a.code, a.name
             FROM journal_entry_lines jl
             JOIN gl_accounts a ON jl.account_id = a.id
             WHERE jl.entry_id = $1
             ORDER BY jl.id ASC`,
            [id]
        );

        const entry = result.rows[0];
        entry.lines = linesResult.rows;

        res.json(entry);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating journal entry:', err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};

const deleteJournalEntry = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;

        const existing = await client.query('SELECT status FROM journal_entries WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ message: 'Journal entry not found' });
        }
        if (existing.rows[0].status !== 'draft') {
            return res.status(400).json({ message: 'Only draft journal entries can be deleted' });
        }

        await client.query('BEGIN');
        await client.query('DELETE FROM journal_entry_lines WHERE entry_id = $1', [id]);
        await client.query('DELETE FROM journal_entries WHERE id = $1', [id]);
        await client.query('COMMIT');

        res.json({ message: 'Journal entry deleted' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error deleting journal entry:', err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};

const approveJournalEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const approved_by = req.user.id;

        const existing = await pool.query('SELECT status FROM journal_entries WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ message: 'Journal entry not found' });
        }
        if (existing.rows[0].status !== 'draft') {
            return res.status(400).json({ message: 'Only draft journal entries can be approved' });
        }

        const result = await pool.query(
            `UPDATE journal_entries
             SET status = 'approved', approved_by = $1, approved_at = NOW(), updated_at = NOW()
             WHERE id = $2 RETURNING *`,
            [approved_by, id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error approving journal entry:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const postJournalEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const posted_by = req.user.id;

        const existing = await pool.query('SELECT status FROM journal_entries WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ message: 'Journal entry not found' });
        }
        if (existing.rows[0].status !== 'approved') {
            return res.status(400).json({ message: 'Only approved journal entries can be posted' });
        }

        const result = await pool.query(
            `UPDATE journal_entries
             SET status = 'posted', posted_by = $1, posted_at = NOW(), updated_at = NOW()
             WHERE id = $2 RETURNING *`,
            [posted_by, id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error posting journal entry:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const reverseJournalEntry = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { reversal_date, description } = req.body;
        const created_by = req.user.id;

        const originalResult = await client.query(
            `SELECT * FROM journal_entries WHERE id = $1`,
            [id]
        );

        if (originalResult.rows.length === 0) {
            return res.status(404).json({ message: 'Journal entry not found' });
        }

        const original = originalResult.rows[0];
        if (original.status !== 'posted') {
            return res.status(400).json({ message: 'Only posted journal entries can be reversed' });
        }

        const originalLines = await client.query(
            `SELECT * FROM journal_entry_lines WHERE entry_id = $1 ORDER BY id ASC`,
            [id]
        );

        await client.query('BEGIN');

        const reversal_number = `JE-REV-${Date.now().toString().slice(-8)}`;
        const reversalResult = await client.query(
            `INSERT INTO journal_entries (entry_number, entry_date, type, description, source_reference, total_debit, total_credit, status, created_by, reversal_entry_id)
             VALUES ($1, $2, 'reversal', $3, $4, $5, $6, 'posted', $7, $8) RETURNING *`,
            [
                reversal_number,
                reversal_date || new Date(),
                description || `Reversal of ${original.entry_number}`,
                original.entry_number,
                original.total_debit,
                original.total_credit,
                created_by,
                id
            ]
        );

        const reversalEntry = reversalResult.rows[0];

        for (const line of originalLines.rows) {
            await client.query(
                `INSERT INTO journal_entry_lines (entry_id, account_id, description, debit_amount, credit_amount, cost_center_id)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [reversalEntry.id, line.account_id, `Reversal: ${line.description || ''}`, line.credit_amount, line.debit_amount, line.cost_center_id]
            );
        }

        // Mark original as reversed
        await client.query(
            `UPDATE journal_entries SET reversed_by = $1, reversed_at = NOW(), updated_at = NOW() WHERE id = $2`,
            [created_by, id]
        );

        await client.query('COMMIT');

        await pool.query(
            `UPDATE journal_entries SET posted_by = $1, posted_at = NOW() WHERE id = $2`,
            [created_by, reversalEntry.id]
        );

        const fullReversal = await pool.query(
            `SELECT je.*, u.full_name as created_by_name
             FROM journal_entries je
             JOIN users u ON je.created_by = u.id
             WHERE je.id = $1`,
            [reversalEntry.id]
        );

        const linesResult = await pool.query(
            `SELECT jl.*, a.code, a.name
             FROM journal_entry_lines jl
             JOIN gl_accounts a ON jl.account_id = a.id
             WHERE jl.entry_id = $1
             ORDER BY jl.id ASC`,
            [reversalEntry.id]
        );

        const result = fullReversal.rows[0];
        result.lines = linesResult.rows;

        res.status(201).json(result);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error reversing journal entry:', err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};

module.exports = {
    getAccounts,
    getAccountById,
    createAccount,
    updateAccount,
    deleteAccount,
    getAccountTree,
    getTrialBalance,
    getJournalEntries,
    getJournalEntryById,
    createJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
    approveJournalEntry,
    postJournalEntry,
    reverseJournalEntry
};
