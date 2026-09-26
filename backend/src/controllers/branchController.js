const { query, pool } = require('../config/db');

// ---------------------------------------------------------------------------
// GET /api/branches/mode  (any authenticated user)
// Returns single-branch vs multi-branch mode.
// If no branches exist yet, auto-creates the "Main Branch" (the app itself).
// ---------------------------------------------------------------------------
const getBranchMode = async (req, res) => {
    try {
        const countRes = await query('SELECT COUNT(*) FROM branches WHERE deleted_at IS NULL');
        let branchCount = parseInt(countRes.rows[0].count);

        // Auto-create Main Branch when none exist so every operation has a valid branch_id
        if (branchCount === 0) {
            await query(
                `INSERT INTO branches (branch_code, branch_name, main_branch, is_active)
                 VALUES ('MAIN', 'Main Branch', true, true)
                 ON CONFLICT (branch_code) DO NOTHING`
            );
            branchCount = 1;
        }

        const branchesRes = await query(
            `SELECT id, branch_name, branch_code, main_branch, is_active, is_warehouse
             FROM branches
             WHERE deleted_at IS NULL
             ORDER BY main_branch DESC, created_at ASC`
        );
        const branches = branchesRes.rows;
        const singleBranchMode = branchCount <= 1;

        res.json({
            singleBranchMode,
            branchCount,
            requiresBranchSelection: !singleBranchMode,
            branches,
            mainBranch: branches.find(b => b.main_branch) || branches[0] || null,
        });
    } catch (err) {
        console.error('[getBranchMode]', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAllBranches = async (req, res) => {
    try {
        const result = await query(
            `SELECT b.*, o.organization_name, u.full_name as manager_name 
             FROM branches b 
             LEFT JOIN organizations o ON b.organization_id = o.id 
             LEFT JOIN users u ON b.manager_user_id = u.id 
             WHERE b.deleted_at IS NULL 
             ORDER BY b.created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getBranchById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            `SELECT b.*, o.organization_name, u.full_name as manager_name 
             FROM branches b 
             LEFT JOIN organizations o ON b.organization_id = o.id 
             LEFT JOIN users u ON b.manager_user_id = u.id 
             WHERE b.id = $1 AND b.deleted_at IS NULL`,
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Branch not found' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const createBranch = async (req, res) => {
    try {
        const { organization_id, branch_code, branch_name, address, city, state, country, phone_number, email, manager_user_id, is_warehouse } = req.body;

        const result = await query(
            `INSERT INTO branches (organization_id, branch_code, branch_name, address, city, state, country, phone_number, email, manager_user_id, is_warehouse)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING *`,
            [organization_id || null, branch_code, branch_name, address, city, state, country, phone_number || null, email || null, manager_user_id || null, is_warehouse]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') { // Unique violation
            return res.status(400).json({ message: 'Branch code already exists' });
        }
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateBranch = async (req, res) => {
    try {
        const { id } = req.params;
        const { branch_name, address, city, state, country, phone_number, email, manager_user_id, is_warehouse, is_active } = req.body;

        const result = await query(
            `UPDATE branches 
             SET branch_name = $1, address = $2, city = $3, state = $4, country = $5, 
                 phone_number = $6, email = $7, manager_user_id = $8, is_warehouse = $9, 
                 is_active = $10, updated_at = NOW() 
             WHERE id = $11 AND deleted_at IS NULL 
             RETURNING *`,
            [branch_name, address, city, state, country, phone_number || null, email || null, manager_user_id || null, is_warehouse, is_active, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Branch not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteBranch = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { reason } = req.body;

        await client.query('BEGIN');

        // Get branch data for recycle bin snapshot
        const branchResult = await client.query(
            'SELECT * FROM branches WHERE id = $1 AND deleted_at IS NULL',
            [id]
        );

        if (branchResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Branch not found' });
        }

        const branch = branchResult.rows[0];

        // Add to recycle bin
        await client.query(
            `INSERT INTO recycle_bin (entity_type, entity_id, entity_data, deleted_by, deletion_reason, restore_deadline)
             VALUES ('branch', $1, $2, $3, $4, CURRENT_TIMESTAMP + INTERVAL '30 days')`,
            [id, JSON.stringify(branch), req.user?.id, reason || null]
        );

        // Soft delete
        await client.query(
            'UPDATE branches SET deleted_at = NOW(), is_active = false WHERE id = $1',
            [id]
        );

        // Record in deletion audit trail
        await client.query(
            `INSERT INTO deletion_audit_trail (entity_type, entity_id, action, performed_by, notes)
             VALUES ('branch', $1, 'soft_delete', $2, $3)`,
            [id, req.user?.id, reason || `Deleted branch ${branch.branch_name}`]
        );

        await client.query('COMMIT');

        res.json({ message: 'Branch deleted successfully' });
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};

const getOrganizations = async (req, res) => {
    try {
        const result = await query('SELECT id, organization_name FROM organizations WHERE is_active = true');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getBranchMode, getAllBranches, getBranchById, createBranch, updateBranch, deleteBranch, getOrganizations };
