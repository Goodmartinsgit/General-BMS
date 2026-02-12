const { query } = require('../config/db');

const getAllPriceTiers = async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM price_tiers ORDER BY discount_percentage ASC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const createPriceTier = async (req, res) => {
    try {
        const { tier_name, discount_percentage, notes } = req.body;
        const result = await query(
            'INSERT INTO price_tiers (tier_name, discount_percentage, notes) VALUES ($1, $2, $3) RETURNING *',
            [tier_name, discount_percentage, notes]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const updatePriceTier = async (req, res) => {
    try {
        const { id } = req.params;
        const { tier_name, discount_percentage, notes, is_active } = req.body;
        const result = await query(
            'UPDATE price_tiers SET tier_name = $1, discount_percentage = $2, notes = $3, is_active = $4, updated_at = NOW() WHERE id = $5 RETURNING *',
            [tier_name, discount_percentage, notes, is_active, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Price tier not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const deletePriceTier = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if customers or products use this tier
        const usageCheck = await query('SELECT count(*) FROM customers WHERE price_tier_id = $1', [id]);
        if (parseInt(usageCheck.rows[0].count) > 0) {
            return res.status(400).json({ message: 'Cannot delete tier: It is being used by customers.' });
        }
        
        const result = await query('DELETE FROM price_tiers WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Price tier not found' });
        res.json({ message: 'Price tier deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getAllPriceTiers, createPriceTier, updatePriceTier, deletePriceTier };
