const { pool } = require('../config/db');

const defaults = {
    logo_url: null,
    logo_type: 'icon_text',
    logo_icon_text: 'BMS',
    company_name: 'General BMS',
    primary_color: '#D4AF37',
    secondary_color: '#1a1a2e',
    accent_color: '#D4AF37',
    font_family: 'Inter',
    sidebar_bg_color: null,
    navbar_bg_color: null,
    button_color: null,
    background_color: null,
    sidebar_name_size: 'medium',
    hover_color: '#C5A353',
    active_text_color: '#000000'
};

const getBrandingConfig = async (req, res) => {
    try {
        const [brandingRes, orgRes] = await Promise.all([
            pool.query('SELECT * FROM branding_config ORDER BY updated_at DESC NULLS LAST, id DESC LIMIT 1'),
            pool.query('SELECT organization_name, logo_url FROM organizations LIMIT 1'),
        ]);

        const org = orgRes.rows[0] || {};
        // company_name always comes from the organizations table (General Settings)
        const companyName = org.organization_name || defaults.company_name;

        if (brandingRes.rows.length === 0) {
            return res.json({
                ...defaults,
                company_name: companyName,
                logo_url: org.logo_url || null,
            });
        }

        res.json({
            ...brandingRes.rows[0],
            company_name: companyName,
        });
    } catch (err) {
        console.error('Error fetching branding config:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateBrandingConfig = async (req, res) => {
    try {
        const {
            logo_url, logo_type, logo_icon_text,
            primary_color, secondary_color, accent_color, font_family,
            sidebar_bg_color, navbar_bg_color, button_color, background_color,
            sidebar_name_size, hover_color, active_text_color
        } = req.body;

        // company_name is managed via General Settings only — read it from org table
        const orgRes = await pool.query('SELECT id, organization_name FROM organizations LIMIT 1');
        const orgId = orgRes.rows[0]?.id || null;
        const companyName = orgRes.rows[0]?.organization_name || defaults.company_name;

        const values = [
            logo_url, logo_type || 'icon_text', logo_icon_text || 'BMS',
            companyName,
            primary_color || '#D4AF37', secondary_color || '#1a1a2e', accent_color || '#D4AF37',
            font_family || 'Inter', sidebar_bg_color || null,
            navbar_bg_color || null, button_color || null,
            background_color || null, sidebar_name_size || 'medium',
            hover_color || '#C5A353', active_text_color || '#000000'
        ];

        // Check if a branding_config row already exists
        const existing = await pool.query('SELECT id, organization_id FROM branding_config ORDER BY id LIMIT 1');

        let result;
        if (existing.rows.length > 0) {
            // UPDATE the existing row by its id
            if (orgId !== null) {
                result = await pool.query(
                    `UPDATE branding_config SET
                        organization_id = $1,
                        logo_url = $2, logo_type = $3, logo_icon_text = $4, company_name = $5,
                        primary_color = $6, secondary_color = $7, accent_color = $8, font_family = $9,
                        sidebar_bg_color = $10, navbar_bg_color = $11, button_color = $12,
                        background_color = $13, sidebar_name_size = $14,
                        hover_color = $15, active_text_color = $16, updated_at = NOW()
                     WHERE id = $17
                     RETURNING *`,
                    [orgId, ...values, existing.rows[0].id]
                );
            } else {
                // Update without changing organization_id if no org exists
                result = await pool.query(
                    `UPDATE branding_config SET
                        logo_url = $1, logo_type = $2, logo_icon_text = $3, company_name = $4,
                        primary_color = $5, secondary_color = $6, accent_color = $7, font_family = $8,
                        sidebar_bg_color = $9, navbar_bg_color = $10, button_color = $11,
                        background_color = $12, sidebar_name_size = $13,
                        hover_color = $14, active_text_color = $15, updated_at = NOW()
                     WHERE id = $16
                     RETURNING *`,
                    [...values, existing.rows[0].id]
                );
            }
        } else {
            // INSERT a new row - only set organization_id if it exists
            if (orgId !== null) {
                result = await pool.query(
                    `INSERT INTO branding_config (
                        organization_id, logo_url, logo_type, logo_icon_text, company_name,
                        primary_color, secondary_color, accent_color, font_family,
                        sidebar_bg_color, navbar_bg_color, button_color, background_color, sidebar_name_size,
                        hover_color, active_text_color
                     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                     RETURNING *`,
                    [orgId, ...values]
                );
            } else {
                result = await pool.query(
                    `INSERT INTO branding_config (
                        logo_url, logo_type, logo_icon_text, company_name,
                        primary_color, secondary_color, accent_color, font_family,
                        sidebar_bg_color, navbar_bg_color, button_color, background_color, sidebar_name_size,
                        hover_color, active_text_color
                     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                     RETURNING *`,
                    values
                );
            }
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating branding config:', err);
        console.error('Error details:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { getBrandingConfig, updateBrandingConfig };
