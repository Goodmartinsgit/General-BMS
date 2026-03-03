const { query } = require('../config/db');

// ============================================================================
// RETURN REASONS MANAGEMENT
// ============================================================================

/**
 * Get all return reasons
 * @route GET /api/returns/reasons
 */
const getReturnReasons = async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM return_reasons
      WHERE is_active = TRUE
      ORDER BY display_order, reason_name
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching return reasons:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================================
// SALES RETURNS OPERATIONS
// ============================================================================

/**
 * Get all returns with filtering
 * @route GET /api/returns
 */
const getAllReturns = async (req, res) => {
  try {
    const {
      status,
      return_type,
      customer_id,
      branch_id,
      from_date,
      to_date,
      search,
      page = 1,
      limit = 50
    } = req.query;

    const conditions = [];
    const params = [];
    let paramCounter = 1;

    if (status) {
      conditions.push(`sr.status = $${paramCounter}`);
      params.push(status);
      paramCounter++;
    }

    if (return_type) {
      conditions.push(`sr.return_type = $${paramCounter}`);
      params.push(return_type);
      paramCounter++;
    }

    if (customer_id) {
      conditions.push(`sr.customer_id = $${paramCounter}`);
      params.push(customer_id);
      paramCounter++;
    }

    if (branch_id) {
      conditions.push(`sr.branch_id = $${paramCounter}`);
      params.push(branch_id);
      paramCounter++;
    }

    if (from_date) {
      conditions.push(`sr.return_date >= $${paramCounter}`);
      params.push(from_date);
      paramCounter++;
    }

    if (to_date) {
      conditions.push(`sr.return_date <= $${paramCounter}`);
      params.push(to_date);
      paramCounter++;
    }

    if (search) {
      conditions.push(`(sr.return_number ILIKE $${paramCounter} OR c.customer_name ILIKE $${paramCounter})`);
      params.push(`%${search}%`);
      paramCounter++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const returnsQuery = `
      SELECT sr.*,
        c.customer_name,
        c.phone_number as customer_phone,
        b.branch_name,
        s.sale_number as original_sale_number,
        rr.reason_name,
        u1.full_name as processed_by_name,
        u2.full_name as approved_by_name,
        (SELECT COUNT(*) FROM sales_return_items WHERE return_id = sr.id) as item_count
      FROM sales_returns sr
      LEFT JOIN customers c ON c.id = sr.customer_id
      LEFT JOIN branches b ON b.id = sr.branch_id
      LEFT JOIN sales s ON s.id = sr.original_sale_id
      LEFT JOIN return_reasons rr ON rr.id = sr.reason_id
      LEFT JOIN users u1 ON u1.id = sr.processed_by
      LEFT JOIN users u2 ON u2.id = sr.approved_by
      ${whereClause}
      ORDER BY sr.created_at DESC
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM sales_returns sr
      LEFT JOIN customers c ON c.id = sr.customer_id
      ${whereClause}
    `;

    const [returnsResult, countResult] = await Promise.all([
      query(returnsQuery, [...params, limit, offset]),
      query(countQuery, params)
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      returns: returnsResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });
  } catch (err) {
    console.error('Error fetching returns:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get single return with items
 * @route GET /api/returns/:id
 */
const getReturn = async (req, res) => {
  try {
    const { id } = req.params;

    const returnResult = await query(`
      SELECT sr.*,
        c.customer_name,
        c.customer_code,
        c.phone_number as customer_phone,
        c.email as customer_email,
        b.branch_name,
        s.sale_number as original_sale_number,
        s.sale_date as original_sale_date,
        rr.reason_name,
        rr.reason_code,
        u1.full_name as processed_by_name,
        u2.full_name as approved_by_name
      FROM sales_returns sr
      LEFT JOIN customers c ON c.id = sr.customer_id
      LEFT JOIN branches b ON b.id = sr.branch_id
      LEFT JOIN sales s ON s.id = sr.original_sale_id
      LEFT JOIN return_reasons rr ON rr.id = sr.reason_id
      LEFT JOIN users u1 ON u1.id = sr.processed_by
      LEFT JOIN users u2 ON u2.id = sr.approved_by
      WHERE sr.id = $1
    `, [id]);

    if (returnResult.rows.length === 0) {
      return res.status(404).json({ message: 'Return not found' });
    }

    const itemsResult = await query(`
      SELECT sri.*,
        p.product_name,
        p.product_code,
        pv.sku,
        pv.variant_name
      FROM sales_return_items sri
      LEFT JOIN products p ON p.id = sri.product_id
      LEFT JOIN product_variants pv ON pv.id = sri.variant_id
      WHERE sri.return_id = $1
    `, [id]);

    const returnData = returnResult.rows[0];
    returnData.items = itemsResult.rows;

    res.json(returnData);
  } catch (err) {
    console.error('Error fetching return:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Create return request
 * @route POST /api/returns
 */
const createReturn = async (req, res) => {
  try {
    const {
      original_sale_id,
      customer_id,
      branch_id,
      return_type = 'refund', // refund, exchange, store_credit
      reason_id,
      reason_notes,
      items, // Array of {sale_item_id, product_id, variant_id, quantity_returned, return_condition, restock}
      restocking_fee = 0,
      notes,
      attachments = []
    } = req.body;

    // Validate required fields
    if (!original_sale_id || !items || items.length === 0) {
      return res.status(400).json({ message: 'original_sale_id and items are required' });
    }

    await query('BEGIN');

    try {
      // Get original sale details
      const saleResult = await query(
        'SELECT * FROM sales WHERE id = $1',
        [original_sale_id]
      );

      if (saleResult.rows.length === 0) {
        throw new Error('Original sale not found');
      }

      const sale = saleResult.rows[0];

      // Calculate return amounts
      let subtotal = 0;
      let tax_amount = 0;

      for (const item of items) {
        // Get sale item details
        const saleItemResult = await query(
          'SELECT * FROM sale_items WHERE id = $1',
          [item.sale_item_id]
        );

        if (saleItemResult.rows.length === 0) {
          throw new Error(`Sale item ${item.sale_item_id} not found`);
        }

        const saleItem = saleItemResult.rows[0];
        const return_amount = (saleItem.unit_price * item.quantity_returned) - (saleItem.discount_amount || 0);
        const item_tax = (saleItem.tax_amount / saleItem.quantity) * item.quantity_returned;

        subtotal += return_amount;
        tax_amount += item_tax;
      }

      const refund_amount = (subtotal + tax_amount) - restocking_fee;
      const store_credit_amount = return_type === 'store_credit' ? refund_amount : 0;

      // Create return (return number is auto-generated by trigger)
      const returnResult = await query(`
        INSERT INTO sales_returns (
          original_sale_id, customer_id, branch_id, return_type,
          reason_id, reason_notes, subtotal, tax_amount, restocking_fee,
          refund_amount, store_credit_amount, status, processed_by,
          notes, attachments
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', $12, $13, $14)
        RETURNING *
      `, [
        original_sale_id, customer_id, branch_id, return_type,
        reason_id, reason_notes, subtotal, tax_amount, restocking_fee,
        refund_amount, store_credit_amount, req.user?.id,
        notes, JSON.stringify(attachments)
      ]);

      const returnRecord = returnResult.rows[0];

      // Add return items
      for (const item of items) {
        // Get sale item details
        const saleItemResult = await query(
          'SELECT * FROM sale_items WHERE id = $1',
          [item.sale_item_id]
        );

        const saleItem = saleItemResult.rows[0];
        const unit_refund = (saleItem.unit_price - (saleItem.discount_amount / saleItem.quantity || 0));
        const item_tax = (saleItem.tax_amount / saleItem.quantity) * item.quantity_returned;
        const total_refund = (unit_refund * item.quantity_returned) + item_tax;

        await query(`
          INSERT INTO sales_return_items (
            return_id, sale_item_id, product_id, variant_id, product_name,
            quantity_returned, return_condition, restock, unit_price,
            tax_amount, refund_amount, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          returnRecord.id,
          item.sale_item_id,
          item.product_id,
          item.variant_id || null,
          saleItem.product_name,
          item.quantity_returned,
          item.return_condition || 'new',
          item.restock !== false, // Default to true
          unit_refund,
          item_tax,
          total_refund,
          item.notes || null
        ]);
      }

      await query('COMMIT');

      // Return complete return record
      const completeReturn = await getReturnById(returnRecord.id);
      res.status(201).json(completeReturn);
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (err) {
    console.error('Error creating return:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Helper function to get return by ID
 */
const getReturnById = async (id) => {
  const returnResult = await query(`
    SELECT sr.*, c.customer_name, b.branch_name, s.sale_number
    FROM sales_returns sr
    LEFT JOIN customers c ON c.id = sr.customer_id
    LEFT JOIN branches b ON b.id = sr.branch_id
    LEFT JOIN sales s ON s.id = sr.original_sale_id
    WHERE sr.id = $1
  `, [id]);

  const itemsResult = await query(`
    SELECT sri.*, p.product_name, pv.sku
    FROM sales_return_items sri
    LEFT JOIN products p ON p.id = sri.product_id
    LEFT JOIN product_variants pv ON pv.id = sri.variant_id
    WHERE sri.return_id = $1
  `, [id]);

  const returnData = returnResult.rows[0];
  returnData.items = itemsResult.rows;

  return returnData;
};

/**
 * Approve return
 * @route POST /api/returns/:id/approve
 */
const approveReturn = async (req, res) => {
  try {
    const { id } = req.params;

    await query('BEGIN');

    try {
      // Get return details
      const returnResult = await query(
        'SELECT * FROM sales_returns WHERE id = $1 AND status = $2',
        [id, 'pending']
      );

      if (returnResult.rows.length === 0) {
        throw new Error('Return not found or already processed');
      }

      const returnRecord = returnResult.rows[0];

      // Get return items
      const itemsResult = await query(
        'SELECT * FROM sales_return_items WHERE return_id = $1',
        [id]
      );

      // Process restocking for each item
      for (const item of itemsResult.rows) {
        if (item.restock && ['new', 'used'].includes(item.return_condition)) {
          // Restock the item
          if (item.variant_id) {
            await query(`
              UPDATE variant_inventory
              SET quantity_on_hand = quantity_on_hand + $1
              WHERE variant_id = $2 AND branch_id = $3
            `, [item.quantity_returned, item.variant_id, returnRecord.branch_id]);
          } else {
            await query(`
              UPDATE inventory
              SET quantity_on_hand = quantity_on_hand + $1
              WHERE product_id = $2 AND branch_id = $3
            `, [item.quantity_returned, item.product_id, returnRecord.branch_id]);
          }

          // Create stock movement
          await query(`
            INSERT INTO stock_movements (
              product_id, branch_id, movement_type, quantity,
              reference_type, reference_id, notes, performed_by
            ) VALUES ($1, $2, 'return', $3, 'sales_return', $4, $5, $6)
          `, [
            item.product_id,
            returnRecord.branch_id,
            item.quantity_returned,
            id,
            `Restocked from return ${returnRecord.return_number}`,
            req.user?.id
          ]);
        }
      }

      // Update customer store credit if applicable
      if (returnRecord.return_type === 'store_credit' && returnRecord.customer_id) {
        await query(`
          UPDATE customers
          SET store_credit_balance = store_credit_balance + $1,
              total_returns = total_returns + $2
          WHERE id = $3
        `, [returnRecord.store_credit_amount, returnRecord.refund_amount, returnRecord.customer_id]);
      }

      // Update customer stats
      if (returnRecord.customer_id) {
        await query(`
          UPDATE customers
          SET total_returns = total_returns + $1
          WHERE id = $2
        `, [returnRecord.refund_amount, returnRecord.customer_id]);
      }

      // Update return status
      await query(`
        UPDATE sales_returns
        SET status = 'approved',
            approved_by = $1,
            approved_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [req.user?.id, id]);

      await query('COMMIT');

      res.json({ message: 'Return approved successfully' });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (err) {
    console.error('Error approving return:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Complete return (process refund)
 * @route POST /api/returns/:id/complete
 */
const completeReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_method, payment_reference } = req.body;

    const result = await query(`
      UPDATE sales_returns
      SET status = 'completed',
          payment_method = $1,
          payment_reference = $2,
          completed_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND status = 'approved'
      RETURNING *
    `, [payment_method, payment_reference, id]);

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: 'Return not found or not in approved status'
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error completing return:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Reject return
 * @route POST /api/returns/:id/reject
 */
const rejectReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;

    const result = await query(`
      UPDATE sales_returns
      SET status = 'rejected',
          notes = CONCAT(COALESCE(notes, ''), '\nRejection reason: ', $1)
      WHERE id = $2 AND status = 'pending'
      RETURNING *
    `, [rejection_reason, id]);

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: 'Return not found or already processed'
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error rejecting return:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================================
// PRODUCT EXCHANGES
// ============================================================================

/**
 * Create product exchange
 * @route POST /api/returns/:id/exchange
 */
const createExchange = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      exchange_items, // Array of {returned_product_id, returned_variant_id, returned_quantity, new_product_id, new_variant_id, new_quantity, new_price}
      payment_method,
      notes
    } = req.body;

    if (!exchange_items || exchange_items.length === 0) {
      return res.status(400).json({ message: 'exchange_items are required' });
    }

    await query('BEGIN');

    try {
      // Get return details
      const returnResult = await query(
        'SELECT * FROM sales_returns WHERE id = $1 AND return_type = $2',
        [id, 'exchange']
      );

      if (returnResult.rows.length === 0) {
        throw new Error('Return not found or not an exchange type');
      }

      const returnRecord = returnResult.rows[0];

      // Calculate price difference
      let price_difference = 0;
      for (const item of exchange_items) {
        const old_value = item.returned_quantity * (item.returned_price || 0);
        const new_value = item.new_quantity * item.new_price;
        price_difference += (new_value - old_value);
      }

      // Create exchange record (exchange number is auto-generated by trigger)
      const exchangeResult = await query(`
        INSERT INTO product_exchanges (
          return_id, customer_id, branch_id, price_difference,
          payment_method, status, processed_by, notes
        ) VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7)
        RETURNING *
      `, [
        id,
        returnRecord.customer_id,
        returnRecord.branch_id,
        price_difference,
        payment_method,
        req.user?.id,
        notes
      ]);

      const exchange = exchangeResult.rows[0];

      // Add exchange items
      for (const item of exchange_items) {
        await query(`
          INSERT INTO exchange_items (
            exchange_id, returned_product_id, returned_variant_id, returned_quantity,
            new_product_id, new_variant_id, new_quantity, price_difference
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          exchange.id,
          item.returned_product_id,
          item.returned_variant_id || null,
          item.returned_quantity,
          item.new_product_id,
          item.new_variant_id || null,
          item.new_quantity,
          (item.new_quantity * item.new_price) - (item.returned_quantity * (item.returned_price || 0))
        ]);
      }

      await query('COMMIT');

      res.status(201).json(exchange);
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (err) {
    console.error('Error creating exchange:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================================
// RETURNS ANALYTICS
// ============================================================================

/**
 * Get returns statistics
 * @route GET /api/returns/statistics
 */
const getReturnStatistics = async (req, res) => {
  try {
    const { from_date, to_date, branch_id } = req.query;

    const conditions = [];
    const params = [];
    let paramCounter = 1;

    if (from_date) {
      conditions.push(`return_date >= $${paramCounter}`);
      params.push(from_date);
      paramCounter++;
    }

    if (to_date) {
      conditions.push(`return_date <= $${paramCounter}`);
      params.push(to_date);
      paramCounter++;
    }

    if (branch_id) {
      conditions.push(`branch_id = $${paramCounter}`);
      params.push(branch_id);
      paramCounter++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const stats = await query(`
      SELECT
        COUNT(*) as total_returns,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_returns,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_returns,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_returns,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_returns,
        COUNT(*) FILTER (WHERE return_type = 'refund') as refund_returns,
        COUNT(*) FILTER (WHERE return_type = 'exchange') as exchange_returns,
        COUNT(*) FILTER (WHERE return_type = 'store_credit') as store_credit_returns,
        COALESCE(SUM(refund_amount), 0) as total_refunded,
        COALESCE(SUM(store_credit_amount), 0) as total_store_credit,
        COALESCE(AVG(refund_amount), 0) as average_refund
      FROM sales_returns
      ${whereClause}
    `, params);

    res.json(stats.rows[0]);
  } catch (err) {
    console.error('Error fetching return statistics:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  // Return Reasons
  getReturnReasons,

  // Returns CRUD
  getAllReturns,
  getReturn,
  createReturn,
  approveReturn,
  completeReturn,
  rejectReturn,

  // Exchanges
  createExchange,

  // Analytics
  getReturnStatistics
};
