const { query } = require('../config/db');

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate unique product code based on product type
 */
const generateProductCode = async (productType = 'physical') => {
  const prefixMap = {
    physical: 'PRD',
    service: 'SRV',
    digital: 'DIG',
    bundle: 'BDL'
  };
  const prefix = prefixMap[productType] || 'PRD';
  const countResult = await query(
    `SELECT COUNT(*) as count FROM products WHERE product_type = $1`,
    [productType]
  );
  const count = parseInt(countResult.rows[0].count) + 1;
  return `${prefix}-${String(count).padStart(4, '0')}`;
};

/**
 * Build dynamic WHERE clause for product filtering
 */
const buildProductFilters = (filters) => {
  const conditions = [];
  const params = [];
  let paramCounter = 1;

  if (filters.product_type) {
    conditions.push(`p.product_type = $${paramCounter}`);
    params.push(filters.product_type);
    paramCounter++;
  }

  if (filters.brand_id) {
    conditions.push(`p.brand_id = $${paramCounter}`);
    params.push(filters.brand_id);
    paramCounter++;
  }

  if (filters.category_id) {
    conditions.push(`p.category_id = $${paramCounter}`);
    params.push(filters.category_id);
    paramCounter++;
  }

  if (filters.tile_type_id) {
    conditions.push(`p.tile_type_id = $${paramCounter}`);
    params.push(filters.tile_type_id);
    paramCounter++;
  }

  if (filters.size_id) {
    conditions.push(`p.size_id = $${paramCounter}`);
    params.push(filters.size_id);
    paramCounter++;
  }

  if (filters.use_case_id) {
    conditions.push(`p.use_case_id = $${paramCounter}`);
    params.push(filters.use_case_id);
    paramCounter++;
  }

  if (filters.is_featured !== undefined) {
    conditions.push(`p.is_featured = $${paramCounter}`);
    params.push(filters.is_featured);
    paramCounter++;
  }

  if (filters.has_variants !== undefined) {
    conditions.push(`p.has_variants = $${paramCounter}`);
    params.push(filters.has_variants);
    paramCounter++;
  }

  if (filters.is_active !== undefined) {
    conditions.push(`p.is_active = $${paramCounter}`);
    params.push(filters.is_active);
    paramCounter++;
  } else {
    // By default, only show active products
    conditions.push('p.is_active = true');
  }

  if (filters.low_stock) {
    conditions.push(`EXISTS (
      SELECT 1 FROM inventory i
      WHERE i.product_id = p.id
      AND i.quantity_on_hand <= p.reorder_level
    )`);
  }

  if (filters.min_price) {
    conditions.push(`p.retail_price >= $${paramCounter}`);
    params.push(filters.min_price);
    paramCounter++;
  }

  if (filters.max_price) {
    conditions.push(`p.retail_price <= $${paramCounter}`);
    params.push(filters.max_price);
    paramCounter++;
  }

  if (filters.search) {
    conditions.push(`(
      p.search_vector @@ plainto_tsquery('english', $${paramCounter})
      OR p.product_name ILIKE $${paramCounter + 1}
      OR p.product_code ILIKE $${paramCounter + 1}
    )`);
    params.push(filters.search);
    params.push(`%${filters.search}%`);
    paramCounter += 2;
  }

  conditions.push('p.deleted_at IS NULL');

  return { conditions, params, paramCounter };
};

// ============================================================================
// PRODUCT CRUD OPERATIONS
// ============================================================================

/**
 * Get all products with advanced filtering and view modes
 * @route GET /api/products
 */
