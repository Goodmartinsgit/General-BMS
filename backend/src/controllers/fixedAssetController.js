const { pool } = require('../config/db');

const getFixedAssets = async (req, res) => {
    try {
        const { category, status, search } = req.query;
        let q = `SELECT fa.*, s.supplier_name FROM fixed_assets fa
                 LEFT JOIN suppliers s ON fa.supplier_id = s.id WHERE 1=1`;
        const params = [];
        let idx = 1;

        if (category) { params.push(category); q += ` AND fa.category = $${idx++}`; }
        if (status) { params.push(status); q += ` AND fa.status = $${idx++}`; }
        if (search) { params.push(`%${search}%`); q += ` AND (fa.name ILIKE $${idx} OR fa.code ILIKE $${idx})`; idx++; }

        q += ` ORDER BY fa.name ASC`;
        const result = await pool.query(q, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching fixed assets:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getFixedAssetById = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT fa.*, s.supplier_name FROM fixed_assets fa
             LEFT JOIN suppliers s ON fa.supplier_id = s.id WHERE fa.id = $1`, [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Asset not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching asset:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const createFixedAsset = async (req, res) => {
    try {
        const { name, code, category, description, purchase_date, purchase_price, supplier_id,
                useful_life_months, salvage_value, depreciation_method, gl_account_id,
                depreciation_account_id, location, branch_id } = req.body;
        const current_value = purchase_price || 0;
        const result = await pool.query(
            `INSERT INTO fixed_assets (name, code, category, description, purchase_date, purchase_price,
             supplier_id, useful_life_months, salvage_value, depreciation_method, current_value,
             gl_account_id, depreciation_account_id, location, branch_id)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
            [name, code, category, description, purchase_date, purchase_price, supplier_id,
             useful_life_months, salvage_value || 0, depreciation_method || 'straight_line',
             current_value, gl_account_id, depreciation_account_id, location, branch_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating asset:', err);
        if (err.code === '23505') return res.status(400).json({ message: 'Asset code already exists' });
        res.status(500).json({ message: 'Server error' });
    }
};

const updateFixedAsset = async (req, res) => {
    try {
        const { name, code, category, description, purchase_date, purchase_price, supplier_id,
                useful_life_months, salvage_value, depreciation_method, location, status } = req.body;
        const result = await pool.query(
            `UPDATE fixed_assets SET name=COALESCE($1,name), code=COALESCE($2,code),
             category=COALESCE($3,category), description=$4, purchase_date=COALESCE($5,purchase_date),
             purchase_price=COALESCE($6,purchase_price), supplier_id=$7,
             useful_life_months=COALESCE($8,useful_life_months), salvage_value=COALESCE($9,salvage_value),
             depreciation_method=COALESCE($10,depreciation_method), location=$11,
             status=COALESCE($12,status), updated_at=NOW()
             WHERE id=$13 RETURNING *`,
            [name, code, category, description, purchase_date, purchase_price, supplier_id,
             useful_life_months, salvage_value, depreciation_method, location, status, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Asset not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating asset:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteFixedAsset = async (req, res) => {
    try {
        const result = await pool.query(
            `UPDATE fixed_assets SET status = 'disposed', disposal_date = CURRENT_DATE, updated_at = NOW()
             WHERE id = $1 RETURNING *`, [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Asset not found' });
        res.json({ message: 'Asset disposed' });
    } catch (err) {
        console.error('Error deleting asset:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const runDepreciation = async (req, res) => {
    try {
        const assets = await pool.query(
            `SELECT * FROM fixed_assets WHERE status = 'active' AND useful_life_months > 0`
        );

        let processed = 0;
        for (const asset of assets.rows) {
            const monthlyDep = (asset.purchase_price - asset.salvage_value) / asset.useful_life_months;
            const newAccumulated = parseFloat(asset.accumulated_depreciation) + monthlyDep;
            const newCurrentValue = Math.max(asset.purchase_price - newAccumulated, asset.salvage_value);
            const newStatus = newCurrentValue <= asset.salvage_value ? 'fully_depreciated' : 'active';

            await pool.query(
                `UPDATE fixed_assets SET accumulated_depreciation = $1, current_value = $2,
                 status = $3, updated_at = NOW() WHERE id = $4`,
                [newAccumulated, newCurrentValue, newStatus, asset.id]
            );
            processed++;
        }

        res.json({ message: `Depreciation run complete. ${processed} assets processed.` });
    } catch (err) {
        console.error('Error running depreciation:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getFixedAssets, getFixedAssetById, createFixedAsset, updateFixedAsset, deleteFixedAsset, runDepreciation };
