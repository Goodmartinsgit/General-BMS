const { pool } = require('../config/db');

const getFiscalPeriods = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT fp.*,
                    lu.full_name as locked_by_name,
                    cu.full_name as closed_by_name
             FROM fiscal_periods fp
             LEFT JOIN users lu ON fp.locked_by = lu.id
             LEFT JOIN users cu ON fp.closed_by = cu.id
             ORDER BY fp.start_date DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching fiscal periods:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getActiveFiscalPeriod = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM fiscal_periods WHERE is_active = TRUE LIMIT 1`
        );
        if (result.rows.length === 0) {
            return res.json(null);
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching active fiscal period:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const createFiscalPeriod = async (req, res) => {
    try {
        const { period_name, start_date, end_date, notes } = req.body;

        if (!period_name || !start_date || !end_date) {
            return res.status(400).json({ message: 'Period name, start date, and end date are required' });
        }

        if (new Date(start_date) >= new Date(end_date)) {
            return res.status(400).json({ message: 'Start date must be before end date' });
        }

        // Check for overlapping periods
        const overlap = await pool.query(
            `SELECT id FROM fiscal_periods
             WHERE (start_date, end_date) OVERLAPS ($1::date, $2::date)`,
            [start_date, end_date]
        );
        if (overlap.rows.length > 0) {
            return res.status(400).json({ message: 'This period overlaps with an existing fiscal period' });
        }

        const orgRes = await pool.query('SELECT id FROM organizations LIMIT 1');
        const orgId = orgRes.rows[0]?.id || null;

        const result = await pool.query(
            `INSERT INTO fiscal_periods (organization_id, period_name, start_date, end_date, notes)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [orgId, period_name, start_date, end_date, notes || null]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating fiscal period:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateFiscalPeriod = async (req, res) => {
    try {
        const { id } = req.params;
        const { period_name, start_date, end_date, notes } = req.body;

        // Check period exists and is editable
        const existing = await pool.query('SELECT * FROM fiscal_periods WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ message: 'Fiscal period not found' });
        }
        if (existing.rows[0].status === 'locked') {
            return res.status(400).json({ message: 'Cannot edit a locked fiscal period' });
        }

        const result = await pool.query(
            `UPDATE fiscal_periods SET
                period_name = COALESCE($1, period_name),
                start_date = COALESCE($2, start_date),
                end_date = COALESCE($3, end_date),
                notes = COALESCE($4, notes),
                updated_at = NOW()
             WHERE id = $5 RETURNING *`,
            [period_name, start_date, end_date, notes, id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating fiscal period:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const activateFiscalPeriod = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await pool.query('SELECT * FROM fiscal_periods WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ message: 'Fiscal period not found' });
        }
        if (existing.rows[0].status === 'closed' || existing.rows[0].status === 'locked') {
            return res.status(400).json({ message: 'Cannot activate a closed or locked period' });
        }

        // Deactivate all other periods
        await pool.query(
            `UPDATE fiscal_periods SET is_active = FALSE, status = CASE WHEN status = 'active' THEN 'open' ELSE status END, updated_at = NOW()`
        );

        // Activate this period
        const result = await pool.query(
            `UPDATE fiscal_periods SET is_active = TRUE, status = 'active', updated_at = NOW()
             WHERE id = $1 RETURNING *`,
            [id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error activating fiscal period:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const closeFiscalPeriod = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id || req.user?.userId;

        const existing = await pool.query('SELECT * FROM fiscal_periods WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ message: 'Fiscal period not found' });
        }
        if (existing.rows[0].status === 'locked') {
            return res.status(400).json({ message: 'Period is already locked' });
        }

        const result = await pool.query(
            `UPDATE fiscal_periods SET
                status = 'closed', is_active = FALSE,
                closed_at = NOW(), closed_by = $1, updated_at = NOW()
             WHERE id = $2 RETURNING *`,
            [userId, id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error closing fiscal period:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const lockFiscalPeriod = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id || req.user?.userId;

        const existing = await pool.query('SELECT * FROM fiscal_periods WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ message: 'Fiscal period not found' });
        }
        if (existing.rows[0].status !== 'closed') {
            return res.status(400).json({ message: 'Period must be closed before locking' });
        }

        const result = await pool.query(
            `UPDATE fiscal_periods SET
                status = 'locked', locked_at = NOW(), locked_by = $1, updated_at = NOW()
             WHERE id = $2 RETURNING *`,
            [userId, id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error locking fiscal period:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const unlockFiscalPeriod = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await pool.query('SELECT * FROM fiscal_periods WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ message: 'Fiscal period not found' });
        }
        if (existing.rows[0].status !== 'locked') {
            return res.status(400).json({ message: 'Period is not locked' });
        }

        const result = await pool.query(
            `UPDATE fiscal_periods SET
                status = 'closed', locked_at = NULL, locked_by = NULL, updated_at = NOW()
             WHERE id = $1 RETURNING *`,
            [id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error unlocking fiscal period:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteFiscalPeriod = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await pool.query('SELECT * FROM fiscal_periods WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ message: 'Fiscal period not found' });
        }
        if (existing.rows[0].status === 'locked') {
            return res.status(400).json({ message: 'Cannot delete a locked fiscal period' });
        }

        await pool.query('DELETE FROM fiscal_periods WHERE id = $1', [id]);
        res.json({ message: 'Fiscal period deleted' });
    } catch (err) {
        console.error('Error deleting fiscal period:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getGlobalFiscalSettings = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM global_fiscal_settings LIMIT 1');
        const data = result.rows[0] || {
            fiscal_year_start_month: 1,
            fiscal_year_start_day: 1,
            auto_create_periods: false,
            period_type: 'forever',
            custom_start_date: null,
            custom_end_date: null,
            show_period_badge_on_dashboard: true,
            allow_users_to_override: true
        };
        res.json({ success: true, data });
    } catch (err) {
        console.error('Error fetching global fiscal settings:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const updateGlobalFiscalSettings = async (req, res) => {
    try {
        const {
            fiscal_year_start_month, fiscal_year_start_day, auto_create_periods, period_type,
            custom_start_date, custom_end_date, show_period_badge_on_dashboard, allow_users_to_override
        } = req.body;

        const orgRes = await pool.query('SELECT id FROM organizations LIMIT 1');
        const orgId = orgRes.rows[0]?.id || null;

        const result = await pool.query(
            `INSERT INTO global_fiscal_settings (
                organization_id, fiscal_year_start_month, fiscal_year_start_day,
                auto_create_periods, period_type, custom_start_date, custom_end_date,
                show_period_badge_on_dashboard, allow_users_to_override
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (organization_id)
             DO UPDATE SET
                fiscal_year_start_month = $2, fiscal_year_start_day = $3,
                auto_create_periods = $4, period_type = $5,
                custom_start_date = $6, custom_end_date = $7,
                show_period_badge_on_dashboard = $8, allow_users_to_override = $9,
                updated_at = NOW()
             RETURNING *`,
            [
                orgId,
                fiscal_year_start_month || 1,
                fiscal_year_start_day || 1,
                auto_create_periods ?? false,
                period_type || 'forever',
                custom_start_date || null,
                custom_end_date || null,
                show_period_badge_on_dashboard ?? true,
                allow_users_to_override ?? true
            ]
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('Error updating global fiscal settings:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Calculate period dates in JavaScript (fallback if DB function is unavailable)
 */
const calculatePeriodDatesJS = (settings) => {
    const today = new Date();
    let start_date = null;
    let end_date = null;
    let period_label = 'All Time';

    switch (settings.period_type) {
        case 'daily':
            start_date = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            end_date = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            period_label = 'Today';
            break;

        case 'weekly': {
            const dayOfWeek = today.getDay();
            const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            start_date = new Date(today);
            start_date.setDate(today.getDate() + mondayOffset);
            end_date = new Date(start_date);
            end_date.setDate(start_date.getDate() + 6);
            period_label = 'This Week';
            break;
        }

        case 'monthly':
            start_date = new Date(today.getFullYear(), today.getMonth(), 1);
            end_date = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            period_label = start_date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            break;

        case 'quarterly': {
            const quarter = Math.floor(today.getMonth() / 3);
            start_date = new Date(today.getFullYear(), quarter * 3, 1);
            end_date = new Date(today.getFullYear(), (quarter + 1) * 3, 0);
            period_label = `Q${quarter + 1} ${today.getFullYear()}`;
            break;
        }

        case 'half_yearly':
            if (today.getMonth() < 6) {
                start_date = new Date(today.getFullYear(), 0, 1);
                end_date = new Date(today.getFullYear(), 5, 30);
                period_label = `H1 ${today.getFullYear()}`;
            } else {
                start_date = new Date(today.getFullYear(), 6, 1);
                end_date = new Date(today.getFullYear(), 11, 31);
                period_label = `H2 ${today.getFullYear()}`;
            }
            break;

        case 'yearly': {
            const fiscalMonth = (settings.fiscal_year_start_month || 1) - 1;
            const fiscalDay = settings.fiscal_year_start_day || 1;
            const fiscalYearStart = new Date(today.getFullYear(), fiscalMonth, fiscalDay);

            if (today < fiscalYearStart) {
                start_date = new Date(today.getFullYear() - 1, fiscalMonth, fiscalDay);
            } else {
                start_date = fiscalYearStart;
            }
            end_date = new Date(start_date.getFullYear() + 1, fiscalMonth, fiscalDay - 1);
            period_label = `FY ${start_date.getFullYear()}`;
            break;
        }

        case 'custom':
            start_date = settings.custom_start_date ? new Date(settings.custom_start_date) : null;
            end_date = settings.custom_end_date ? new Date(settings.custom_end_date) : null;
            if (start_date && end_date) {
                period_label = `${start_date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} - ${end_date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`;
            }
            break;

        case 'forever':
        default:
            start_date = null;
            end_date = null;
            period_label = 'All Time';
            break;
    }

    return {
        start_date: start_date ? start_date.toISOString().split('T')[0] : null,
        end_date: end_date ? end_date.toISOString().split('T')[0] : null,
        period_type: settings.period_type,
        period_label
    };
};

/**
 * Get active period date range
 * GET /api/fiscal-periods/current-range
 */
const getActivePeriodRange = async (req, res) => {
    try {
        // Try PostgreSQL function first
        try {
            const result = await pool.query('SELECT * FROM get_active_fiscal_period_range()');
            if (result.rows.length > 0) {
                return res.json({ success: true, data: result.rows[0] });
            }
        } catch (dbErr) {
            console.warn('DB function get_active_fiscal_period_range failed, using JS fallback:', dbErr.message);
        }

        // JS fallback
        const settingsResult = await pool.query('SELECT * FROM global_fiscal_settings LIMIT 1');
        const settings = settingsResult.rows[0] || { period_type: 'forever' };
        const range = calculatePeriodDatesJS(settings);
        res.json({ success: true, data: range });
    } catch (err) {
        console.error('Error getting active period range:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    getFiscalPeriods,
    getActiveFiscalPeriod,
    createFiscalPeriod,
    updateFiscalPeriod,
    activateFiscalPeriod,
    closeFiscalPeriod,
    lockFiscalPeriod,
    unlockFiscalPeriod,
    deleteFiscalPeriod,
    getGlobalFiscalSettings,
    updateGlobalFiscalSettings,
    getActivePeriodRange
};
