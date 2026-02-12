const { query } = require('../config/db');

// ============================================================================
// VARIANT OPTIONS MANAGEMENT
// ============================================================================

/**
 * Get all variant options
 * @route GET /api/variants/options
 */
const getAllVariantOptions = async (req, res) => {
  try {
    const result = await query(`
      SELECT vo.*,
        (SELECT COUNT(*) FROM product_variant_values WHERE option_id = vo.id) as values_count
      FROM product_variant_options vo
      WHERE vo.is_active = TRUE
      ORDER BY vo.display_order, vo.option_name
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching variant options:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Create variant option (e.g., "Size", "Color")
 * @route POST /api/variants/options
 */
const createVariantOption = async (req, res) => {
  try {
    const { option_name, option_type = 'text', display_order = 0 } = req.body;

    if (!option_name) {
      return res.status(400).json({ message: 'Option name is required' });
    }

    const result = await query(`
      INSERT INTO product_variant_options (option_name, option_type, display_order)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [option_name, option_type, display_order]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') { // Unique violation
      return res.status(400).json({ message: 'Variant option already exists' });
    }
    console.error('Error creating variant option:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Update variant option
 * @route PUT /api/variants/options/:id
 */
const updateVariantOption = async (req, res) => {
  try {
    const { id } = req.params;
    const { option_name, option_type, display_order, is_active } = req.body;

    const updateFields = [];
    const values = [];
    let paramCounter = 1;

    if (option_name !== undefined) {
      updateFields.push(`option_name = $${paramCounter}`);
      values.push(option_name);
      paramCounter++;
    }
    if (option_type !== undefined) {
      updateFields.push(`option_type = $${paramCounter}`);
      values.push(option_type);
      paramCounter++;
    }
    if (display_order !== undefined) {
      updateFields.push(`display_order = $${paramCounter}`);
      values.push(display_order);
      paramCounter++;
    }
    if (is_active !== undefined) {
      updateFields.push(`is_active = $${paramCounter}`);
      values.push(is_active);
      paramCounter++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(id);
    const result = await query(`
      UPDATE product_variant_options
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCounter}
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Variant option not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating variant option:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Delete variant option
 * @route DELETE /api/variants/options/:id
 */
const deleteVariantOption = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if option is used in any product variants
    const usageCheck = await query(`
      SELECT COUNT(*) as count
      FROM product_variant_values pvv
      JOIN product_variants pv ON pv.variant_values::jsonb ? pvv.value_name
      WHERE pvv.option_id = $1
    `, [id]);

    if (parseInt(usageCheck.rows[0].count) > 0) {
      return res.status(400).json({
        message: 'Cannot delete variant option that is in use by products'
      });
    }

    const result = await query(
      'DELETE FROM product_variant_options WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Variant option not found' });
    }

    res.json({ message: 'Variant option deleted successfully' });
  } catch (err) {
    console.error('Error deleting variant option:', err);
    res.status(500).json({ message: err.message });
  }
};

// ============================================================================
// VARIANT VALUES MANAGEMENT
// ============================================================================

/**
 * Get variant values for an option
 * @route GET /api/variants/options/:optionId/values
 */
const getVariantValues = async (req, res) => {
  try {
    const { optionId } = req.params;

    const result = await query(`
      SELECT pvv.*,
        vo.option_name,
        vo.option_type
      FROM product_variant_values pvv
      JOIN product_variant_options vo ON vo.id = pvv.option_id
      WHERE pvv.option_id = $1 AND pvv.is_active = TRUE
      ORDER BY pvv.display_order, pvv.value_name
    `, [optionId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching variant values:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Create variant value (e.g., "Small", "Red")
 * @route POST /api/variants/options/:optionId/values
 */
const createVariantValue = async (req, res) => {
  try {
    const { optionId } = req.params;
    const {
      value_name,
      value_code,
      hex_color,
      image_url,
      display_order = 0
    } = req.body;

    if (!value_name) {
      return res.status(400).json({ message: 'Value name is required' });
    }

    const result = await query(`
      INSERT INTO product_variant_values
        (option_id, value_name, value_code, hex_color, image_url, display_order)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [optionId, value_name, value_code, hex_color, image_url, display_order]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') { // Unique violation
      return res.status(400).json({ message: 'Value already exists for this option' });
    }
    console.error('Error creating variant value:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Bulk create variant values
 * @route POST /api/variants/options/:optionId/values/bulk
 */
const bulkCreateVariantValues = async (req, res) => {
  try {
    const { optionId } = req.params;
    const { values } = req.body; // Array of {value_name, value_code, etc.}

    if (!Array.isArray(values) || values.length === 0) {
      return res.status(400).json({ message: 'Values array is required' });
    }

    await query('BEGIN');

    try {
      const createdValues = [];

      for (let i = 0; i < values.length; i++) {
        const value = values[i];
        const result = await query(`
          INSERT INTO product_variant_values
            (option_id, value_name, value_code, hex_color, image_url, display_order)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (option_id, value_name) DO NOTHING
          RETURNING *
        `, [
          optionId,
          value.value_name,
          value.value_code || null,
          value.hex_color || null,
          value.image_url || null,
          value.display_order !== undefined ? value.display_order : i
        ]);

        if (result.rows.length > 0) {
          createdValues.push(result.rows[0]);
        }
      }

      await query('COMMIT');
      res.status(201).json(createdValues);
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (err) {
    console.error('Error bulk creating variant values:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Update variant value
 * @route PUT /api/variants/values/:id
 */
const updateVariantValue = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      value_name,
      value_code,
      hex_color,
      image_url,
      display_order,
      is_active
    } = req.body;

    const updateFields = [];
    const values = [];
    let paramCounter = 1;

    if (value_name !== undefined) {
      updateFields.push(`value_name = $${paramCounter}`);
      values.push(value_name);
      paramCounter++;
    }
    if (value_code !== undefined) {
      updateFields.push(`value_code = $${paramCounter}`);
      values.push(value_code);
      paramCounter++;
    }
    if (hex_color !== undefined) {
      updateFields.push(`hex_color = $${paramCounter}`);
      values.push(hex_color);
      paramCounter++;
    }
    if (image_url !== undefined) {
      updateFields.push(`image_url = $${paramCounter}`);
      values.push(image_url);
      paramCounter++;
    }
    if (display_order !== undefined) {
      updateFields.push(`display_order = $${paramCounter}`);
      values.push(display_order);
      paramCounter++;
    }
    if (is_active !== undefined) {
      updateFields.push(`is_active = $${paramCounter}`);
      values.push(is_active);
      paramCounter++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(id);
    const result = await query(`
      UPDATE product_variant_values
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCounter}
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Variant value not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating variant value:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Delete variant value
 * @route DELETE /api/variants/values/:id
 */
const deleteVariantValue = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM product_variant_values WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Variant value not found' });
    }

    res.json({ message: 'Variant value deleted successfully' });
  } catch (err) {
    console.error('Error deleting variant value:', err);
    res.status(500).json({ message: err.message });
  }
};

// ============================================================================
// PRODUCT VARIANTS MANAGEMENT
// ============================================================================

/**
 * Generate unique SKU for variant
 */
const generateVariantSKU = async (productCode, variantValues) => {
  const variantPart = Object.values(variantValues)
    .map(v => v.substring(0, 3).toUpperCase())
    .join('-');

  const countResult = await query(
    'SELECT COUNT(*) as count FROM product_variants WHERE sku LIKE $1',
    [`${productCode}-%`]
  );

  const count = parseInt(countResult.rows[0].count) + 1;
  return `${productCode}-${variantPart}-${String(count).padStart(3, '0')}`;
};

/**
 * Get all variants for a product
 * @route GET /api/products/:productId/variants
 */
const getProductVariants = async (req, res) => {
  try {
    const { productId } = req.params;

    const result = await query(`
      SELECT pv.*,
        (SELECT COALESCE(SUM(quantity_on_hand), 0)
         FROM variant_inventory WHERE variant_id = pv.id) as total_stock,
        (SELECT json_agg(json_build_object(
          'branch_id', vi.branch_id,
          'branch_name', b.branch_name,
          'quantity', vi.quantity_on_hand,
          'quantity_available', vi.quantity_available
        ))
        FROM variant_inventory vi
        JOIN branches b ON b.id = vi.branch_id
        WHERE vi.variant_id = pv.id
        ) as branch_inventory
      FROM product_variants pv
      WHERE pv.product_id = $1 AND pv.is_active = TRUE
      ORDER BY pv.is_default DESC, pv.created_at
    `, [productId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching product variants:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Create product variant
 * @route POST /api/products/:productId/variants
 */
const createProductVariant = async (req, res) => {
  try {
    const { productId } = req.params;
    const {
      sku,
      variant_name,
      variant_values, // {size: "Large", color: "Red"}
      price_adjustment = 0,
      retail_price,
      wholesale_price,
      cost_price,
      barcode,
      weight_per_unit,
      image_url,
      is_default = false,
      reorder_level = 0,
      branch_inventory = [] // [{branch_id, quantity}]
    } = req.body;

    if (!variant_values || Object.keys(variant_values).length === 0) {
      return res.status(400).json({ message: 'Variant values are required' });
    }

    // Get product details
    const productResult = await query(
      'SELECT product_code, retail_price, wholesale_base_price, cost_price FROM products WHERE id = $1',
      [productId]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = productResult.rows[0];

    // Generate SKU if not provided
    const variantSKU = sku || await generateVariantSKU(product.product_code, variant_values);

    // Calculate prices if not provided
    const finalRetailPrice = retail_price !== undefined
      ? retail_price
      : parseFloat(product.retail_price) + parseFloat(price_adjustment);

    const finalWholesalePrice = wholesale_price !== undefined
      ? wholesale_price
      : parseFloat(product.wholesale_base_price) + parseFloat(price_adjustment);

    const finalCostPrice = cost_price !== undefined
      ? cost_price
      : product.cost_price;

    // Generate variant name if not provided
    const finalVariantName = variant_name ||
      Object.entries(variant_values)
        .map(([key, value]) => value)
        .join(' - ');

    await query('BEGIN');

    try {
      // Create variant
      const variantResult = await query(`
        INSERT INTO product_variants (
          product_id, sku, variant_name, variant_values, price_adjustment,
          retail_price, wholesale_price, cost_price, barcode, weight_per_unit,
          image_url, is_default, reorder_level
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `, [
        productId, variantSKU, finalVariantName, JSON.stringify(variant_values),
        price_adjustment, finalRetailPrice, finalWholesalePrice, finalCostPrice,
        barcode, weight_per_unit, image_url, is_default, reorder_level
      ]);

      const variant = variantResult.rows[0];

      // Set product has_variants flag
      await query(
        'UPDATE products SET has_variants = TRUE WHERE id = $1',
        [productId]
      );

      // If this is the default variant, unset other defaults
      if (is_default) {
        await query(
          'UPDATE product_variants SET is_default = FALSE WHERE product_id = $1 AND id != $2',
          [productId, variant.id]
        );
      }

      // Create variant inventory for branches
      if (branch_inventory && branch_inventory.length > 0) {
        for (const branchInv of branch_inventory) {
          await query(`
            INSERT INTO variant_inventory (variant_id, branch_id, quantity_on_hand)
            VALUES ($1, $2, $3)
          `, [variant.id, branchInv.branch_id, branchInv.quantity || 0]);
        }
      }

      await query('COMMIT');

      res.status(201).json(variant);
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (err) {
    if (err.code === '23505') { // Unique violation
      return res.status(400).json({ message: 'SKU already exists' });
    }
    console.error('Error creating product variant:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Bulk generate variants from combinations
 * @route POST /api/products/:productId/variants/generate
 */
const generateProductVariants = async (req, res) => {
  try {
    const { productId } = req.params;
    const { variant_combinations } = req.body;
    // variant_combinations = [
    //   {size: "Small", color: "Red"},
    //   {size: "Small", color: "Blue"},
    //   {size: "Medium", color: "Red"},
    // ]

    if (!Array.isArray(variant_combinations) || variant_combinations.length === 0) {
      return res.status(400).json({ message: 'Variant combinations are required' });
    }

    // Get product details
    const productResult = await query(
      'SELECT product_code, retail_price, wholesale_base_price, cost_price FROM products WHERE id = $1',
      [productId]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = productResult.rows[0];

    await query('BEGIN');

    try {
      const createdVariants = [];

      for (const combination of variant_combinations) {
        const sku = await generateVariantSKU(product.product_code, combination);
        const variant_name = Object.values(combination).join(' - ');

        const result = await query(`
          INSERT INTO product_variants (
            product_id, sku, variant_name, variant_values,
            retail_price, wholesale_price, cost_price
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `, [
          productId,
          sku,
          variant_name,
          JSON.stringify(combination),
          product.retail_price,
          product.wholesale_base_price,
          product.cost_price
        ]);

        createdVariants.push(result.rows[0]);
      }

      // Set product has_variants flag
      await query(
        'UPDATE products SET has_variants = TRUE WHERE id = $1',
        [productId]
      );

      await query('COMMIT');

      res.status(201).json(createdVariants);
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (err) {
    console.error('Error generating product variants:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Update product variant
 * @route PUT /api/variants/:id
 */
const updateProductVariant = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updateFields = [];
    const values = [];
    let paramCounter = 1;

    const allowedFields = [
      'sku', 'variant_name', 'variant_values', 'price_adjustment',
      'retail_price', 'wholesale_price', 'cost_price', 'barcode',
      'weight_per_unit', 'image_url', 'is_default', 'is_active', 'reorder_level'
    ];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${paramCounter}`);
        if (key === 'variant_values') {
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
      UPDATE product_variants
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCounter}
      RETURNING *
    `;

    const result = await query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Variant not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating product variant:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Delete product variant
 * @route DELETE /api/variants/:id
 */
const deleteProductVariant = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if variant is used in any sales
    const usageCheck = await query(
      'SELECT COUNT(*) as count FROM sale_items WHERE variant_id = $1',
      [id]
    );

    if (parseInt(usageCheck.rows[0].count) > 0) {
      return res.status(400).json({
        message: 'Cannot delete variant that has been sold. Consider deactivating instead.'
      });
    }

    const result = await query(
      'DELETE FROM product_variants WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Variant not found' });
    }

    res.json({ message: 'Variant deleted successfully' });
  } catch (err) {
    console.error('Error deleting product variant:', err);
    res.status(500).json({ message: err.message });
  }
};

// ============================================================================
// VARIANT INVENTORY MANAGEMENT
// ============================================================================

/**
 * Get variant inventory by branch
 * @route GET /api/variants/:variantId/inventory
 */
const getVariantInventory = async (req, res) => {
  try {
    const { variantId } = req.params;

    const result = await query(`
      SELECT vi.*,
        b.branch_name,
        b.branch_code
      FROM variant_inventory vi
      JOIN branches b ON b.id = vi.branch_id
      WHERE vi.variant_id = $1
      ORDER BY b.branch_name
    `, [variantId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching variant inventory:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Update variant inventory for a branch
 * @route PUT /api/variants/:variantId/inventory/:branchId
 */
const updateVariantInventory = async (req, res) => {
  try {
    const { variantId, branchId } = req.params;
    const {
      quantity_on_hand,
      quantity_reserved,
      branch_price_override
    } = req.body;

    const updateFields = [];
    const values = [];
    let paramCounter = 1;

    if (quantity_on_hand !== undefined) {
      updateFields.push(`quantity_on_hand = $${paramCounter}`);
      values.push(quantity_on_hand);
      paramCounter++;
    }
    if (quantity_reserved !== undefined) {
      updateFields.push(`quantity_reserved = $${paramCounter}`);
      values.push(quantity_reserved);
      paramCounter++;
    }
    if (branch_price_override !== undefined) {
      updateFields.push(`branch_price_override = $${paramCounter}`);
      values.push(branch_price_override);
      paramCounter++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(variantId, branchId);

    const result = await query(`
      INSERT INTO variant_inventory (variant_id, branch_id, quantity_on_hand, quantity_reserved, branch_price_override)
      VALUES ($${paramCounter}, $${paramCounter + 1},
              COALESCE($1, 0), COALESCE($2, 0), $3)
      ON CONFLICT (variant_id, branch_id)
      DO UPDATE SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, values);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating variant inventory:', err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  // Variant Options
  getAllVariantOptions,
  createVariantOption,
  updateVariantOption,
  deleteVariantOption,

  // Variant Values
  getVariantValues,
  createVariantValue,
  bulkCreateVariantValues,
  updateVariantValue,
  deleteVariantValue,

  // Product Variants
  getProductVariants,
  createProductVariant,
  generateProductVariants,
  updateProductVariant,
  deleteProductVariant,

  // Variant Inventory
  getVariantInventory,
  updateVariantInventory
};