const getAllProducts = async (req, res) => {
  try {
    const {
      product_type,
      brand_id,
      category_id,
      has_variants,
      is_featured,
      is_active,
      low_stock,
      min_price,
      max_price,
      search,
      view_mode = 'grid', // grid, list, compact, detailed
      page = 1,
      limit = 50,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    const filters = {
      product_type,
      brand_id,
      category_id,
      has_variants: has_variants === 'true' ? true : has_variants === 'false' ? false : undefined,
      is_featured: is_featured === 'true' ? true : is_featured === 'false' ? false : undefined,
      is_active: is_active === 'true' ? true : is_active === 'false' ? false : undefined,
      low_stock: low_stock === 'true',
      min_price,
      max_price,
      search
    };

    const { conditions, params } = buildProductFilters(filters);
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Select fields based on view mode
    let selectFields = 'p.*';
    if (view_mode === 'compact') {
      selectFields = 'p.id, p.product_code, p.product_name, p.retail_price, p.product_images, p.is_active';
    } else if (view_mode === 'list') {
      selectFields = 'p.id, p.product_code, p.product_name, p.product_type, p.retail_price, p.cost_price, p.reorder_level, p.is_active, p.is_featured';
    }

    // Add related data for detailed view
    const joins = view_mode === 'detailed' ? `
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
    ` : `
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
    `;

    // total_stock always included so every view mode shows correct stock
    const stockSubquery = `(SELECT COALESCE(SUM(quantity_on_hand), 0) FROM inventory WHERE product_id = p.id) as total_stock`;
    const additionalFields = view_mode === 'detailed' ? `,
      b.brand_name,
      c.category_name,
      ${stockSubquery}
    ` : `,
      b.brand_name,
      c.category_name,
      ${stockSubquery}
    `;

    // Calculate offset for pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Validate sort_by to prevent SQL injection
    const allowedSortFields = ['product_name', 'retail_price', 'cost_price', 'created_at', 'sale_count', 'view_count'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Main query
    const productsQuery = `
      SELECT ${selectFields}${additionalFields}
      FROM products p
      ${joins}
      ${whereClause}
      ORDER BY p.${sortField} ${sortDirection}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    // Count query for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      ${whereClause}
    `;

    const [productsResult, countResult] = await Promise.all([
      query(productsQuery, [...params, limit, offset]),
      query(countQuery, params)
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      products: productsResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get single product by ID
 * @route GET /api/products/:id
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT p.*,
        b.brand_name,
        c.category_name,
        (SELECT COALESCE(SUM(quantity_on_hand), 0) FROM inventory WHERE product_id = p.id) as total_stock,
        (SELECT json_agg(json_build_object(
          'branch_id', i.branch_id,
          'branch_name', br.branch_name,
          'quantity', i.quantity_on_hand,
          'quantity_available', i.quantity_available,
          'branch_price_override', i.branch_price_override
        ))
        FROM inventory i
        JOIN branches br ON i.branch_id = br.id
        WHERE i.product_id = p.id
        ) as branch_inventory
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1 AND p.deleted_at IS NULL
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Increment view count
    await query('UPDATE products SET view_count = view_count + 1 WHERE id = $1', [id]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Create new product
 * @route POST /api/products
 */
const createProduct = async (req, res) => {
  try {
    const {
      product_name,
      description,
      product_type = 'physical',
      category_id,
      brand_id,
      base_unit = 'piece',
      has_variants = false,
      track_serial_numbers = false,
      track_batches = false,
      retail_price,
      wholesale_base_price,
      cost_price,
      tax_rate = 0,
      reorder_level = 10,
      max_stock_level,
      product_images = [],
      model_images = [],
      specifications = {},
      commission_amount = 0,
      is_featured = false,
      is_retail_available = true,
      is_wholesale_available = true,
      barcode,
      weight_per_unit,
      is_online_available = false,
      short_description,
      slug: rawSlug,
      branch_stock_allocation = [] // Array of {branch_id, quantity, price_override}
    } = req.body;

    // Validate required fields
    if (!product_name || !retail_price) {
      return res.status(400).json({ message: 'Product name and retail price are required' });
    }

    // Validate product type
    const validTypes = ['physical', 'service', 'digital', 'bundle'];
    if (!validTypes.includes(product_type)) {
      return res.status(400).json({ message: 'Invalid product type' });
    }

    // Generate product code
    const product_code = await generateProductCode(product_type);

    // Auto-generate slug from product name if not provided
    const slug = rawSlug ||
      product_name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') +
      '-' + Date.now();

    // Begin transaction
    await query('BEGIN');

    try {
      // Insert product
      const productResult = await query(`
        INSERT INTO products (
          product_code, product_name, description, product_type,
          category_id, brand_id, base_unit, retail_price, wholesale_base_price,
          cost_price, tax_rate, reorder_level, max_stock_level, product_images,
          model_images, specifications, commission_amount, has_variants,
          track_serial_numbers, track_batches, is_featured,
          is_retail_available, is_wholesale_available, barcode, weight_per_unit,
          is_online_available, short_description, slug
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28
        ) RETURNING *
      `, [
        product_code, product_name, description, product_type,
        category_id, brand_id, base_unit, retail_price, wholesale_base_price,
        cost_price, tax_rate, reorder_level, max_stock_level,
        JSON.stringify(product_images), JSON.stringify(model_images),
        JSON.stringify(specifications), commission_amount, has_variants,
        track_serial_numbers, track_batches, is_featured,
        is_retail_available, is_wholesale_available, barcode, weight_per_unit,
        is_online_available, short_description || null, slug
      ]);

      const product = productResult.rows[0];

      // Allocate stock to branches if provided
      if (branch_stock_allocation && branch_stock_allocation.length > 0) {
        for (const allocation of branch_stock_allocation) {
          await query(`
            INSERT INTO inventory (product_id, branch_id, quantity_on_hand, branch_price_override)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (product_id, branch_id)
            DO UPDATE SET
              quantity_on_hand = inventory.quantity_on_hand + EXCLUDED.quantity_on_hand,
              branch_price_override = COALESCE(EXCLUDED.branch_price_override, inventory.branch_price_override)
          `, [product.id, allocation.branch_id, allocation.quantity || 0, allocation.price_override]);

          // Log stock movement
          if (allocation.quantity > 0) {
            await query(`
              INSERT INTO stock_movements (
                product_id, branch_id, movement_type, quantity,
                quantity_before, quantity_after, reference_type, notes
              ) VALUES ($1, $2, 'receipt', $3, 0, $3, 'initial_stock', 'Initial stock allocation')
            `, [product.id, allocation.branch_id, allocation.quantity]);
          }
        }
      }

      await query('COMMIT');

      res.status(201).json(product);
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update product
 * @route PUT /api/products/:id
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCounter = 1;

    const allowedFields = [
      'product_name', 'description', 'product_type', 'category_id', 'brand_id',
      'base_unit', 'retail_price', 'wholesale_base_price', 'cost_price', 'tax_rate',
      'reorder_level', 'max_stock_level', 'product_images', 'model_images',
      'specifications', 'commission_amount', 'has_variants', 'track_serial_numbers',
      'track_batches', 'is_featured', 'is_retail_available', 'is_wholesale_available',
      'barcode', 'weight_per_unit',
      'is_online_available', 'short_description', 'slug'
    ];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${paramCounter}`);
        // Stringify JSON fields
        if (['product_images', 'model_images', 'specifications'].includes(key)) {
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
      UPDATE products
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCounter} AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete product (soft delete)
 * @route DELETE /api/products/:id
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Begin transaction
    await query('BEGIN');

    try {
      // Get product data for recycle bin
      const productResult = await query('SELECT * FROM products WHERE id = $1 AND deleted_at IS NULL', [id]);

      if (productResult.rows.length === 0) {
        await query('ROLLBACK');
        return res.status(404).json({ message: 'Product not found' });
      }

      const product = productResult.rows[0];

      // Add to recycle bin
      await query(`
        INSERT INTO recycle_bin (entity_type, entity_id, entity_data, deleted_by, deletion_reason, restore_deadline)
        VALUES ('product', $1, $2, $3, $4, CURRENT_TIMESTAMP + INTERVAL '30 days')
      `, [id, JSON.stringify(product), req.user?.id, reason]);

      // Soft delete
      await query('UPDATE products SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);

      // Log to audit trail
      await query(`
        INSERT INTO deletion_audit_trail (entity_type, entity_id, action, performed_by, notes)
        VALUES ('product', $1, 'soft_delete', $2, $3)
      `, [id, req.user?.id, reason]);

      await query('COMMIT');

      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Activate/deactivate product
 * @route PATCH /api/products/:id/toggle-active
 */
const toggleProductActive = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      UPDATE products
      SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error toggling product active status:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Toggle featured status
 * @route PATCH /api/products/:id/toggle-featured
 */
const toggleProductFeatured = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      UPDATE products
      SET is_featured = NOT is_featured, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error toggling product featured status:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================================
// SPECIALIZED ENDPOINTS
// ============================================================================

/**
 * Get featured products
 * @route GET /api/products/featured
 */
const getFeaturedProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const result = await query(`
      SELECT p.*, b.brand_name, c.category_name
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_featured = true AND p.is_active = true AND p.deleted_at IS NULL
      ORDER BY p.sale_count DESC, p.view_count DESC
      LIMIT $1
    `, [limit]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching featured products:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get low stock products
 * @route GET /api/products/low-stock
 */
const getLowStockProducts = async (req, res) => {
  try {
    const { branch_id } = req.query;

    let stockQuery = `
      SELECT p.*, b.brand_name, c.category_name,
        COALESCE(SUM(i.quantity_on_hand), 0) as total_stock,
        p.reorder_level
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON i.product_id = p.id
    `;

    const params = [];
    if (branch_id) {
      stockQuery += ' WHERE i.branch_id = $1';
      params.push(branch_id);
    }

    stockQuery += `
      GROUP BY p.id, b.brand_name, c.category_name
      HAVING COALESCE(SUM(i.quantity_on_hand), 0) <= p.reorder_level
      ORDER BY COALESCE(SUM(i.quantity_on_hand), 0) ASC
    `;

    const result = await query(stockQuery, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching low stock products:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get product statistics
 * @route GET /api/products/statistics
 */
const getProductStatistics = async (req, res) => {
  try {
    const stats = await query(`
      SELECT
        COUNT(*) as total_products,
        COUNT(*) FILTER (WHERE product_type = 'physical') as physical_products,
        COUNT(*) FILTER (WHERE product_type = 'service') as service_products,
        COUNT(*) FILTER (WHERE product_type = 'digital') as digital_products,
        COUNT(*) FILTER (WHERE product_type = 'bundle') as bundle_products,
        COUNT(*) FILTER (WHERE is_active = true) as active_products,
        COUNT(*) FILTER (WHERE is_featured = true) as featured_products,
        COUNT(*) FILTER (WHERE has_variants = true) as products_with_variants,
        COALESCE(AVG(retail_price), 0) as average_price,
        COALESCE(SUM(sale_count), 0) as total_sales_count
      FROM products
      WHERE deleted_at IS NULL
    `);

    const lowStockCount = await query(`
      SELECT COUNT(DISTINCT p.id) as low_stock_count
      FROM products p
      LEFT JOIN inventory i ON i.product_id = p.id
      WHERE p.deleted_at IS NULL
      GROUP BY p.id, p.reorder_level
      HAVING COALESCE(SUM(i.quantity_on_hand), 0) <= p.reorder_level
    `);

    res.json({
      ...stats.rows[0],
      low_stock_count: parseInt(lowStockCount.rows[0]?.low_stock_count || 0)
    });
  } catch (err) {
    console.error('Error fetching product statistics:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get products with variants
 * @route GET /api/products/with-variants
 */
const getProductsWithVariants = async (req, res) => {
  try {
    const result = await query(`
      SELECT p.*, b.brand_name, c.category_name,
        (SELECT COUNT(*) FROM product_variants WHERE product_id = p.id AND is_active = true) as variant_count
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.has_variants = true
        AND p.is_active = true
        AND p.deleted_at IS NULL
      ORDER BY p.product_name
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching products with variants:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getBrands = async (req, res) => {
  try {
    const result = await query(
      `SELECT b.id, b.brand_name, b.description, b.logo_url, b.is_active, b.created_at,
              COUNT(p.id)::int AS product_count
       FROM brands b
       LEFT JOIN products p ON p.brand_id = b.id AND p.deleted_at IS NULL
       GROUP BY b.id ORDER BY b.brand_name`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching brands:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const createBrand = async (req, res) => {
  try {
    const { brand_name, description } = req.body;
    if (!brand_name?.trim()) return res.status(400).json({ message: 'Brand name is required' });
    const result = await query(
      `INSERT INTO brands (brand_name, description) VALUES ($1, $2) RETURNING *`,
      [brand_name.trim(), description || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'Brand name already exists' });
    console.error('Error creating brand:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const { brand_name, description, is_active } = req.body;
    const result = await query(
      `UPDATE brands SET
         brand_name = COALESCE($1, brand_name),
         description = $2,
         is_active = COALESCE($3, is_active),
         updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [brand_name?.trim() || null, description ?? null, is_active ?? null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Brand not found' });
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'Brand name already exists' });
    console.error('Error updating brand:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const check = await query('SELECT COUNT(*) FROM products WHERE brand_id = $1 AND deleted_at IS NULL', [id]);
    if (parseInt(check.rows[0].count) > 0) {
      return res.status(400).json({ message: 'Cannot delete brand with assigned products' });
    }
    await query('DELETE FROM brands WHERE id = $1', [id]);
    res.json({ message: 'Brand deleted' });
  } catch (err) {
    console.error('Error deleting brand:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getCategories = async (req, res) => {
  try {
    const result = await query(
      `SELECT c.id, c.category_name, c.description, c.is_active, c.created_at,
              COUNT(p.id)::int AS product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id AND p.deleted_at IS NULL
       GROUP BY c.id ORDER BY c.category_name`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const createCategory = async (req, res) => {
  try {
    const { category_name, description } = req.body;
    if (!category_name?.trim()) return res.status(400).json({ message: 'Category name is required' });
    const result = await query(
      `INSERT INTO categories (category_name, description) VALUES ($1, $2) RETURNING *`,
      [category_name.trim(), description || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'Category name already exists' });
    console.error('Error creating category:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_name, description, is_active } = req.body;
    const result = await query(
      `UPDATE categories SET
         category_name = COALESCE($1, category_name),
         description = $2,
         is_active = COALESCE($3, is_active),
         updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [category_name?.trim() || null, description ?? null, is_active ?? null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Category not found' });
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'Category name already exists' });
    console.error('Error updating category:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const check = await query('SELECT COUNT(*) FROM products WHERE category_id = $1 AND deleted_at IS NULL', [id]);
    if (parseInt(check.rows[0].count) > 0) {
      return res.status(400).json({ message: 'Cannot delete category with assigned products' });
    }
    await query('DELETE FROM categories WHERE id = $1', [id]);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductActive,
  toggleProductFeatured,
  getFeaturedProducts,
  getLowStockProducts,
  getProductStatistics,
  getProductsWithVariants,
  getBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
