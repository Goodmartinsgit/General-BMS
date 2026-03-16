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
  const maxResult = await query(
    `SELECT MAX(CAST(SUBSTRING(product_code FROM '[0-9]+$') AS INTEGER)) as max_num
     FROM products
     WHERE product_code LIKE $1 || '-%'`,
    [prefix]
  );
  const nextNum = (parseInt(maxResult.rows[0].max_num) || 0) + 1;
  return `${prefix}-${String(nextNum).padStart(4, '0')}`;
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
    conditions.push(`(
      p.category_id = $${paramCounter}
      OR EXISTS (
        SELECT 1 FROM product_category_assignments pca_f
        JOIN categories cf ON cf.id = pca_f.category_id
        WHERE pca_f.product_id = p.id
          AND (cf.id = $${paramCounter} OR cf.path LIKE $${paramCounter} || '.%'
               OR cf.parent_category_id = $${paramCounter})
      )
      OR p.category_id IN (
        SELECT csub.id FROM categories csub
        WHERE csub.path LIKE $${paramCounter} || '.%' OR csub.parent_category_id = $${paramCounter}
      )
    )`);
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
      selectFields = 'p.id, p.product_code, p.product_name, p.product_type, p.retail_price, p.cost_price, p.reorder_level, p.is_active, p.is_featured, p.product_images';
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

    // Enrich each product with colors, images, and category assignments
    const productIds = productsResult.rows.map(p => p.id);

    if (productIds.length > 0) {
      const [colorsRes, imagesRes, assignmentsRes] = await Promise.all([
        query(
          `SELECT * FROM product_colors WHERE product_id = ANY($1) ORDER BY product_id, display_order, color_name`,
          [productIds]
        ),
        query(
          `SELECT pi.*, pc.color_name, pc.color_code
           FROM product_images_v2 pi
           LEFT JOIN product_colors pc ON pi.color_id = pc.id
           WHERE pi.product_id = ANY($1)
           ORDER BY pi.product_id, pi.display_order, pi.created_at`,
          [productIds]
        ),
        query(
          `SELECT pca.*, c.category_name, c.parent_category_id, c.level as cat_level,
                  c.path, c.unit_of_measure, c.is_selection_attribute, c.is_listing_category
           FROM product_category_assignments pca
           JOIN categories c ON c.id = pca.category_id
           WHERE pca.product_id = ANY($1)
           ORDER BY pca.product_id, c.level, c.display_order, c.category_name`,
          [productIds]
        ),
      ]);

      // Group by product_id
      const colorsMap = {};
      const imagesMap = {};
      const assignmentsMap = {};
      for (const c of colorsRes.rows) {
        (colorsMap[c.product_id] ||= []).push(c);
      }
      for (const img of imagesRes.rows) {
        (imagesMap[img.product_id] ||= []).push(img);
      }
      for (const a of assignmentsRes.rows) {
        (assignmentsMap[a.product_id] ||= []).push(a);
      }

      for (const p of productsResult.rows) {
        p.colors = colorsMap[p.id] || [];
        p.images = imagesMap[p.id] || [];
        p.category_assignments = assignmentsMap[p.id] || [];

        // Compute effective stock from category assignments when inventory is 0
        const invStock = parseInt(p.total_stock) || 0;
        if (invStock === 0 && p.category_assignments.length > 0) {
          p.total_stock = p.category_assignments.reduce(
            (sum, a) => sum + (parseInt(a.stock_allocated) || 0), 0
          );
        }

        // Compute effective price from category assignment overrides
        if (p.category_assignments.length > 0) {
          const listingAssignment = p.category_assignments.find(a => a.is_listing_category);
          const firstWithPrice = p.category_assignments.find(a => a.price_override);
          const override = listingAssignment || firstWithPrice;
          if (override && override.price_override) {
            p.effective_price = parseFloat(override.price_override);
          }
          if (override && override.cost_price_override) {
            p.effective_cost_price = parseFloat(override.cost_price_override);
          }

          // Compute price range from selection category assignments
          const selectionPrices = p.category_assignments
            .filter(a => a.is_selection_attribute && a.price_override)
            .map(a => ({
              category_name: a.category_name,
              price: parseFloat(a.price_override),
              cost_price: a.cost_price_override ? parseFloat(a.cost_price_override) : null,
              stock: parseInt(a.stock_allocated) || 0,
              unit: a.unit_of_measure || null
            }));
          if (selectionPrices.length > 1) {
            const prices = selectionPrices.map(s => s.price);
            p.price_min = Math.min(...prices);
            p.price_max = Math.max(...prices);
            p.selection_prices = selectionPrices;
          }
        }
      }
    }

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

    const [result, colorsResult, imagesResult, assignmentsResult] = await Promise.all([
      query(`
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
      `, [id]),
      query(
        `SELECT * FROM product_colors WHERE product_id = $1 ORDER BY display_order, color_name`,
        [id]
      ),
      query(
        `SELECT pi.*, pc.color_name, pc.color_code
         FROM product_images_v2 pi
         LEFT JOIN product_colors pc ON pi.color_id = pc.id
         WHERE pi.product_id = $1
         ORDER BY pi.display_order, pi.created_at`,
        [id]
      ),
      query(
        `SELECT pca.*, c.category_name, c.parent_category_id, c.level as cat_level,
                c.path, c.unit_of_measure, c.is_selection_attribute, c.is_listing_category
         FROM product_category_assignments pca
         JOIN categories c ON c.id = pca.category_id
         WHERE pca.product_id = $1
         ORDER BY c.level, c.display_order, c.category_name`,
        [id]
      ),
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = result.rows[0];
    product.colors = colorsResult.rows;
    product.images = imagesResult.rows;
    product.category_assignments = assignmentsResult.rows;

    // Compute effective stock from category assignments when inventory is 0
    const invStock = parseInt(product.total_stock) || 0;
    if (invStock === 0 && product.category_assignments.length > 0) {
      product.total_stock = product.category_assignments.reduce(
        (sum, a) => sum + (parseInt(a.stock_allocated) || 0), 0
      );
    }

    // Compute effective price from category assignment overrides
    if (product.category_assignments.length > 0) {
      const listingAssignment = product.category_assignments.find(a => a.is_listing_category);
      const firstWithPrice = product.category_assignments.find(a => a.price_override);
      const override = listingAssignment || firstWithPrice;
      if (override && override.price_override) {
        product.effective_price = parseFloat(override.price_override);
      }
      if (override && override.cost_price_override) {
        product.effective_cost_price = parseFloat(override.cost_price_override);
      }

      // Compute price range from selection category assignments
      const selectionPrices = product.category_assignments
        .filter(a => a.is_selection_attribute && a.price_override)
        .map(a => ({
          category_name: a.category_name,
          price: parseFloat(a.price_override),
          cost_price: a.cost_price_override ? parseFloat(a.cost_price_override) : null,
          stock: parseInt(a.stock_allocated) || 0,
          unit: a.unit_of_measure || null
        }));
      if (selectionPrices.length > 1) {
        const prices = selectionPrices.map(s => s.price);
        product.price_min = Math.min(...prices);
        product.price_max = Math.max(...prices);
        product.selection_prices = selectionPrices;
      }
    }

    // Increment view count
    await query('UPDATE products SET view_count = view_count + 1 WHERE id = $1', [id]);

    res.json(product);
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
      has_colors = false,
      branch_stock_allocation = [] // Array of {branch_id, quantity, price_override}
    } = req.body;

    // Validate required fields
    if (!product_name) {
      return res.status(400).json({ message: 'Product name is required' });
    }
    if (retail_price === undefined || retail_price === null || retail_price === '') {
      // Allow 0 retail_price when subcategory pricing is used (listing categories)
      if (!category_id) {
        return res.status(400).json({ message: 'Retail price is required' });
      }
    }

    // Validate product type
    const validTypes = ['physical', 'service', 'digital', 'bundle'];
    if (!validTypes.includes(product_type)) {
      return res.status(400).json({ message: 'Invalid product type' });
    }

    // Generate product code
    const product_code = await generateProductCode(product_type);

    // Auto-generate slug from product name if not provided (base logic)
    const slugTs = Date.now();
    const baseSlug = rawSlug ||
      product_name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') +
      '-' + slugTs;

    // Find listing-level categories within the root category's tree
    let listingLevelCategories = [];
    if (category_id) {
      const rootCat = await query(`SELECT id, path FROM categories WHERE id = $1`, [parseInt(category_id)]);
      if (rootCat.rows.length > 0) {
        const rootPath = rootCat.rows[0].path;
        // Find all categories in this tree that are marked as listing categories
        const listingRes = await query(
          `SELECT id, category_name, level, path, parent_category_id
           FROM categories
           WHERE is_listing_category = true AND is_active = true
             AND (path LIKE $1 || '/%' OR id = $2)
           ORDER BY level, display_order, category_name`,
          [rootPath, parseInt(category_id)]
        );
        listingLevelCategories = listingRes.rows;
      }
    }
    const hasListingLevel = listingLevelCategories.length > 0;

    // Begin transaction
    await query('BEGIN');

    try {
      let productsToCreate = [];

      if (hasListingLevel) {
        // Create one product per listing-level category
        if (listingLevelCategories.length === 0) {
          productsToCreate.push({
            name: product_name, catId: parseInt(category_id), slug: baseSlug, code: product_code
          });
        } else {
          // Check for existing products with the same base name under these listing categories
          const listingCatIds = listingLevelCategories.map(lc => lc.id);
          const existingProducts = await query(
            `SELECT id, product_name, category_id FROM products
             WHERE category_id = ANY($1) AND deleted_at IS NULL
               AND product_name LIKE $2 || ' (%'`,
            [listingCatIds, product_name.replace(/\s*\(.*\)\s*$/, '')]
          );
          const existingCatIds = new Set(existingProducts.rows.map(p => p.category_id));

          if (existingCatIds.size === listingLevelCategories.length) {
            return res.status(400).json({
              message: `Products for "${product_name}" already exist for all listing-level categories. Edit the existing products instead.`,
              existing_products: existingProducts.rows,
            });
          }

          const baseCodeMatch = product_code.match(/^([A-Z]+)-(\d+)$/);
          const codePrefix = baseCodeMatch ? baseCodeMatch[1] : 'PRD';
          const baseNum = baseCodeMatch ? parseInt(baseCodeMatch[2]) : 1;
          let codeOffset = 0;

          for (let i = 0; i < listingLevelCategories.length; i++) {
            const listingCat = listingLevelCategories[i];
            // Skip if a product already exists for this listing-level category
            if (existingCatIds.has(listingCat.id)) continue;

            const childNum = baseNum + codeOffset;
            codeOffset++;
            const childCode = `${codePrefix}-${String(childNum).padStart(4, '0')}`;
            const childSlug = product_name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')
              + '-' + listingCat.category_name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')
              + '-' + slugTs;
            productsToCreate.push({
              name: `${product_name} (${listingCat.category_name})`,
              catId: listingCat.id,
              slug: childSlug,
              code: childCode
            });
          }

          if (productsToCreate.length === 0) {
            return res.status(400).json({
              message: `Products for "${product_name}" already exist for all listing-level categories.`,
              existing_products: existingProducts.rows,
            });
          }
        }
      } else {
        productsToCreate.push({
          name: product_name, catId: category_id ? parseInt(category_id) : null, slug: baseSlug, code: product_code
        });
      }

      const createdProducts = [];

      for (const p of productsToCreate) {
        // Insert product
        const productResult = await query(`
          INSERT INTO products (
            product_code, product_name, description, product_type,
            category_id, brand_id, base_unit, retail_price, wholesale_base_price,
            cost_price, tax_rate, reorder_level, max_stock_level, product_images,
            model_images, specifications, commission_amount, has_variants,
            track_serial_numbers, track_batches, is_featured,
            is_retail_available, is_wholesale_available, barcode, weight_per_unit,
            is_online_available, short_description, slug, has_colors
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29
          ) RETURNING *
        `, [
          p.code, p.name, description || null, product_type,
          p.catId || null, brand_id || null, base_unit, retail_price || 0, wholesale_base_price || null,
          cost_price || 0, tax_rate || 0, reorder_level || null, max_stock_level || null,
          JSON.stringify(product_images), JSON.stringify(model_images),
          JSON.stringify(specifications), commission_amount || 0, has_variants,
          track_serial_numbers, track_batches, is_featured,
          is_retail_available, is_wholesale_available, barcode || null, weight_per_unit || null,
          is_online_available, short_description || null, p.slug, has_colors
        ]);

        const product = productResult.rows[0];

        // For multi-product generation, auto-create selection-attribute assignments
        // for the nested categories beneath each listing-level product's category
        if (hasListingLevel) {
          const catPath = await query('SELECT path FROM categories WHERE id = $1', [p.catId]);
          if (catPath.rows.length > 0) {
            const descendants = await query(
              `SELECT id, level, parent_category_id
               FROM categories
               WHERE path LIKE $1 || '/%' AND is_active = true
               ORDER BY level, display_order`,
              [catPath.rows[0].path]
            );
            // Insert a root assignment for the product's own category
            const rootCatLevel = await query('SELECT level FROM categories WHERE id = $1', [p.catId]);
            await query(
              `INSERT INTO product_category_assignments
                (product_id, category_id, category_level, stock_allocated, is_leaf)
               VALUES ($1, $2, $3, 0, $4)
               ON CONFLICT (product_id, category_id) DO NOTHING`,
              [product.id, p.catId, rootCatLevel.rows[0]?.level || 1, descendants.rows.length === 0]
            );
            // Insert assignments for all descendants (selection attributes)
            for (const desc of descendants.rows) {
              const isLeaf = !descendants.rows.some(d => d.parent_category_id === desc.id);
              await query(
                `INSERT INTO product_category_assignments
                  (product_id, category_id, category_level, stock_allocated, is_leaf)
                 VALUES ($1, $2, $3, 0, $4)
                 ON CONFLICT (product_id, category_id) DO NOTHING`,
                [product.id, desc.id, desc.level, isLeaf]
              );
            }
          }
        }

        // Fetch the selection attributes for response
        const selectionAttrs = await query(
          `SELECT pca.*, c.category_name, c.parent_category_id, c.level as cat_level
           FROM product_category_assignments pca
           JOIN categories c ON c.id = pca.category_id
           WHERE pca.product_id = $1
           ORDER BY c.level, c.display_order`,
          [product.id]
        );
        product.selection_attributes = selectionAttrs.rows;

        createdProducts.push(product);

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
            `, [product.id, allocation.branch_id, allocation.quantity || 0, allocation.price_override || null]);

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
      }

      await query('COMMIT');

      if (hasListingLevel) {
        res.status(201).json({ multiple: true, products: createdProducts });
      } else {
        res.status(201).json(createdProducts[0]);
      }
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

    // Fetch existing product
    const existingRes = await query('SELECT * FROM products WHERE id = $1 AND deleted_at IS NULL', [id]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    const existingProduct = existingRes.rows[0];

    // Determine the effective category_id (use updated value if provided, else existing)
    const effectiveCatId = (updates.category_id !== undefined && updates.category_id !== '')
      ? parseInt(updates.category_id)
      : existingProduct.category_id;

    // Check if this product's category is a root category that has listing-level children
    let listingLevelCategories = [];
    if (effectiveCatId) {
      const catCheck = await query('SELECT id, path, parent_category_id, is_listing_category FROM categories WHERE id = $1', [effectiveCatId]);
      if (catCheck.rows.length > 0) {
        const cat = catCheck.rows[0];
        // Only expand if the product is assigned to a root category (no parent)
        // and that root tree has listing-level categories
        if (!cat.parent_category_id) {
          const rootPath = cat.path;
          const listingRes = await query(
            `SELECT id, category_name, level, path, parent_category_id
             FROM categories
             WHERE is_listing_category = true AND is_active = true
               AND (path LIKE $1 || '/%' OR id = $2)
             ORDER BY level, display_order, category_name`,
            [rootPath, effectiveCatId]
          );
          listingLevelCategories = listingRes.rows;
        }
      }
    }

    const shouldExpand = listingLevelCategories.length > 0;

    if (shouldExpand) {
      // Expand: update the original product to become the first listing-level product,
      // and create new products for the remaining listing-level categories
      const productName = updates.product_name || existingProduct.product_name;
      // Strip any existing parenthetical suffix from the product name for the base name
      const baseName = productName.replace(/\s*\(.*\)\s*$/, '');
      const slugTs = Date.now();

      // Check for existing products that already cover some listing-level categories
      const listingCatIds = listingLevelCategories.map(lc => lc.id);
      const alreadyExpandedProducts = await query(
        `SELECT id, product_name, category_id FROM products
         WHERE category_id = ANY($1) AND deleted_at IS NULL
           AND id != $2
           AND product_name LIKE $3 || ' (%'`,
        [listingCatIds, parseInt(id), baseName]
      );
      const alreadyCoveredCatIds = new Set(alreadyExpandedProducts.rows.map(p => p.category_id));
      // Also include the current product's category if it already matches a listing-level cat
      if (listingCatIds.includes(existingProduct.category_id)) {
        alreadyCoveredCatIds.delete(existingProduct.category_id); // allow re-assignment of original
      }

      // Filter to only listing categories that need new products
      const catsNeedingProducts = listingLevelCategories.filter(
        lc => !alreadyCoveredCatIds.has(lc.id)
      );

      if (catsNeedingProducts.length === 0) {
        // All listing-level categories already have products — just do a standard update
        return res.status(400).json({
          message: `Products for "${baseName}" already exist for all listing-level categories.`,
          existing_products: alreadyExpandedProducts.rows,
        });
      }

      await query('BEGIN');
      try {
        // Generate codes for new products
        const existingCode = existingProduct.product_code;
        const baseCodeMatch = existingCode.match(/^([A-Z]+)-(\d+)$/);
        const codePrefix = baseCodeMatch ? baseCodeMatch[1] : 'PRD';

        const createdProducts = [];

        for (let i = 0; i < catsNeedingProducts.length; i++) {
          const listingCat = catsNeedingProducts[i];
          const childName = `${baseName} (${listingCat.category_name})`;
          const childSlug = baseName.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')
            + '-' + listingCat.category_name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')
            + '-' + slugTs;

          if (i === 0) {
            // Update the original product to become the first listing-level product
            const updateResult = await query(`
              UPDATE products SET
                product_name = $1, category_id = $2, slug = $3,
                description = COALESCE($4, description),
                product_type = COALESCE($5, product_type),
                brand_id = $6,
                retail_price = COALESCE($7, retail_price),
                cost_price = COALESCE($8, cost_price),
                product_images = COALESCE($9, product_images),
                has_colors = COALESCE($10, has_colors),
                is_online_available = COALESCE($11, is_online_available),
                short_description = COALESCE($12, short_description),
                reorder_level = COALESCE($13, reorder_level),
                has_variants = COALESCE($14, has_variants),
                track_serial_numbers = COALESCE($15, track_serial_numbers),
                track_batches = COALESCE($16, track_batches),
                is_featured = COALESCE($17, is_featured),
                updated_at = CURRENT_TIMESTAMP
              WHERE id = $18 RETURNING *
            `, [
              childName, listingCat.id, childSlug,
              updates.description !== undefined ? updates.description : null,
              updates.product_type || null,
              updates.brand_id === '' ? null : (updates.brand_id || existingProduct.brand_id),
              updates.retail_price !== undefined ? (updates.retail_price || 0) : null,
              updates.cost_price !== undefined ? (updates.cost_price || 0) : null,
              updates.product_images ? JSON.stringify(updates.product_images) : null,
              updates.has_colors !== undefined ? updates.has_colors : null,
              updates.is_online_available !== undefined ? updates.is_online_available : null,
              updates.short_description !== undefined ? updates.short_description : null,
              updates.reorder_level !== undefined ? (updates.reorder_level || null) : null,
              updates.has_variants !== undefined ? updates.has_variants : null,
              updates.track_serial_numbers !== undefined ? updates.track_serial_numbers : null,
              updates.track_batches !== undefined ? updates.track_batches : null,
              updates.is_featured !== undefined ? updates.is_featured : null,
              id
            ]);
            createdProducts.push(updateResult.rows[0]);
          } else {
            // Create new products for the remaining listing-level categories
            const childCode = await generateProductCode(updates.product_type || existingProduct.product_type);
            const newProduct = await query(`
              INSERT INTO products (
                product_code, product_name, description, product_type,
                category_id, brand_id, base_unit, retail_price, wholesale_base_price,
                cost_price, tax_rate, reorder_level, max_stock_level, product_images,
                model_images, specifications, commission_amount, has_variants,
                track_serial_numbers, track_batches, is_featured,
                is_retail_available, is_wholesale_available, barcode, weight_per_unit,
                is_online_available, short_description, slug, has_colors
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29
              ) RETURNING *
            `, [
              childCode, childName,
              updates.description !== undefined ? updates.description : existingProduct.description,
              updates.product_type || existingProduct.product_type,
              listingCat.id,
              updates.brand_id === '' ? null : (updates.brand_id || existingProduct.brand_id),
              existingProduct.base_unit,
              updates.retail_price !== undefined ? (updates.retail_price || 0) : existingProduct.retail_price,
              existingProduct.wholesale_base_price,
              updates.cost_price !== undefined ? (updates.cost_price || 0) : existingProduct.cost_price,
              existingProduct.tax_rate,
              updates.reorder_level !== undefined ? updates.reorder_level : existingProduct.reorder_level,
              existingProduct.max_stock_level,
              updates.product_images ? JSON.stringify(updates.product_images) : existingProduct.product_images,
              existingProduct.model_images,
              existingProduct.specifications,
              existingProduct.commission_amount,
              updates.has_variants !== undefined ? updates.has_variants : existingProduct.has_variants,
              updates.track_serial_numbers !== undefined ? updates.track_serial_numbers : existingProduct.track_serial_numbers,
              updates.track_batches !== undefined ? updates.track_batches : existingProduct.track_batches,
              updates.is_featured !== undefined ? updates.is_featured : existingProduct.is_featured,
              existingProduct.is_retail_available,
              existingProduct.is_wholesale_available,
              existingProduct.barcode,
              existingProduct.weight_per_unit,
              updates.is_online_available !== undefined ? updates.is_online_available : existingProduct.is_online_available,
              updates.short_description !== undefined ? updates.short_description : existingProduct.short_description,
              childSlug,
              updates.has_colors !== undefined ? updates.has_colors : existingProduct.has_colors
            ]);
            createdProducts.push(newProduct.rows[0]);
          }

          // Auto-create selection-attribute assignments for each product
          const product = createdProducts[createdProducts.length - 1];
          const catPath = await query('SELECT path FROM categories WHERE id = $1', [listingCat.id]);
          if (catPath.rows.length > 0) {
            // Clear existing assignments for this product
            await query('DELETE FROM product_category_assignments WHERE product_id = $1', [product.id]);

            const descendants = await query(
              `SELECT id, level, parent_category_id
               FROM categories
               WHERE path LIKE $1 || '/%' AND is_active = true
               ORDER BY level, display_order`,
              [catPath.rows[0].path]
            );
            // Root assignment
            const rootCatLevel = await query('SELECT level FROM categories WHERE id = $1', [listingCat.id]);
            await query(
              `INSERT INTO product_category_assignments
                (product_id, category_id, category_level, stock_allocated, is_leaf)
               VALUES ($1, $2, $3, 0, $4)
               ON CONFLICT (product_id, category_id) DO NOTHING`,
              [product.id, listingCat.id, rootCatLevel.rows[0]?.level || 1, descendants.rows.length === 0]
            );
            for (const desc of descendants.rows) {
              const isLeaf = !descendants.rows.some(d => d.parent_category_id === desc.id);
              await query(
                `INSERT INTO product_category_assignments
                  (product_id, category_id, category_level, stock_allocated, is_leaf)
                 VALUES ($1, $2, $3, 0, $4)
                 ON CONFLICT (product_id, category_id) DO NOTHING`,
                [product.id, desc.id, desc.level, isLeaf]
              );
            }
          }

          // Fetch selection attributes for response
          const selectionAttrs = await query(
            `SELECT pca.*, c.category_name, c.parent_category_id, c.level as cat_level
             FROM product_category_assignments pca
             JOIN categories c ON c.id = pca.category_id
             WHERE pca.product_id = $1
             ORDER BY c.level, c.display_order`,
            [product.id]
          );
          product.selection_attributes = selectionAttrs.rows;
        }

        // Copy colors and images from the original product to all newly created products
        const originalProductId = parseInt(id);
        const existingColors = await query(
          'SELECT * FROM product_colors WHERE product_id = $1 ORDER BY display_order',
          [originalProductId]
        );
        const existingImages = await query(
          'SELECT * FROM product_images_v2 WHERE product_id = $1 ORDER BY display_order',
          [originalProductId]
        );

        for (let i = 1; i < createdProducts.length; i++) {
          const newProd = createdProducts[i];
          // Copy colors
          const colorIdMap = {}; // old color id -> new color id
          for (const color of existingColors.rows) {
            const newColor = await query(
              `INSERT INTO product_colors (product_id, color_name, color_code, display_order, is_active)
               VALUES ($1, $2, $3, $4, $5) RETURNING *`,
              [newProd.id, color.color_name, color.color_code, color.display_order, color.is_active]
            );
            colorIdMap[color.id] = newColor.rows[0].id;
          }
          // Copy images
          for (const img of existingImages.rows) {
            const newColorId = img.color_id ? (colorIdMap[img.color_id] || null) : null;
            await query(
              `INSERT INTO product_images_v2 (product_id, image_url, color_id, is_primary, display_order, alt_text)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [newProd.id, img.image_url, newColorId, img.is_primary, img.display_order, img.alt_text]
            );
          }
        }

        await query('COMMIT');
        return res.json({ multiple: true, products: createdProducts });
      } catch (error) {
        await query('ROLLBACK');
        throw error;
      }
    }

    // Standard update (no expansion needed)
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
      'is_online_available', 'short_description', 'slug', 'has_colors'
    ];

    // Integer/numeric columns that must not receive empty strings
    const integerFields = [
      'category_id', 'brand_id', 'reorder_level', 'max_stock_level',
    ];
    const numericFields = [
      'retail_price', 'wholesale_base_price', 'cost_price', 'tax_rate',
      'commission_amount', 'weight_per_unit',
    ];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${paramCounter}`);
        // Stringify JSON fields
        if (['product_images', 'model_images', 'specifications'].includes(key)) {
          values.push(JSON.stringify(value));
        } else if (integerFields.includes(key)) {
          values.push(value === '' || value === undefined ? null : value);
        } else if (numericFields.includes(key)) {
          values.push(value === '' || value === undefined ? null : value);
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

// ============================================================================
// PRODUCT COLORS MANAGEMENT
// ============================================================================

const getProductColors = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT * FROM product_colors WHERE product_id = $1 ORDER BY display_order, color_name`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching product colors:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const addProductColor = async (req, res) => {
  try {
    const { id } = req.params;
    const { color_name, color_code, display_order } = req.body;

    if (!color_name) {
      return res.status(400).json({ message: 'Color name is required' });
    }

    const result = await query(
      `INSERT INTO product_colors (product_id, color_name, color_code, display_order)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, color_name, color_code, display_order || 0]
    );

    await query('UPDATE products SET has_colors = true WHERE id = $1', [id]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Color already exists for this product' });
    }
    console.error('Error adding product color:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProductColor = async (req, res) => {
  try {
    const { colorId } = req.params;
    const { color_name, color_code, display_order, is_active } = req.body;

    const result = await query(
      `UPDATE product_colors SET
         color_name = COALESCE($1, color_name),
         color_code = COALESCE($2, color_code),
         display_order = COALESCE($3, display_order),
         is_active = COALESCE($4, is_active)
       WHERE id = $5 RETURNING *`,
      [color_name, color_code, display_order, is_active, colorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Color not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating product color:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteProductColor = async (req, res) => {
  try {
    const { colorId } = req.params;

    await query('BEGIN');

    // Check if color has inventory
    const inventoryCheck = await query(
      'SELECT COUNT(*) FROM inventory_colors WHERE color_id = $1',
      [colorId]
    );

    if (parseInt(inventoryCheck.rows[0].count) > 0) {
      await query('ROLLBACK');
      return res.status(400).json({ message: 'Cannot delete color with existing inventory' });
    }

    // Delete color (images will be set to NULL due to ON DELETE SET NULL)
    await query('DELETE FROM product_colors WHERE id = $1', [colorId]);

    await query('COMMIT');
    res.json({ message: 'Color deleted successfully' });
  } catch (err) {
    await query('ROLLBACK');
    console.error('Error deleting product color:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================================
// PRODUCT IMAGES MANAGEMENT
// ============================================================================

const getProductImages = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT pi.*, pc.color_name, pc.color_code
       FROM product_images_v2 pi
       LEFT JOIN product_colors pc ON pi.color_id = pc.id
       WHERE pi.product_id = $1
       ORDER BY pi.is_primary DESC, pi.display_order, pi.id`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching product images:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const addProductImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { image_url, color_id, is_primary, display_order, alt_text } = req.body;

    if (!image_url) {
      return res.status(400).json({ message: 'Image URL is required' });
    }

    // Validate color_id is a safe integer for PostgreSQL (max 2147483647)
    let safeColorId = color_id || null;
    if (safeColorId !== null) {
      const num = parseInt(safeColorId, 10);
      if (isNaN(num) || num < 1 || num > 2147483647) {
        safeColorId = null; // Discard invalid/temp IDs
      } else {
        safeColorId = num;
      }
    }

    await query('BEGIN');

    // If setting as primary, unset other primary images
    if (is_primary) {
      await query(
        'UPDATE product_images_v2 SET is_primary = false WHERE product_id = $1',
        [id]
      );
    }

    const result = await query(
      `INSERT INTO product_images_v2 (product_id, image_url, color_id, is_primary, display_order, alt_text)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, image_url, safeColorId, is_primary || false, display_order || 0, alt_text || null]
    );

    await query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await query('ROLLBACK');
    console.error('Error adding product image:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProductImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const { color_id, is_primary, display_order, alt_text } = req.body;

    await query('BEGIN');

    // If setting as primary, get product_id and unset others
    if (is_primary) {
      const imgResult = await query('SELECT product_id FROM product_images_v2 WHERE id = $1', [imageId]);
      if (imgResult.rows.length > 0) {
        await query(
          'UPDATE product_images_v2 SET is_primary = false WHERE product_id = $1 AND id != $2',
          [imgResult.rows[0].product_id, imageId]
        );
      }
    }

    const result = await query(
      `UPDATE product_images_v2 SET
         color_id = COALESCE($1, color_id),
         is_primary = COALESCE($2, is_primary),
         display_order = COALESCE($3, display_order),
         alt_text = COALESCE($4, alt_text)
       WHERE id = $5 RETURNING *`,
      [color_id, is_primary, display_order, alt_text, imageId]
    );

    await query('COMMIT');

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Image not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    await query('ROLLBACK');
    console.error('Error updating product image:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteProductImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    await query('DELETE FROM product_images_v2 WHERE id = $1', [imageId]);
    res.json({ message: 'Image deleted successfully' });
  } catch (err) {
    console.error('Error deleting product image:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================================
// COLOR-BASED INVENTORY
// ============================================================================

const getProductColorInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { branch_id } = req.query;

    let queryStr = `
      SELECT
        i.id as inventory_id,
        i.branch_id,
        b.branch_name,
        i.quantity_on_hand as total_quantity,
        pc.id as color_id,
        pc.color_name,
        pc.color_code,
        COALESCE(ic.quantity_on_hand, 0) as color_quantity,
        COALESCE(ic.quantity_reserved, 0) as color_reserved,
        COALESCE(ic.quantity_available, 0) as color_available
      FROM inventory i
      JOIN branches b ON i.branch_id = b.id
      LEFT JOIN product_colors pc ON pc.product_id = i.product_id AND pc.is_active = true
      LEFT JOIN inventory_colors ic ON ic.inventory_id = i.id AND ic.color_id = pc.id
      WHERE i.product_id = $1
    `;

    const params = [id];
    if (branch_id) {
      queryStr += ' AND i.branch_id = $2';
      params.push(branch_id);
    }

    queryStr += ' ORDER BY b.branch_name, pc.display_order, pc.color_name';

    const result = await query(queryStr, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching color inventory:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateColorInventory = async (req, res) => {
  try {
    const { product_id, branch_id, color_id, quantity } = req.body;

    if (!product_id || !branch_id || !color_id || quantity === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    await query('BEGIN');

    // Get inventory_id
    const invResult = await query(
      'SELECT id FROM inventory WHERE product_id = $1 AND branch_id = $2',
      [product_id, branch_id]
    );

    if (invResult.rows.length === 0) {
      await query('ROLLBACK');
      return res.status(404).json({ message: 'Inventory record not found' });
    }

    const inventory_id = invResult.rows[0].id;

    // Upsert color inventory
    await query(
      `INSERT INTO inventory_colors (inventory_id, color_id, quantity_on_hand)
       VALUES ($1, $2, $3)
       ON CONFLICT (inventory_id, color_id)
       DO UPDATE SET quantity_on_hand = $3, updated_at = CURRENT_TIMESTAMP`,
      [inventory_id, color_id, quantity]
    );

    // Update total inventory
    const totalResult = await query(
      'SELECT COALESCE(SUM(quantity_on_hand), 0) as total FROM inventory_colors WHERE inventory_id = $1',
      [inventory_id]
    );

    await query(
      'UPDATE inventory SET quantity_on_hand = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [totalResult.rows[0].total, inventory_id]
    );

    await query('COMMIT');
    res.json({ message: 'Color inventory updated successfully' });
  } catch (err) {
    await query('ROLLBACK');
    console.error('Error updating color inventory:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get aggregated insights grouped by root categories
 * @route GET /api/products/category-groups
 */
const getCategoryGroupInsights = async (req, res) => {
  try {
    const result = await query(`
      WITH root_cats AS (
        SELECT id, category_name, image_url, slug
        FROM categories
        WHERE parent_category_id IS NULL
          AND is_active = true
      ),
      product_data AS (
        SELECT
          rc.id AS root_id,
          p.id AS product_id,
          COALESCE(
            (SELECT SUM(i.quantity_on_hand) FROM inventory i WHERE i.product_id = p.id),
            (SELECT SUM(pca2.stock_allocated) FROM product_category_assignments pca2 WHERE pca2.product_id = p.id),
            0
          ) AS stock,
          COALESCE(p.retail_price, p.selling_price, 0) AS selling_price,
          COALESCE(p.cost_price, 0) AS cost_price,
          p.is_active,
          p.is_featured
        FROM root_cats rc
        JOIN categories c ON c.path LIKE rc.id || '.%' OR c.id = rc.id
        JOIN products p ON (p.category_id = c.id OR EXISTS (
          SELECT 1 FROM product_category_assignments pca
          WHERE pca.product_id = p.id AND pca.category_id = c.id
        ))
        WHERE p.deleted_at IS NULL
        GROUP BY rc.id, p.id, p.retail_price, p.selling_price, p.cost_price, p.is_active, p.is_featured
      )
      SELECT
        rc.id,
        rc.category_name,
        rc.image_url,
        rc.slug,
        COUNT(DISTINCT pd.product_id)::int AS total_products,
        COUNT(DISTINCT pd.product_id) FILTER (WHERE pd.is_active = true)::int AS active_products,
        COUNT(DISTINCT pd.product_id) FILTER (WHERE pd.is_featured = true)::int AS featured_products,
        COALESCE(SUM(pd.stock), 0)::int AS total_stock,
        COALESCE(SUM(pd.selling_price), 0)::numeric AS total_selling_value,
        COALESCE(SUM(pd.cost_price), 0)::numeric AS total_cost_value,
        COALESCE(SUM(pd.stock * pd.selling_price), 0)::numeric AS total_stock_value,
        COALESCE(SUM(pd.stock * pd.cost_price), 0)::numeric AS total_stock_cost,
        COALESCE(MIN(pd.selling_price) FILTER (WHERE pd.selling_price > 0), 0)::numeric AS min_price,
        COALESCE(MAX(pd.selling_price), 0)::numeric AS max_price,
        COALESCE(AVG(pd.selling_price) FILTER (WHERE pd.selling_price > 0), 0)::numeric AS avg_price
      FROM root_cats rc
      LEFT JOIN product_data pd ON pd.root_id = rc.id
      GROUP BY rc.id, rc.category_name, rc.image_url, rc.slug
      ORDER BY rc.category_name
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching category group insights:', err);
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
  getCategoryGroupInsights,
  getProductsWithVariants,
  getBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  // Color management
  getProductColors,
  addProductColor,
  updateProductColor,
  deleteProductColor,
  // Image management
  getProductImages,
  addProductImage,
  updateProductImage,
  deleteProductImage,
  // Color inventory
  getProductColorInventory,
  updateColorInventory,
};
