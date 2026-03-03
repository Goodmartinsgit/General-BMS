const { pool } = require('../config/db');

const getTaxSettings = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tax_settings LIMIT 1');
        res.json(result.rows[0] || {
            tax_enabled: true,
            standard_rate: 0,
            reduced_rate: 0,
            zero_rate: 0,
            tax_application_mode: 'exclusive',
            tax_number: '',
            effective_date: new Date().toISOString().split('T')[0]
        });
    } catch (err) {
        console.error('Error fetching tax settings:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateTaxSettings = async (req, res) => {
    try {
        const { tax_enabled, standard_rate, reduced_rate, zero_rate, tax_application_mode, tax_number, effective_date } = req.body;

        const orgRes = await pool.query('SELECT id FROM organizations LIMIT 1');
        const orgId = orgRes.rows[0]?.id || null;

        const result = await pool.query(
            `INSERT INTO tax_settings (organization_id, tax_enabled, standard_rate, reduced_rate, zero_rate, tax_application_mode, tax_number, effective_date)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (organization_id)
             DO UPDATE SET
                tax_enabled = $2, standard_rate = $3, reduced_rate = $4, zero_rate = $5,
                tax_application_mode = $6, tax_number = $7, effective_date = $8, updated_at = NOW()
             RETURNING *`,
            [orgId, tax_enabled ?? true, standard_rate || 0, reduced_rate || 0, zero_rate || 0,
             tax_application_mode || 'exclusive', tax_number || '', effective_date || new Date().toISOString().split('T')[0]]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating tax settings:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getTaxSettings, updateTaxSettings };
