const { pool } = require('../config/db');

const getDemoSettings = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM demo_config LIMIT 1');
        res.json(result.rows[0] || {
            demo_mode_enabled: false,
            blur_financial_data: false,
            blur_customer_data: false,
            blur_supplier_data: false,
            blur_sales_figures: false,
            blur_inventory_values: false,
            blur_account_balances: false
        });
    } catch (err) {
        console.error('Error fetching demo settings:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateDemoSettings = async (req, res) => {
    try {
        const {
            demo_mode_enabled, blur_financial_data, blur_customer_data,
            blur_supplier_data, blur_sales_figures, blur_inventory_values, blur_account_balances
        } = req.body;

        const orgRes = await pool.query('SELECT id FROM organizations LIMIT 1');
        const orgId = orgRes.rows[0]?.id || null;

        const result = await pool.query(
            `INSERT INTO demo_config (
                organization_id, demo_mode_enabled, blur_financial_data, blur_customer_data,
                blur_supplier_data, blur_sales_figures, blur_inventory_values, blur_account_balances
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (organization_id)
             DO UPDATE SET
                demo_mode_enabled = $2, blur_financial_data = $3, blur_customer_data = $4,
                blur_supplier_data = $5, blur_sales_figures = $6, blur_inventory_values = $7,
                blur_account_balances = $8, updated_at = NOW()
             RETURNING *`,
            [orgId, demo_mode_enabled ?? false, blur_financial_data ?? false,
             blur_customer_data ?? false, blur_supplier_data ?? false,
             blur_sales_figures ?? false, blur_inventory_values ?? false,
             blur_account_balances ?? false]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating demo settings:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getDemoSettings, updateDemoSettings };
