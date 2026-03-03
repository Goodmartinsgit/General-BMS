const { query } = require('../config/db');

// ============================================================================
// SERIAL NUMBER MANAGEMENT
// ============================================================================

/**
 * Get all serial numbers with filtering
 * @route GET /api/serial-tracking/serial-numbers
 */
const getAllSerialNumbers = async (req, res) => {
  try {
    const {
      status,
      product_id,
      variant_id,
      branch_id,
      supplier_id,
      search,
      warranty_expiring_soon, // true/false
      page = 1,
      limit = 50
    } = req.query;

    const conditions = [];
    const params = [];
    let paramCounter = 1;

    if (status) {
      conditions.push(`sn.status = $${paramCounter}`);
      params.push(status);
      paramCounter++;
    }

    if (product_id) {
      conditions.push(`sn.product_id = $${paramCounter}`);
      params.push(product_id);
      paramCounter++;
    }

    if (variant_id) {
      conditions.push(`sn.variant_id = $${paramCounter}`);
      params.push(variant_id);
      paramCounter++;
    }

    if (branch_id) {
      conditions.push(`sn.branch_id = $${paramCounter}`);
      params.push(branch_id);
      paramCounter++;
    }

    if (supplier_id) {
      conditions.push(`sn.supplier_id = $${paramCounter}`);
      params.push(supplier_id);
      paramCounter++;
    }

    if (search) {
      conditions.push(`sn.serial_number ILIKE $${paramCounter}`);
      params.push(`%${search}%`);
      paramCounter++;
    }

    if (warranty_expiring_soon === 'true') {
      conditions.push(`sn.warranty_expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const serialsQuery = `
      SELECT sn.*,
        p.product_name,
        p.product_code,
        pv.sku,
        pv.variant_name,
        b.branch_name,
        s.supplier_name,
        c.customer_name,
        sa.sale_number
      FROM serial_numbers sn
      LEFT JOIN products p ON p.id = sn.product_id
      LEFT JOIN product_variants pv ON pv.id = sn.variant_id
      LEFT JOIN branches b ON b.id = sn.branch_id
      LEFT JOIN suppliers s ON s.id = sn.supplier_id
      LEFT JOIN customers c ON c.id = sn.customer_id
      LEFT JOIN sales sa ON sa.id = sn.sale_id
      ${whereClause}
      ORDER BY sn.created_at DESC
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM serial_numbers sn
      ${whereClause}
    `;

    const [serialsResult, countResult] = await Promise.all([
      query(serialsQuery, [...params, limit, offset]),
      query(countQuery, params)
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      serial_numbers: serialsResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });
  } catch (err) {
    console.error('Error fetching serial numbers:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get single serial number details
 * @route GET /api/serial-tracking/serial-numbers/:serialNumber
 */
const getSerialNumber = async (req, res) => {
  try {
    const { serialNumber } = req.params;

    const result = await query(`
      SELECT sn.*,
        p.product_name,
        p.product_code,
        pv.sku,
        pv.variant_name,
        b.branch_name,
        s.supplier_name,
        sup.supplier_name as supplier_name,
        c.customer_name,
        c.phone_number as customer_phone,
        sa.sale_number,
        sa.sale_date,
        po.po_number,
        grn.grn_number,
        sr.return_number
      FROM serial_numbers sn
      LEFT JOIN products p ON p.id = sn.product_id
      LEFT JOIN product_variants pv ON pv.id = sn.variant_id
      LEFT JOIN branches b ON b.id = sn.branch_id
      LEFT JOIN suppliers sup ON sup.id = sn.supplier_id
      LEFT JOIN customers c ON c.id = sn.customer_id
      LEFT JOIN sales sa ON sa.id = sn.sale_id
      LEFT JOIN purchase_orders po ON po.id = sn.po_id
      LEFT JOIN goods_received_notes grn ON grn.id = sn.grn_id
      LEFT JOIN sales_returns sr ON sr.id = sn.return_id
      WHERE sn.serial_number = $1
    `, [serialNumber]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Serial number not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching serial number:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Register new serial number
 * @route POST /api/serial-tracking/serial-numbers
 */
const registerSerialNumber = async (req, res) => {
  try {
    const {
      serial_number,
      product_id,
      variant_id,
      batch_number,
      manufacturing_date,
      expiry_date,
      warranty_months,
      branch_id,
      supplier_id,
      po_id,
      grn_id,
      condition = 'new',
      notes
    } = req.body;

    if (!serial_number || !product_id) {
      return res.status(400).json({ message: 'serial_number and product_id are required' });
    }

    // Calculate warranty dates if warranty_months provided
    let warranty_start_date = null;
    let warranty_expiry_date = null;

    if (warranty_months) {
      warranty_start_date = new Date();
      warranty_expiry_date = new Date();
      warranty_expiry_date.setMonth(warranty_expiry_date.getMonth() + warranty_months);
    }

    const result = await query(`
      INSERT INTO serial_numbers (
        serial_number, product_id, variant_id, batch_number,
        manufacturing_date, expiry_date, warranty_months,
        warranty_start_date, warranty_expiry_date, status, condition,
        branch_id, supplier_id, po_id, grn_id, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'in_stock', $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [
      serial_number, product_id, variant_id, batch_number,
      manufacturing_date, expiry_date, warranty_months,
      warranty_start_date, warranty_expiry_date, condition,
      branch_id, supplier_id, po_id, grn_id, notes
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') { // Unique violation
      return res.status(400).json({ message: 'Serial number already exists' });
    }
    console.error('Error registering serial number:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Bulk register serial numbers
 * @route POST /api/serial-tracking/serial-numbers/bulk
 */
const bulkRegisterSerialNumbers = async (req, res) => {
  try {
    const { serial_numbers } = req.body; // Array of serial number objects

    if (!Array.isArray(serial_numbers) || serial_numbers.length === 0) {
      return res.status(400).json({ message: 'serial_numbers array is required' });
    }

    await query('BEGIN');

    try {
      const registered = [];

      for (const sn of serial_numbers) {
        let warranty_start_date = null;
        let warranty_expiry_date = null;

        if (sn.warranty_months) {
          warranty_start_date = new Date();
          warranty_expiry_date = new Date();
          warranty_expiry_date.setMonth(warranty_expiry_date.getMonth() + sn.warranty_months);
        }

        const result = await query(`
          INSERT INTO serial_numbers (
            serial_number, product_id, variant_id, batch_number,
            manufacturing_date, expiry_date, warranty_months,
            warranty_start_date, warranty_expiry_date, status, condition,
            branch_id, supplier_id, po_id, grn_id, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'in_stock', $10, $11, $12, $13, $14, $15)
          ON CONFLICT (serial_number) DO NOTHING
          RETURNING *
        `, [
          sn.serial_number, sn.product_id, sn.variant_id || null, sn.batch_number || null,
          sn.manufacturing_date || null, sn.expiry_date || null, sn.warranty_months || null,
          warranty_start_date, warranty_expiry_date, sn.condition || 'new',
          sn.branch_id || null, sn.supplier_id || null, sn.po_id || null,
          sn.grn_id || null, sn.notes || null
        ]);

        if (result.rows.length > 0) {
          registered.push(result.rows[0]);
        }
      }

      await query('COMMIT');

      res.status(201).json({
        registered_count: registered.length,
        serial_numbers: registered
      });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (err) {
    console.error('Error bulk registering serial numbers:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update serial number (change status, location, etc.)
 * @route PUT /api/serial-tracking/serial-numbers/:serialNumber
 */
const updateSerialNumber = async (req, res) => {
  try {
    const { serialNumber } = req.params;
    const updates = req.body;

    const updateFields = [];
    const values = [];
    let paramCounter = 1;

    const allowedFields = [
      'status', 'condition', 'branch_id', 'notes',
      'warranty_months', 'manufacturing_date', 'expiry_date'
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

    values.push(serialNumber);
    const updateQuery = `
      UPDATE serial_numbers
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE serial_number = $${paramCounter}
      RETURNING *
    `;

    const result = await query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Serial number not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating serial number:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Mark serial number as sold
 * @route POST /api/serial-tracking/serial-numbers/:serialNumber/sell
 */
const markSerialAsSold = async (req, res) => {
  try {
    const { serialNumber } = req.params;
    const { sale_id, sale_item_id, customer_id } = req.body;

    const result = await query(`
      UPDATE serial_numbers
      SET status = 'sold',
          sale_id = $1,
          sale_item_id = $2,
          customer_id = $3,
          sold_date = CURRENT_TIMESTAMP,
          warranty_start_date = CASE
            WHEN warranty_months IS NOT NULL THEN CURRENT_TIMESTAMP
            ELSE warranty_start_date
          END,
          warranty_expiry_date = CASE
            WHEN warranty_months IS NOT NULL THEN CURRENT_TIMESTAMP + (warranty_months || ' months')::INTERVAL
            ELSE warranty_expiry_date
          END,
          updated_at = CURRENT_TIMESTAMP
      WHERE serial_number = $4 AND status = 'in_stock'
      RETURNING *
    `, [sale_id, sale_item_id, customer_id, serialNumber]);

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: 'Serial number not found or not in stock'
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error marking serial as sold:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get warranty expiring soon
 * @route GET /api/serial-tracking/serial-numbers/warranty-expiring
 */
const getWarrantyExpiringSoon = async (req, res) => {
  try {
    const { days = 30, branch_id } = req.query;

    const conditions = ['sn.status = $1'];
    const params = ['sold'];
    let paramCounter = 2;

    conditions.push(`sn.warranty_expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '${parseInt(days)} days'`);

    if (branch_id) {
      conditions.push(`sn.branch_id = $${paramCounter}`);
      params.push(branch_id);
      paramCounter++;
    }

    const result = await query(`
      SELECT sn.*,
        p.product_name,
        pv.variant_name,
        c.customer_name,
        c.phone_number as customer_phone,
        c.email as customer_email
      FROM serial_numbers sn
      LEFT JOIN products p ON p.id = sn.product_id
      LEFT JOIN product_variants pv ON pv.id = sn.variant_id
      LEFT JOIN customers c ON c.id = sn.customer_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY sn.warranty_expiry_date ASC
    `, params);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching warranty expiring soon:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================================
// BATCH MANAGEMENT
// ============================================================================

/**
 * Get all batches with filtering
 * @route GET /api/serial-tracking/batches
 */
const getAllBatches = async (req, res) => {
  try {
    const {
      status,
      product_id,
      variant_id,
      supplier_id,
      expiring_soon, // true/false
      search,
      page = 1,
      limit = 50
    } = req.query;

    const conditions = [];
    const params = [];
    let paramCounter = 1;

    if (status) {
      conditions.push(`pb.status = $${paramCounter}`);
      params.push(status);
      paramCounter++;
    }

    if (product_id) {
      conditions.push(`pb.product_id = $${paramCounter}`);
      params.push(product_id);
      paramCounter++;
    }

    if (variant_id) {
      conditions.push(`pb.variant_id = $${paramCounter}`);
      params.push(variant_id);
      paramCounter++;
    }

    if (supplier_id) {
      conditions.push(`pb.supplier_id = $${paramCounter}`);
      params.push(supplier_id);
      paramCounter++;
    }

    if (search) {
      conditions.push(`pb.batch_number ILIKE $${paramCounter}`);
      params.push(`%${search}%`);
      paramCounter++;
    }

    if (expiring_soon === 'true') {
      conditions.push(`pb.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const batchesQuery = `
      SELECT pb.*,
        p.product_name,
        p.product_code,
        pv.sku,
        pv.variant_name,
        s.supplier_name,
        po.po_number,
        grn.grn_number
      FROM product_batches pb
      LEFT JOIN products p ON p.id = pb.product_id
      LEFT JOIN product_variants pv ON pv.id = pb.variant_id
      LEFT JOIN suppliers s ON s.id = pb.supplier_id
      LEFT JOIN purchase_orders po ON po.id = pb.po_id
      LEFT JOIN goods_received_notes grn ON grn.id = pb.grn_id
      ${whereClause}
      ORDER BY pb.expiry_date ASC, pb.created_at DESC
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM product_batches pb
      ${whereClause}
    `;

    const [batchesResult, countResult] = await Promise.all([
      query(batchesQuery, [...params, limit, offset]),
      query(countQuery, params)
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      batches: batchesResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });
  } catch (err) {
    console.error('Error fetching batches:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get single batch details
 * @route GET /api/serial-tracking/batches/:batchNumber
 */
const getBatch = async (req, res) => {
  try {
    const { batchNumber } = req.params;

    const batchResult = await query(`
      SELECT pb.*,
        p.product_name,
        p.product_code,
        pv.sku,
        pv.variant_name,
        s.supplier_name,
        po.po_number,
        grn.grn_number
      FROM product_batches pb
      LEFT JOIN products p ON p.id = pb.product_id
      LEFT JOIN product_variants pv ON pv.id = pb.variant_id
      LEFT JOIN suppliers s ON s.id = pb.supplier_id
      LEFT JOIN purchase_orders po ON po.id = pb.po_id
      LEFT JOIN goods_received_notes grn ON grn.id = pb.grn_id
      WHERE pb.batch_number = $1
    `, [batchNumber]);

    if (batchResult.rows.length === 0) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    // Get batch movements
    const movementsResult = await query(`
      SELECT *
      FROM batch_movements
      WHERE batch_id = $1
      ORDER BY created_at DESC
    `, [batchResult.rows[0].id]);

    const batch = batchResult.rows[0];
    batch.movements = movementsResult.rows;

    res.json(batch);
  } catch (err) {
    console.error('Error fetching batch:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Create new batch
 * @route POST /api/serial-tracking/batches
 */
const createBatch = async (req, res) => {
  try {
    const {
      batch_number,
      product_id,
      variant_id,
      manufacturing_date,
      expiry_date,
      initial_quantity,
      supplier_id,
      po_id,
      grn_id,
      unit_cost,
      quality_status = 'passed',
      notes
    } = req.body;

    if (!batch_number || !product_id || !initial_quantity) {
      return res.status(400).json({
        message: 'batch_number, product_id, and initial_quantity are required'
      });
    }

    const result = await query(`
      INSERT INTO product_batches (
        batch_number, product_id, variant_id, manufacturing_date, expiry_date,
        initial_quantity, current_quantity, supplier_id, po_id, grn_id,
        unit_cost, quality_status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      batch_number, product_id, variant_id, manufacturing_date, expiry_date,
      initial_quantity, supplier_id, po_id, grn_id, unit_cost, quality_status, notes
    ]);

    // Create initial batch movement
    await query(`
      INSERT INTO batch_movements (
        batch_id, movement_type, quantity, quantity_before, quantity_after,
        reference_type, notes
      ) VALUES ($1, 'receipt', $2, 0, $2, 'initial', 'Initial batch creation')
    `, [result.rows[0].id, initial_quantity]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') { // Unique violation
      return res.status(400).json({ message: 'Batch number already exists' });
    }
    console.error('Error creating batch:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update batch quantity (for sales, adjustments, etc.)
 * @route POST /api/serial-tracking/batches/:batchNumber/adjust
 */
const adjustBatchQuantity = async (req, res) => {
  try {
    const { batchNumber } = req.params;
    const {
      movement_type, // sale, return, adjustment, disposal
      quantity,
      reference_type,
      reference_id,
      branch_id,
      notes
    } = req.body;

    if (!movement_type || !quantity) {
      return res.status(400).json({ message: 'movement_type and quantity are required' });
    }

    await query('BEGIN');

    try {
      // Get current batch
      const batchResult = await query(
        'SELECT * FROM product_batches WHERE batch_number = $1',
        [batchNumber]
      );

      if (batchResult.rows.length === 0) {
        throw new Error('Batch not found');
      }

      const batch = batchResult.rows[0];
      const quantity_before = batch.current_quantity;
      let quantity_after = quantity_before;

      // Calculate new quantity based on movement type
      if (['sale', 'disposal', 'adjustment'].includes(movement_type)) {
        quantity_after = quantity_before - Math.abs(quantity);
      } else if (['return', 'receipt'].includes(movement_type)) {
        quantity_after = quantity_before + Math.abs(quantity);
      }

      if (quantity_after < 0) {
        throw new Error('Insufficient batch quantity');
      }

      // Update batch quantity
      await query(`
        UPDATE product_batches
        SET current_quantity = $1,
            status = CASE
              WHEN $1 = 0 THEN 'depleted'
              ELSE status
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [quantity_after, batch.id]);

      // Create batch movement
      await query(`
        INSERT INTO batch_movements (
          batch_id, movement_type, quantity, quantity_before, quantity_after,
          reference_type, reference_id, branch_id, notes, performed_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        batch.id, movement_type, quantity, quantity_before, quantity_after,
        reference_type, reference_id, branch_id, notes, req.user?.id
      ]);

      await query('COMMIT');

      res.json({
        batch_number: batchNumber,
        quantity_before,
        quantity_after,
        movement_type
      });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (err) {
    console.error('Error adjusting batch quantity:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get batches expiring soon
 * @route GET /api/serial-tracking/batches/expiring-soon
 */
const getBatchesExpiringSoon = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const result = await query(`
      SELECT pb.*,
        p.product_name,
        p.product_code,
        pv.variant_name,
        (pb.expiry_date - CURRENT_DATE) as days_until_expiry
      FROM product_batches pb
      LEFT JOIN products p ON p.id = pb.product_id
      LEFT JOIN product_variants pv ON pv.id = pb.variant_id
      WHERE pb.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '${parseInt(days)} days'
        AND pb.current_quantity > 0
        AND pb.status = 'active'
      ORDER BY pb.expiry_date ASC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching expiring batches:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Mark batch for recall
 * @route POST /api/serial-tracking/batches/:batchNumber/recall
 */
const recallBatch = async (req, res) => {
  try {
    const { batchNumber } = req.params;
    const { recall_reason } = req.body;

    const result = await query(`
      UPDATE product_batches
      SET status = 'recalled',
          notes = CONCAT(COALESCE(notes, ''), '\nRECALL: ', $1),
          updated_at = CURRENT_TIMESTAMP
      WHERE batch_number = $2
      RETURNING *
    `, [recall_reason, batchNumber]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error recalling batch:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * Get serial tracking statistics
 * @route GET /api/serial-tracking/statistics
 */
const getSerialTrackingStatistics = async (req, res) => {
  try {
    const serialStats = await query(`
      SELECT
        COUNT(*) as total_serials,
        COUNT(*) FILTER (WHERE status = 'in_stock') as in_stock,
        COUNT(*) FILTER (WHERE status = 'sold') as sold,
        COUNT(*) FILTER (WHERE status = 'returned') as returned,
        COUNT(*) FILTER (WHERE status = 'defective') as defective,
        COUNT(*) FILTER (WHERE warranty_expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days') as warranty_expiring_soon
      FROM serial_numbers
    `);

    const batchStats = await query(`
      SELECT
        COUNT(*) as total_batches,
        COUNT(*) FILTER (WHERE status = 'active') as active_batches,
        COUNT(*) FILTER (WHERE status = 'expired') as expired_batches,
        COUNT(*) FILTER (WHERE status = 'recalled') as recalled_batches,
        COUNT(*) FILTER (WHERE expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days') as expiring_soon,
        COALESCE(SUM(current_quantity), 0) as total_batch_quantity
      FROM product_batches
    `);

    res.json({
      serial_numbers: serialStats.rows[0],
      batches: batchStats.rows[0]
    });
  } catch (err) {
    console.error('Error fetching serial tracking statistics:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  // Serial Numbers
  getAllSerialNumbers,
  getSerialNumber,
  registerSerialNumber,
  bulkRegisterSerialNumbers,
  updateSerialNumber,
  markSerialAsSold,
  getWarrantyExpiringSoon,

  // Batches
  getAllBatches,
  getBatch,
  createBatch,
  adjustBatchQuantity,
  getBatchesExpiringSoon,
  recallBatch,

  // Analytics
  getSerialTrackingStatistics
};
