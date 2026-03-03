const { query } = require('../config/db');

// ============================================================================
// PURCHASE ORDER CRUD OPERATIONS
// ============================================================================

/**
 * Get all purchase orders with filtering
 * @route GET /api/purchase-orders
 */
const getAllPurchaseOrders = async (req, res) => {
  try {
    const {
      status,
      supplier_id,
      branch_id,
      payment_status,
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
      conditions.push(`po.status = $${paramCounter}`);
      params.push(status);
      paramCounter++;
    }

    if (supplier_id) {
      conditions.push(`po.supplier_id = $${paramCounter}`);
      params.push(supplier_id);
      paramCounter++;
    }

    if (branch_id) {
      conditions.push(`po.branch_id = $${paramCounter}`);
      params.push(branch_id);
      paramCounter++;
    }

    if (payment_status) {
      conditions.push(`po.payment_status = $${paramCounter}`);
      params.push(payment_status);
      paramCounter++;
    }

    if (from_date) {
      conditions.push(`po.po_date >= $${paramCounter}`);
      params.push(from_date);
      paramCounter++;
    }

    if (to_date) {
      conditions.push(`po.po_date <= $${paramCounter}`);
      params.push(to_date);
      paramCounter++;
    }

    if (search) {
      conditions.push(`(po.po_number ILIKE $${paramCounter} OR s.supplier_name ILIKE $${paramCounter})`);
      params.push(`%${search}%`);
      paramCounter++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const posQuery = `
      SELECT po.*,
        s.supplier_name,
        s.supplier_code,
        b.branch_name,
        (SELECT COUNT(*) FROM purchase_order_items WHERE po_id = po.id) as item_count,
        (SELECT COALESCE(SUM(quantity_ordered), 0) FROM purchase_order_items WHERE po_id = po.id) as total_quantity,
        (SELECT COALESCE(SUM(quantity_received), 0) FROM purchase_order_items WHERE po_id = po.id) as total_received
      FROM purchase_orders po
      LEFT JOIN suppliers s ON s.id = po.supplier_id
      LEFT JOIN branches b ON b.id = po.branch_id
      ${whereClause}
      ORDER BY po.created_at DESC
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM purchase_orders po
      LEFT JOIN suppliers s ON s.id = po.supplier_id
      ${whereClause}
    `;

    const [posResult, countResult] = await Promise.all([
      query(posQuery, [...params, limit, offset]),
      query(countQuery, params)
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      purchase_orders: posResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });
  } catch (err) {
    console.error('Error fetching purchase orders:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get single purchase order with items
 * @route GET /api/purchase-orders/:id
 */
const getPurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const poResult = await query(`
      SELECT po.*,
        s.supplier_name,
        s.supplier_code,
        s.email as supplier_email,
        s.phone_number as supplier_phone,
        b.branch_name,
        b.branch_code,
        u1.full_name as created_by_name,
        u2.full_name as approved_by_name
      FROM purchase_orders po
      LEFT JOIN suppliers s ON s.id = po.supplier_id
      LEFT JOIN branches b ON b.id = po.branch_id
      LEFT JOIN users u1 ON u1.id = po.created_by
      LEFT JOIN users u2 ON u2.id = po.approved_by
      WHERE po.id = $1
    `, [id]);

    if (poResult.rows.length === 0) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    const itemsResult = await query(`
      SELECT poi.*,
        p.product_name,
        p.product_code,
        pv.sku,
        pv.variant_name
      FROM purchase_order_items poi
      LEFT JOIN products p ON p.id = poi.product_id
      LEFT JOIN product_variants pv ON pv.id = poi.variant_id
      WHERE poi.po_id = $1
      ORDER BY poi.id
    `, [id]);

    const po = poResult.rows[0];
    po.items = itemsResult.rows;

    res.json(po);
  } catch (err) {
    console.error('Error fetching purchase order:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Create new purchase order
 * @route POST /api/purchase-orders
 */
const createPurchaseOrder = async (req, res) => {
  try {
    const {
      supplier_id,
      branch_id,
      po_date = new Date(),
      expected_delivery_date,
      payment_terms,
      delivery_address,
      notes,
      internal_notes,
      items // Array of {product_id, variant_id, quantity_ordered, unit_price}
    } = req.body;

    // Validate required fields
    if (!supplier_id || !items || items.length === 0) {
      return res.status(400).json({ message: 'supplier_id and items are required' });
    }

    await query('BEGIN');

    try {
      // Calculate totals
      let subtotal = 0;
      let tax_amount = 0;

      for (const item of items) {
        const line_total = item.quantity_ordered * item.unit_price;
        subtotal += line_total;

        // Get tax rate from product
        const productResult = await query(
          'SELECT tax_rate FROM products WHERE id = $1',
          [item.product_id]
        );

        if (productResult.rows.length > 0) {
          const tax_rate = productResult.rows[0].tax_rate || 0;
          tax_amount += (line_total * tax_rate) / 100;
        }
      }

      const total_amount = subtotal + tax_amount;

      // Create PO (PO number is auto-generated by trigger)
      const poResult = await query(`
        INSERT INTO purchase_orders (
          supplier_id, branch_id, po_date, expected_delivery_date,
          subtotal, tax_amount, total_amount, payment_terms,
          delivery_address, notes, internal_notes, created_by, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'draft')
        RETURNING *
      `, [
        supplier_id, branch_id, po_date, expected_delivery_date,
        subtotal, tax_amount, total_amount, payment_terms,
        delivery_address, notes, internal_notes, req.user?.id
      ]);

      const po = poResult.rows[0];

      // Add items
      for (const item of items) {
        const line_total = item.quantity_ordered * item.unit_price;
        const item_tax = item.tax_amount || 0;

        await query(`
          INSERT INTO purchase_order_items (
            po_id, product_id, variant_id, product_name, quantity_ordered,
            unit_price, tax_amount, line_total, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          po.id,
          item.product_id,
          item.variant_id || null,
          item.product_name || null,
          item.quantity_ordered,
          item.unit_price,
          item_tax,
          line_total,
          item.notes || null
        ]);
      }

      await query('COMMIT');

      // Return complete PO with items
      const completePO = await getPurchaseOrderById(po.id);
      res.status(201).json(completePO);
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (err) {
    console.error('Error creating purchase order:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Helper function to get PO by ID
 */
const getPurchaseOrderById = async (id) => {
  const poResult = await query(`
    SELECT po.*, s.supplier_name, b.branch_name
    FROM purchase_orders po
    LEFT JOIN suppliers s ON s.id = po.supplier_id
    LEFT JOIN branches b ON b.id = po.branch_id
    WHERE po.id = $1
  `, [id]);

  const itemsResult = await query(`
    SELECT poi.*, p.product_name, pv.sku
    FROM purchase_order_items poi
    LEFT JOIN products p ON p.id = poi.product_id
    LEFT JOIN product_variants pv ON pv.id = poi.variant_id
    WHERE poi.po_id = $1
  `, [id]);

  const po = poResult.rows[0];
  po.items = itemsResult.rows;

  return po;
};

/**
 * Update purchase order
 * @route PUT /api/purchase-orders/:id
 */
const updatePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if PO can be updated
    const currentPO = await query('SELECT status FROM purchase_orders WHERE id = $1', [id]);
    if (currentPO.rows.length === 0) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    if (['received', 'cancelled'].includes(currentPO.rows[0].status)) {
      return res.status(400).json({
        message: `Cannot update purchase order with status: ${currentPO.rows[0].status}`
      });
    }

    const updateFields = [];
    const values = [];
    let paramCounter = 1;

    const allowedFields = [
      'supplier_id', 'branch_id', 'expected_delivery_date', 'payment_terms',
      'delivery_address', 'notes', 'internal_notes', 'shipping_cost',
      'other_charges', 'discount_amount'
    ];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${paramCounter}`);
        values.push(value);
        paramCounter++;
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    values.push(id);
    const updateQuery = `
      UPDATE purchase_orders
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCounter}
      RETURNING *
    `;

    const result = await query(updateQuery, values);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating purchase order:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Approve purchase order
 * @route POST /api/purchase-orders/:id/approve
 */
const approvePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      UPDATE purchase_orders
      SET status = 'confirmed',
          approved_by = $1,
          approved_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND status = 'draft'
      RETURNING *
    `, [req.user?.id, id]);

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: 'Purchase order not found or cannot be approved (must be in draft status)'
      });
    }

    // Update supplier stats
    await query(`
      UPDATE suppliers
      SET total_purchase_orders = total_purchase_orders + 1,
          last_order_date = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [result.rows[0].supplier_id]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error approving purchase order:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Cancel purchase order
 * @route POST /api/purchase-orders/:id/cancel
 */
const cancelPurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellation_reason } = req.body;

    const result = await query(`
      UPDATE purchase_orders
      SET status = 'cancelled',
          cancelled_by = $1,
          cancelled_at = CURRENT_TIMESTAMP,
          cancellation_reason = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND status IN ('draft', 'confirmed')
      RETURNING *
    `, [req.user?.id, cancellation_reason, id]);

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: 'Purchase order not found or cannot be cancelled'
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error cancelling purchase order:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================================
// GOODS RECEIVED NOTES (GRN) OPERATIONS
// ============================================================================

/**
 * Create GRN and receive goods
 * @route POST /api/purchase-orders/:id/receive
 */
const receiveGoods = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      received_items, // Array of {po_item_id, quantity_received, quantity_accepted, quantity_rejected, rejection_reason, batch_number, expiry_date}
      quality_check_status = 'passed',
      notes,
      attachments = []
    } = req.body;

    if (!received_items || received_items.length === 0) {
      return res.status(400).json({ message: 'received_items are required' });
    }

    await query('BEGIN');

    try {
      // Get PO details
      const poResult = await query(
        'SELECT * FROM purchase_orders WHERE id = $1',
        [id]
      );

      if (poResult.rows.length === 0) {
        throw new Error('Purchase order not found');
      }

      const po = poResult.rows[0];

      if (!['confirmed', 'partially_received'].includes(po.status)) {
        throw new Error('Purchase order must be confirmed before receiving');
      }

      // Create GRN (GRN number is auto-generated by trigger)
      const grnResult = await query(`
        INSERT INTO goods_received_notes (
          po_id, supplier_id, branch_id, received_by,
          quality_check_status, notes, attachments
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        id,
        po.supplier_id,
        po.branch_id,
        req.user?.id,
        quality_check_status,
        notes,
        JSON.stringify(attachments)
      ]);

      const grn = grnResult.rows[0];

      // Process each received item
      for (const item of received_items) {
        const { po_item_id, quantity_received, quantity_accepted, quantity_rejected = 0, rejection_reason, batch_number, expiry_date } = item;

        // Get PO item details
        const poItemResult = await query(
          'SELECT * FROM purchase_order_items WHERE id = $1',
          [po_item_id]
        );

        if (poItemResult.rows.length === 0) {
          throw new Error(`PO item ${po_item_id} not found`);
        }

        const poItem = poItemResult.rows[0];

        // Create GRN item
        await query(`
          INSERT INTO grn_items (
            grn_id, po_item_id, product_id, variant_id,
            quantity_received, quantity_accepted, quantity_rejected,
            rejection_reason, batch_number, expiry_date
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          grn.id,
          po_item_id,
          poItem.product_id,
          poItem.variant_id,
          quantity_received,
          quantity_accepted || quantity_received,
          quantity_rejected,
          rejection_reason,
          batch_number,
          expiry_date
        ]);

        // Update PO item received quantity
        await query(`
          UPDATE purchase_order_items
          SET quantity_received = quantity_received + $1
          WHERE id = $2
        `, [quantity_received, po_item_id]);

        // Update inventory for accepted items
        const accepted_qty = quantity_accepted || quantity_received;

        if (poItem.variant_id) {
          // Update variant inventory
          await query(`
            INSERT INTO variant_inventory (variant_id, branch_id, quantity_on_hand)
            VALUES ($1, $2, $3)
            ON CONFLICT (variant_id, branch_id)
            DO UPDATE SET quantity_on_hand = variant_inventory.quantity_on_hand + EXCLUDED.quantity_on_hand
          `, [poItem.variant_id, po.branch_id, accepted_qty]);
        } else {
          // Update product inventory
          await query(`
            INSERT INTO inventory (product_id, branch_id, quantity_on_hand)
            VALUES ($1, $2, $3)
            ON CONFLICT (product_id, branch_id)
            DO UPDATE SET quantity_on_hand = inventory.quantity_on_hand + EXCLUDED.quantity_on_hand
          `, [poItem.product_id, po.branch_id, accepted_qty]);
        }

        // Create stock movement record
        await query(`
          INSERT INTO stock_movements (
            product_id, branch_id, movement_type, quantity,
            reference_type, reference_id, notes, performed_by
          ) VALUES ($1, $2, 'receipt', $3, 'grn', $4, $5, $6)
        `, [
          poItem.product_id,
          po.branch_id,
          accepted_qty,
          grn.id,
          `Received via GRN ${grn.grn_number}`,
          req.user?.id
        ]);

        // If batch tracking is enabled, create batch record
        if (batch_number) {
          await query(`
            INSERT INTO product_batches (
              batch_number, product_id, variant_id, manufacturing_date,
              expiry_date, initial_quantity, current_quantity,
              supplier_id, po_id, grn_id, unit_cost
            ) VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $5, $6, $7, $8, $9)
            ON CONFLICT (batch_number) DO NOTHING
          `, [
            batch_number,
            poItem.product_id,
            poItem.variant_id,
            expiry_date,
            accepted_qty,
            po.supplier_id,
            id,
            grn.id,
            poItem.unit_price
          ]);
        }
      }

      // Check if PO is fully received
      const receivingStatusResult = await query(`
        SELECT
          COALESCE(SUM(quantity_ordered), 0) as total_ordered,
          COALESCE(SUM(quantity_received), 0) as total_received
        FROM purchase_order_items
        WHERE po_id = $1
      `, [id]);

      const { total_ordered, total_received } = receivingStatusResult.rows[0];

      let new_status = 'partially_received';
      if (parseFloat(total_received) >= parseFloat(total_ordered)) {
        new_status = 'received';
      }

      // Update PO status
      await query(`
        UPDATE purchase_orders
        SET status = $1,
            actual_delivery_date = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [new_status, id]);

      // Update supplier stats
      await query(`
        UPDATE suppliers
        SET total_purchase_amount = total_purchase_amount + $1
        WHERE id = $2
      `, [po.total_amount, po.supplier_id]);

      await query('COMMIT');

      res.status(201).json(grn);
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (err) {
    console.error('Error receiving goods:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get GRNs for a purchase order
 * @route GET /api/purchase-orders/:id/grns
 */
const getPurchaseOrderGRNs = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT grn.*,
        u.full_name as received_by_name,
        (SELECT COUNT(*) FROM grn_items WHERE grn_id = grn.id) as item_count,
        (SELECT COALESCE(SUM(quantity_received), 0) FROM grn_items WHERE grn_id = grn.id) as total_received
      FROM goods_received_notes grn
      LEFT JOIN users u ON u.id = grn.received_by
      WHERE grn.po_id = $1
      ORDER BY grn.received_date DESC
    `, [id]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching GRNs:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get GRN details with items
 * @route GET /api/grns/:id
 */
const getGRNDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const grnResult = await query(`
      SELECT grn.*,
        po.po_number,
        s.supplier_name,
        b.branch_name,
        u.full_name as received_by_name
      FROM goods_received_notes grn
      LEFT JOIN purchase_orders po ON po.id = grn.po_id
      LEFT JOIN suppliers s ON s.id = grn.supplier_id
      LEFT JOIN branches b ON b.id = grn.branch_id
      LEFT JOIN users u ON u.id = grn.received_by
      WHERE grn.id = $1
    `, [id]);

    if (grnResult.rows.length === 0) {
      return res.status(404).json({ message: 'GRN not found' });
    }

    const itemsResult = await query(`
      SELECT gi.*,
        p.product_name,
        p.product_code,
        pv.sku,
        poi.quantity_ordered,
        poi.unit_price
      FROM grn_items gi
      LEFT JOIN products p ON p.id = gi.product_id
      LEFT JOIN product_variants pv ON pv.id = gi.variant_id
      LEFT JOIN purchase_order_items poi ON poi.id = gi.po_item_id
      WHERE gi.grn_id = $1
    `, [id]);

    const grn = grnResult.rows[0];
    grn.items = itemsResult.rows;

    res.json(grn);
  } catch (err) {
    console.error('Error fetching GRN details:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================================
// PURCHASE ORDER ANALYTICS
// ============================================================================

/**
 * Get purchase order statistics
 * @route GET /api/purchase-orders/statistics
 */
const getPurchaseOrderStatistics = async (req, res) => {
  try {
    const { supplier_id, branch_id, from_date, to_date } = req.query;

    const conditions = [];
    const params = [];
    let paramCounter = 1;

    if (supplier_id) {
      conditions.push(`supplier_id = $${paramCounter}`);
      params.push(supplier_id);
      paramCounter++;
    }

    if (branch_id) {
      conditions.push(`branch_id = $${paramCounter}`);
      params.push(branch_id);
      paramCounter++;
    }

    if (from_date) {
      conditions.push(`po_date >= $${paramCounter}`);
      params.push(from_date);
      paramCounter++;
    }

    if (to_date) {
      conditions.push(`po_date <= $${paramCounter}`);
      params.push(to_date);
      paramCounter++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const stats = await query(`
      SELECT
        COUNT(*) as total_pos,
        COUNT(*) FILTER (WHERE status = 'draft') as draft_pos,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_pos,
        COUNT(*) FILTER (WHERE status = 'partially_received') as partially_received_pos,
        COUNT(*) FILTER (WHERE status = 'received') as received_pos,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_pos,
        COALESCE(SUM(total_amount), 0) as total_po_value,
        COALESCE(AVG(total_amount), 0) as average_po_value,
        COALESCE(SUM(amount_paid), 0) as total_paid,
        COALESCE(SUM(total_amount - amount_paid), 0) as total_outstanding
      FROM purchase_orders
      ${whereClause}
    `, params);

    res.json(stats.rows[0]);
  } catch (err) {
    console.error('Error fetching PO statistics:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  // PO CRUD
  getAllPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  updatePurchaseOrder,
  approvePurchaseOrder,
  cancelPurchaseOrder,

  // GRN Operations
  receiveGoods,
  getPurchaseOrderGRNs,
  getGRNDetails,

  // Analytics
  getPurchaseOrderStatistics
};
