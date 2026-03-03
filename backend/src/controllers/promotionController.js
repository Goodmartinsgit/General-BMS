const { query } = require('../config/db');

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Validate promotion dates
 */
const validatePromotionDates = (start_date, end_date) => {
  const start = new Date(start_date);
  const end = new Date(end_date);
  const now = new Date();

  if (start >= end) {
    return { valid: false, message: 'Start date must be before end date' };
  }

  if (end < now) {
    return { valid: false, message: 'End date cannot be in the past' };
  }

  return { valid: true };
};

/**
 * Check if promotion is currently active
 */
const isPromotionActive = (promotion) => {
  const now = new Date();
  const start = new Date(promotion.start_date);
  const end = new Date(promotion.end_date);

  return (
    promotion.is_active &&
    now >= start &&
    now <= end &&
    (promotion.usage_limit === null || promotion.current_usage_count < promotion.usage_limit)
  );
};

/**
 * Calculate discount for a promotion
 */
const calculateDiscount = (promotion, subtotal, quantity = 1) => {
  let discount = 0;

  switch (promotion.promotion_type) {
    case 'percentage':
      discount = (subtotal * promotion.discount_percentage) / 100;
      break;

    case 'fixed_amount':
      discount = promotion.discount_amount;
      break;

    case 'bogo':
      // Buy X Get Y free
      const freeItems = Math.floor(quantity / (promotion.buy_quantity + promotion.get_quantity)) * promotion.get_quantity;
      const itemPrice = subtotal / quantity;
      discount = freeItems * itemPrice;
      break;

    case 'bulk_discount':
      if (quantity >= promotion.min_quantity) {
        discount = (subtotal * promotion.discount_percentage) / 100;
      }
      break;

    default:
      discount = 0;
  }

  // Apply max discount limit if set
  if (promotion.max_discount_amount && discount > promotion.max_discount_amount) {
    discount = promotion.max_discount_amount;
  }

  return parseFloat(discount.toFixed(2));
};

// ============================================================================
// PROMOTION CRUD OPERATIONS
// ============================================================================

/**
 * Get all promotions with filtering
 * @route GET /api/promotions
 */
