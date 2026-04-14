const { pool } = require('../config/db');

/**
 * Get all settings (aggregated from settings table + org info)
 */
const getSettings = async (req, res) => {
    try {
        const orgRes = await pool.query('SELECT * FROM organizations LIMIT 1');
        const org = orgRes.rows[0] || {};
        const orgId = org.id || null;

        let settingsMap = {};
        if (orgId) {
            const settingsRes = await pool.query(
                'SELECT category, settings FROM settings WHERE organization_id = $1',
                [orgId]
            );
            for (const row of settingsRes.rows) {
                settingsMap[row.category] = row.settings;
            }
        }

        // Merge org info into general settings
        const general = {
            company_name: org.organization_name || '',
            company_email: org.email || '',
            company_phone: org.phone || '',
            company_address: org.address || '',
            ...(settingsMap.general || {})
        };

        res.json({
            settings: {
                general,
                tax: settingsMap.tax || { tax_enabled: true, default_tax_rate: 0, tax_inclusive: false, tax_number: '' },
                payment: settingsMap.payment || { cash_enabled: true, card_enabled: true, bank_transfer_enabled: true, mobile_money_enabled: false, default_payment_method: 'cash' },
                notifications: settingsMap.notifications || { email_notifications: true, low_stock_alerts: true, low_stock_threshold: 10, daily_summary: false, order_notifications: true },
                security: settingsMap.security || { session_timeout: 30, require_password_change: false, password_expiry_days: 90, two_factor_enabled: false },
                display: settingsMap.display || { items_per_page: 20, default_view_mode: 'grid', show_product_images: true, compact_mode: false, theme: 'midnight' },
                receipt: settingsMap.receipt || { show_logo: true, header_text: '', footer_text: 'Thank you for your business!', show_tax_breakdown: true, auto_print: false }
            }
        });
    } catch (err) {
        console.error('Error fetching settings:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Update all settings at once
 */
const updateSettings = async (req, res) => {
    try {
        const orgRes = await pool.query('SELECT id FROM organizations LIMIT 1');
        const data = req.body;
        let orgId;

        if (orgRes.rows.length === 0) {
            // No organization yet — create one from general settings
            const g = data.general || {};
            const insertRes = await pool.query(
                `INSERT INTO organizations (organization_name, email, phone, address)
                 VALUES ($1, $2, $3, $4) RETURNING id`,
                [g.company_name || 'General BMS', g.company_email || '', g.company_phone || '', g.company_address || '']
            );
            orgId = insertRes.rows[0].id;
        } else {
            orgId = orgRes.rows[0].id;

            // Update org info from general settings
            if (data.general) {
                await pool.query(
                    `UPDATE organizations SET
                        organization_name = COALESCE($1, organization_name),
                        email = COALESCE($2, email),
                        phone = COALESCE($3, phone),
                        address = COALESCE($4, address),
                        updated_at = NOW()
                     WHERE id = $5`,
                    [data.general.company_name, data.general.company_email, data.general.company_phone, data.general.company_address, orgId]
                );
            }
        }

        // Upsert each category
        const categories = ['general', 'tax', 'payment', 'notifications', 'security', 'display', 'receipt'];
        for (const category of categories) {
            if (data[category]) {
                await pool.query(
                    `INSERT INTO settings (organization_id, category, settings, updated_at)
                     VALUES ($1, $2, $3, NOW())
                     ON CONFLICT (organization_id, category)
                     DO UPDATE SET settings = $3, updated_at = NOW()`,
                    [orgId, category, JSON.stringify(data[category])]
                );
            }
        }

        res.json({ message: 'Settings updated successfully' });
    } catch (err) {
        console.error('Error updating settings:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Get company information (public)
 * Also returns regional settings (timezone, date_format) for the frontend.
 */
const getCompanyInfo = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM organizations LIMIT 1');
        if (result.rows.length === 0) {
            return res.json({
                organization_name: 'General BMS',
                email: '',
                phone: '',
                address: '',
                logo_url: null,
                timezone: 'Africa/Lagos',
                date_format: 'DD/MM/YYYY'
            });
        }

        const org = result.rows[0];

        // Fetch regional prefs (timezone, date_format) from settings table
        let timezone = 'Africa/Lagos';
        let date_format = 'DD/MM/YYYY';
        try {
            const settingsRes = await pool.query(
                `SELECT settings FROM settings WHERE organization_id = $1 AND category = 'general' LIMIT 1`,
                [org.id]
            );
            if (settingsRes.rows.length > 0) {
                const gs = settingsRes.rows[0].settings || {};
                if (gs.timezone) timezone = gs.timezone;
                if (gs.date_format) date_format = gs.date_format;
            }
        } catch (e) {
            // settings table may not exist yet — fall back to defaults
            console.warn('Could not fetch general settings for company info:', e.message);
        }

        res.json({ ...org, timezone, date_format });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};


/**
 * Update company information
 */
const updateCompanyInfo = async (req, res) => {
    try {
        const { organization_name, email, phone, address, logo_url } = req.body;

        const checkRes = await pool.query('SELECT id FROM organizations LIMIT 1');

        let result;
        if (checkRes.rows.length > 0) {
            result = await pool.query(
                `UPDATE organizations SET
                    organization_name = $1,
                    email = $2,
                    phone = $3,
                    address = $4,
                    logo_url = $5,
                    updated_at = NOW()
                 WHERE id = $6 RETURNING *`,
                [organization_name, email, phone, address, logo_url, checkRes.rows[0].id]
            );
        } else {
            result = await pool.query(
                `INSERT INTO organizations (organization_name, email, phone, address, logo_url)
                 VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [organization_name, email, phone, address, logo_url]
            );
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Get specific setting category
 */
const getSettingCategory = async (req, res) => {
    const { category } = req.params;
    try {
        const orgRes = await pool.query('SELECT id FROM organizations LIMIT 1');
        if (orgRes.rows.length === 0) {
            return res.json({});
        }

        const result = await pool.query(
            'SELECT settings FROM settings WHERE organization_id = $1 AND category = $2',
            [orgRes.rows[0].id, category]
        );

        res.json(result.rows[0]?.settings || {});
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Update specific setting category
 */
const updateSettingCategory = async (req, res) => {
    const { category } = req.params;
    try {
        const orgRes = await pool.query('SELECT id FROM organizations LIMIT 1');
        if (orgRes.rows.length === 0) {
            return res.status(400).json({ message: 'No organization found' });
        }

        await pool.query(
            `INSERT INTO settings (organization_id, category, settings, updated_at)
             VALUES ($1, $2, $3, NOW())
             ON CONFLICT (organization_id, category)
             DO UPDATE SET settings = $3, updated_at = NOW()`,
            [orgRes.rows[0].id, category, JSON.stringify(req.body)]
        );

        res.json({ message: `${category} settings updated` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getSettings,
    updateSettings,
    getCompanyInfo,
    updateCompanyInfo,
    getSettingCategory,
    updateSettingCategory
};