const getAllPromotions = async (req, res) => {
  try {
    const {
      is_active,
      promotion_type,
      status, // 'active', 'upcoming', 'expired'
      search,
      page = 1,
      limit = 50
    } = req.query;

    const conditions = [];
    const params = [];
    let paramCounter = 1;

    if (is_active !== undefined) {
      conditions.push(`p.is_active = $${paramCounter}`);
      params.push(is_active === 'true');
      paramCounter++;
    }

    if (promotion_type) {
      conditions.push(`p.promotion_type = $${paramCounter}`);
      params.push(promotion_type);
      paramCounter++;
    }

    if (status === 'active') {
      conditions.push(`p.start_date <= CURRENT_TIMESTAMP AND p.end_date >= CURRENT_TIMESTAMP`);
      conditions.push(`p.is_active = TRUE`);
    } else if (status === 'upcoming') {
      conditions.push(`p.start_date > CURRENT_TIMESTAMP`);
    } else if (status === 'expired') {
      conditions.push(`p.end_date < CURRENT_TIMESTAMP`);
    }

    if (search) {
      conditions.push(`(p.promotion_name ILIKE $${paramCounter} OR p.promotion_code ILIKE $${paramCounter})`);
      params.push(`%${search}%`);
      paramCounter++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const promotionsQuery = `
      SELECT p.*,
        (SELECT COUNT(*) FROM promotion_usage WHERE promotion_id = p.id) as total_usage,
        (SELECT COALESCE(SUM(discount_applied), 0) FROM promotion_usage WHERE promotion_id = p.id) as total_discount_given
      FROM promotions p
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM promotions p
      ${whereClause}
    `;

    const [promotionsResult, countResult] = await Promise.all([
      query(promotionsQuery, [...params, limit, offset]),
      query(countQuery, params)
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      promotions: promotionsResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });
  } catch (err) {
    console.error('Error fetching promotions:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get single promotion by ID or code
 * @route GET /api/promotions/:identifier
 */
const getPromotion = async (req, res) => {
  try {
    const { identifier } = req.params;

    const isNumeric = /^\d+$/.test(identifier);
    const field = isNumeric ? 'id' : 'promotion_code';

    const result = await query(`
      SELECT p.*,
        (SELECT COUNT(*) FROM promotion_usage WHERE promotion_id = p.id) as total_usage,
        (SELECT COALESCE(SUM(discount_applied), 0) FROM promotion_usage WHERE promotion_id = p.id) as total_discount_given,
        (SELECT json_agg(json_build_object(
          'customer_id', pu.customer_id,
          'sale_id', pu.sale_id,
          'discount_applied', pu.discount_applied,
          'used_at', pu.used_at
        ))
        FROM promotion_usage pu
        WHERE pu.promotion_id = p.id
        ORDER BY pu.used_at DESC
        LIMIT 10
        ) as recent_usage
      FROM promotions p
      WHERE p.${field} = $1
    `, [identifier]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Promotion not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching promotion:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Create new promotion
 * @route POST /api/promotions
 */
const createPromotion = async (req, res) => {
  try {
    const {
      promotion_code,
      promotion_name,
      description,
      promotion_type,
      discount_percentage,
      discount_amount,
      buy_quantity,
      get_quantity,
      min_purchase_amount,
      min_quantity,
      max_discount_amount,
      start_date,
      end_date,
      usage_limit,
      usage_per_customer = 1,
      applicable_to = 'all',
      applicable_products = [],
      applicable_categories = [],
      applicable_customers = [],
      applicable_branches = [],
      stackable = false,
      priority = 0,
      is_active = true
    } = req.body;

    // Validate required fields
    if (!promotion_code || !promotion_name || !promotion_type || !start_date || !end_date) {
      return res.status(400).json({
        message: 'Missing required fields: promotion_code, promotion_name, promotion_type, start_date, end_date'
      });
    }

    // Validate dates
    const dateValidation = validatePromotionDates(start_date, end_date);
    if (!dateValidation.valid) {
      return res.status(400).json({ message: dateValidation.message });
    }

    // Validate promotion type specific fields
    if (promotion_type === 'percentage' && !discount_percentage) {
      return res.status(400).json({ message: 'discount_percentage is required for percentage type' });
    }

    if (promotion_type === 'fixed_amount' && !discount_amount) {
      return res.status(400).json({ message: 'discount_amount is required for fixed_amount type' });
    }

    if (promotion_type === 'bogo' && (!buy_quantity || !get_quantity)) {
      return res.status(400).json({ message: 'buy_quantity and get_quantity are required for BOGO type' });
    }

    if (promotion_type === 'bulk_discount' && (!min_quantity || !discount_percentage)) {
      return res.status(400).json({ message: 'min_quantity and discount_percentage are required for bulk_discount type' });
    }

    const result = await query(`
      INSERT INTO promotions (
        promotion_code, promotion_name, description, promotion_type,
        discount_percentage, discount_amount, buy_quantity, get_quantity,
        min_purchase_amount, min_quantity, max_discount_amount,
        start_date, end_date, usage_limit, usage_per_customer,
        applicable_to, applicable_products, applicable_categories,
        applicable_customers, applicable_branches, stackable, priority,
        is_active, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $23, $24
      ) RETURNING *
    `, [
      promotion_code, promotion_name, description, promotion_type,
      discount_percentage, discount_amount, buy_quantity, get_quantity,
      min_purchase_amount, min_quantity, max_discount_amount,
      start_date, end_date, usage_limit, usage_per_customer,
      applicable_to, JSON.stringify(applicable_products), JSON.stringify(applicable_categories),
      JSON.stringify(applicable_customers), JSON.stringify(applicable_branches),
      stackable, priority, is_active, req.user?.id
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') { // Unique violation
      return res.status(400).json({ message: 'Promotion code already exists' });
    }
    console.error('Error creating promotion:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update promotion
 * @route PUT /api/promotions/:id
 */
const updatePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate dates if provided
    if (updates.start_date || updates.end_date) {
      const currentPromo = await query('SELECT start_date, end_date FROM promotions WHERE id = $1', [id]);
      if (currentPromo.rows.length === 0) {
        return res.status(404).json({ message: 'Promotion not found' });
      }

      const start = updates.start_date || currentPromo.rows[0].start_date;
      const end = updates.end_date || currentPromo.rows[0].end_date;

      const dateValidation = validatePromotionDates(start, end);
      if (!dateValidation.valid) {
        return res.status(400).json({ message: dateValidation.message });
      }
    }

    const updateFields = [];
    const values = [];
    let paramCounter = 1;

    const allowedFields = [
      'promotion_name', 'description', 'promotion_type', 'discount_percentage',
      'discount_amount', 'buy_quantity', 'get_quantity', 'min_purchase_amount',
      'min_quantity', 'max_discount_amount', 'start_date', 'end_date',
      'usage_limit', 'usage_per_customer', 'applicable_to', 'applicable_products',
      'applicable_categories', 'applicable_customers', 'applicable_branches',
      'stackable', 'priority', 'is_active'
    ];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${paramCounter}`);
        if (['applicable_products', 'applicable_categories', 'applicable_customers', 'applicable_branches'].includes(key)) {
          values.push(JSON.stringify(value));
        } else {
          values.push(value);
        }
        paramCounter++;
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    values.push(id);
    const updateQuery = `
      UPDATE promotions
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCounter}
      RETURNING *
    `;

    const result = await query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Promotion not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating promotion:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete promotion
 * @route DELETE /api/promotions/:id
 */
const deletePromotion = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if promotion has been used
    const usageCheck = await query(
      'SELECT COUNT(*) as count FROM promotion_usage WHERE promotion_id = $1',
      [id]
    );

    if (parseInt(usageCheck.rows[0].count) > 0) {
      return res.status(400).json({
        message: 'Cannot delete promotion that has been used. Consider deactivating instead.'
      });
    }

    const result = await query(
      'DELETE FROM promotions WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Promotion not found' });
    }

    res.json({ message: 'Promotion deleted successfully' });
  } catch (err) {
    console.error('Error deleting promotion:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Toggle promotion active status
 * @route PATCH /api/promotions/:id/toggle
 */
const togglePromotionStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      UPDATE promotions
      SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Promotion not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error toggling promotion status:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================================
// PROMOTION VALIDATION & APPLICATION
// ============================================================================

/**
 * Validate promotion code and check eligibility
 * @route POST /api/promotions/validate
 */
const validatePromotionCode = async (req, res) => {
  try {
    const {
      promotion_code,
      customer_id,
      subtotal,
      quantity = 1,
      product_ids = [],
      category_ids = [],
      branch_id
    } = req.body;

    if (!promotion_code) {
      return res.status(400).json({ message: 'Promotion code is required' });
    }

    // Get promotion
    const promoResult = await query(
      'SELECT * FROM promotions WHERE promotion_code = $1',
      [promotion_code]
    );

    if (promoResult.rows.length === 0) {
      return res.status(404).json({
        valid: false,
        message: 'Invalid promotion code'
      });
    }

    const promotion = promoResult.rows[0];

    // Check if promotion is active
    if (!isPromotionActive(promotion)) {
      let reason = 'Promotion is not active';
      const now = new Date();
      const start = new Date(promotion.start_date);
      const end = new Date(promotion.end_date);

      if (now < start) {
        reason = 'Promotion has not started yet';
      } else if (now > end) {
        reason = 'Promotion has expired';
      } else if (!promotion.is_active) {
        reason = 'Promotion is currently disabled';
      } else if (promotion.usage_limit && promotion.current_usage_count >= promotion.usage_limit) {
        reason = 'Promotion usage limit reached';
      }

      return res.json({
        valid: false,
        message: reason
      });
    }

    // Check minimum purchase amount
    if (promotion.min_purchase_amount && subtotal < promotion.min_purchase_amount) {
      return res.json({
        valid: false,
        message: `Minimum purchase amount of ${promotion.min_purchase_amount} required`
      });
    }

    // Check minimum quantity
    if (promotion.min_quantity && quantity < promotion.min_quantity) {
      return res.json({
        valid: false,
        message: `Minimum quantity of ${promotion.min_quantity} required`
      });
    }

    // Check usage per customer
    if (customer_id && promotion.usage_per_customer) {
      const usageResult = await query(
        'SELECT COUNT(*) as count FROM promotion_usage WHERE promotion_id = $1 AND customer_id = $2',
        [promotion.id, customer_id]
      );

      if (parseInt(usageResult.rows[0].count) >= promotion.usage_per_customer) {
        return res.json({
          valid: false,
          message: 'You have already used this promotion'
        });
      }
    }

    // Check applicability
    if (promotion.applicable_to === 'products') {
      const applicableProducts = JSON.parse(promotion.applicable_products || '[]');
      const hasApplicableProduct = product_ids.some(id => applicableProducts.includes(id));

      if (!hasApplicableProduct) {
        return res.json({
          valid: false,
          message: 'This promotion is not applicable to selected products'
        });
      }
    }

    if (promotion.applicable_to === 'categories') {
      const applicableCategories = JSON.parse(promotion.applicable_categories || '[]');
      const hasApplicableCategory = category_ids.some(id => applicableCategories.includes(id));

      if (!hasApplicableCategory) {
        return res.json({
          valid: false,
          message: 'This promotion is not applicable to selected product categories'
        });
      }
    }

    if (promotion.applicable_to === 'customers') {
      const applicableCustomers = JSON.parse(promotion.applicable_customers || '[]');
      if (!applicableCustomers.includes(customer_id)) {
        return res.json({
          valid: false,
          message: 'This promotion is not available for your account'
        });
      }
    }

    if (promotion.applicable_to === 'branches') {
      const applicableBranches = JSON.parse(promotion.applicable_branches || '[]');
      if (!applicableBranches.includes(branch_id)) {
        return res.json({
          valid: false,
          message: 'This promotion is not available at this branch'
        });
      }
    }

    // Calculate discount
    const discount = calculateDiscount(promotion, subtotal, quantity);

    res.json({
      valid: true,
      promotion: promotion,
      discount: discount,
      final_amount: subtotal - discount,
      message: 'Promotion is valid'
    });
  } catch (err) {
    console.error('Error validating promotion:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Apply promotion to a sale (used internally by sales controller)
 * @route POST /api/promotions/apply
 */
const applyPromotion = async (req, res) => {
  try {
    const {
      promotion_id,
      sale_id,
      customer_id,
      discount_applied
    } = req.body;

    if (!promotion_id || !discount_applied) {
      return res.status(400).json({ message: 'promotion_id and discount_applied are required' });
    }

    // Record promotion usage
    await query(`
      INSERT INTO promotion_usage (promotion_id, sale_id, customer_id, discount_applied)
      VALUES ($1, $2, $3, $4)
    `, [promotion_id, sale_id, customer_id, discount_applied]);

    // Update promotion usage count
    await query(`
      UPDATE promotions
      SET current_usage_count = current_usage_count + 1
      WHERE id = $1
    `, [promotion_id]);

    res.json({ message: 'Promotion applied successfully' });
  } catch (err) {
    console.error('Error applying promotion:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================================
// PROMOTION ANALYTICS
// ============================================================================

/**
 * Get promotion statistics
 * @route GET /api/promotions/statistics
 */
const getPromotionStatistics = async (req, res) => {
  try {
    const stats = await query(`
      SELECT
        COUNT(*) as total_promotions,
        COUNT(*) FILTER (WHERE is_active = TRUE AND start_date <= CURRENT_TIMESTAMP AND end_date >= CURRENT_TIMESTAMP) as active_promotions,
        COUNT(*) FILTER (WHERE start_date > CURRENT_TIMESTAMP) as upcoming_promotions,
        COUNT(*) FILTER (WHERE end_date < CURRENT_TIMESTAMP) as expired_promotions,
        COUNT(*) FILTER (WHERE promotion_type = 'percentage') as percentage_promotions,
        COUNT(*) FILTER (WHERE promotion_type = 'fixed_amount') as fixed_amount_promotions,
        COUNT(*) FILTER (WHERE promotion_type = 'bogo') as bogo_promotions,
        COUNT(*) FILTER (WHERE promotion_type = 'bulk_discount') as bulk_discount_promotions,
        COALESCE(SUM(current_usage_count), 0) as total_usage_count
      FROM promotions
    `);

    const usageStats = await query(`
      SELECT
        COALESCE(SUM(discount_applied), 0) as total_discount_given,
        COALESCE(AVG(discount_applied), 0) as average_discount,
        COUNT(*) as total_redemptions
      FROM promotion_usage
    `);

    res.json({
      ...stats.rows[0],
      ...usageStats.rows[0]
    });
  } catch (err) {
    console.error('Error fetching promotion statistics:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get promotion performance report
 * @route GET /api/promotions/:id/performance
 */
const getPromotionPerformance = async (req, res) => {
  try {
    const { id } = req.params;

    const performance = await query(`
      SELECT
        p.*,
        COUNT(pu.id) as total_uses,
        COUNT(DISTINCT pu.customer_id) as unique_customers,
        COALESCE(SUM(pu.discount_applied), 0) as total_discount_given,
        COALESCE(AVG(pu.discount_applied), 0) as average_discount_per_use,
        (SELECT COUNT(*) FROM sales WHERE promotion_id = p.id) as total_sales
      FROM promotions p
      LEFT JOIN promotion_usage pu ON pu.promotion_id = p.id
      WHERE p.id = $1
      GROUP BY p.id
    `, [id]);

    if (performance.rows.length === 0) {
      return res.status(404).json({ message: 'Promotion not found' });
    }

    res.json(performance.rows[0]);
  } catch (err) {
    console.error('Error fetching promotion performance:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  // CRUD operations
  getAllPromotions,
  getPromotion,
  createPromotion,
  updatePromotion,
  deletePromotion,
  togglePromotionStatus,

  // Validation & Application
  validatePromotionCode,
  applyPromotion,

  // Analytics
  getPromotionStatistics,
  getPromotionPerformance
};
