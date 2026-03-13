const { query } = require('../config/db');

// GET /api/store/:slug/products
// Supports: ?page=1&limit=20&search=&category=&minPrice=&maxPrice=&inStock=&sort=newest|price_asc|price_desc|name_asc|name_desc|popular
const getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category, minPrice, maxPrice, inStock, sort = 'newest' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const params = [];
    let whereClause = `WHERE p.is_online_available = true AND p.deleted_at IS NULL`;

    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (p.product_name ILIKE $${params.length} OR p.short_description ILIKE $${params.length})`;
    }
    if (category) {
      params.push(category);
      whereClause += ` AND (c.slug = $${params.length} OR c.id::text = $${params.length})`;
    }
    if (minPrice) {
      params.push(parseFloat(minPrice));
      whereClause += ` AND p.retail_price >= $${params.length}`;
    }
    if (maxPrice) {
      params.push(parseFloat(maxPrice));
      whereClause += ` AND p.retail_price <= $${params.length}`;
    }
    if (inStock === 'true') {
      whereClause += ` AND COALESCE(inv.total_qty, 0) > 0`;
    }

    const sortMap = {
      newest: 'p.created_at DESC',
      price_asc: 'p.retail_price ASC',
      price_desc: 'p.retail_price DESC',
      name_asc: 'p.product_name ASC',
      name_desc: 'p.product_name DESC',
      popular: 'p.sale_count DESC',
    };
    const orderBy = sortMap[sort] || 'p.created_at DESC';

    const baseQuery = `
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN (
        SELECT product_id, SUM(quantity_available) as total_qty
        FROM inventory GROUP BY product_id
      ) inv ON inv.product_id = p.id
      ${whereClause}
    `;

    const countResult = await query(`SELECT COUNT(*) ${baseQuery}`, params);
    const total = parseInt(countResult.rows[0].count);

    params.push(parseInt(limit));
    params.push(offset);
    const dataResult = await query(
      `SELECT p.id, p.slug, p.product_name as name, p.short_description, p.description,
              p.retail_price as price, p.cost_price as compare_at_price,
              p.product_images as images, p.is_featured,
              p.has_variants, p.product_code as sku, p.barcode,
              c.id as category_id, c.category_name as category_name, c.slug as category_slug,
              COALESCE(inv.total_qty, 0) as stock_quantity,
              COALESCE(inv.total_qty, 0) > 0 as in_stock,
              p.sale_count, p.view_count, p.created_at
       ${baseQuery}
       ORDER BY ${orderBy}
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      products: dataResult.rows.map(formatProduct),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
        hasMore: offset + parseInt(limit) < total,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/store/:slug/products/featured
const getFeaturedProducts = async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    const result = await query(
      `SELECT p.id, p.slug, p.product_name as name, p.short_description,
              p.retail_price as price, p.product_images as images,
              p.has_variants, p.product_code as sku,
              c.category_name as category_name, c.slug as category_slug,
              COALESCE(inv.total_qty, 0) > 0 as in_stock,
              COALESCE(inv.total_qty, 0) as stock_quantity
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN (SELECT product_id, SUM(quantity_available) as total_qty FROM inventory GROUP BY product_id) inv ON inv.product_id = p.id
       WHERE p.is_online_available = true AND p.is_featured = true AND p.deleted_at IS NULL
       ORDER BY p.created_at DESC
       LIMIT $1`,
      [parseInt(limit)]
    );
    res.json(result.rows.map(formatProduct));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/store/:slug/products/:productSlug
const getProductBySlug = async (req, res) => {
  try {
    const { productSlug } = req.params;
    const result = await query(
      `SELECT p.*, c.category_name as category_name, c.slug as category_slug,
              c.level as category_level, c.parent_category_id,
              COALESCE(inv.total_qty, 0) as stock_quantity,
              COALESCE(inv.total_qty, 0) > 0 as in_stock
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN (SELECT product_id, SUM(quantity_available) as total_qty FROM inventory GROUP BY product_id) inv ON inv.product_id = p.id
       WHERE (p.slug = $1 OR p.id::text = $1) AND p.is_online_available = true AND p.deleted_at IS NULL`,
      [productSlug]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Product not found' });

    const product = result.rows[0];

    // Get variants and options if product has them
    let variants = [];
    let options = [];
    if (product.has_variants) {
      const varResult = await query(
        `SELECT pv.*, vi.total_available as stock
         FROM product_variants pv
         LEFT JOIN (SELECT variant_id, SUM(COALESCE(quantity_on_hand,0) - COALESCE(quantity_reserved,0)) as total_available FROM variant_inventory GROUP BY variant_id) vi ON vi.variant_id = pv.id
         WHERE pv.product_id = $1`,
        [product.id]
      );
      variants = varResult.rows.map(v => ({
        id: String(v.id),
        name: v.variant_name || '',
        sku: v.sku,
        price: parseFloat(v.retail_price || v.price || 0),
        compareAtPrice: v.cost_price ? parseFloat(v.cost_price) : null,
        inStock: (parseInt(v.stock) || 0) > 0,
        stockQuantity: parseInt(v.stock) || 0,
        options: v.variant_values || {},
        image: v.image_url ? { id: String(v.id), url: v.image_url, alt: '', position: 0 } : undefined,
      }));

      // Derive options from variant_values across all variants
      const optionMap = new Map();
      for (const v of variants) {
        if (v.options && typeof v.options === 'object') {
          for (const [key, value] of Object.entries(v.options)) {
            if (!optionMap.has(key)) optionMap.set(key, new Set());
            optionMap.get(key).add(value);
          }
        }
      }
      let optIdx = 0;
      for (const [name, valuesSet] of optionMap) {
        options.push({ id: String(optIdx++), name, values: Array.from(valuesSet) });
      }
    }

    // Get category assignments (selection-level attributes with stock/price/image)
    let categoryAssignments = [];
    const assignResult = await query(
      `SELECT pca.category_id, pca.price_override, pca.cost_price_override,
              pca.stock_allocated, pca.is_leaf, pca.image_url,
              c.category_name, c.level, c.parent_category_id, c.unit_of_measure, c.slug as category_slug
       FROM product_category_assignments pca
       JOIN categories c ON c.id = pca.category_id
       WHERE pca.product_id = $1
       ORDER BY c.level, c.display_order, c.category_name`,
      [product.id]
    );
    categoryAssignments = assignResult.rows.map(a => ({
      categoryId: a.category_id,
      categoryName: a.category_name,
      categorySlug: a.category_slug,
      level: a.level,
      parentCategoryId: a.parent_category_id,
      unitOfMeasure: a.unit_of_measure,
      priceOverride: a.price_override ? parseFloat(a.price_override) : null,
      costPriceOverride: a.cost_price_override ? parseFloat(a.cost_price_override) : null,
      imageUrl: a.image_url || null,
      stockAllocated: parseInt(a.stock_allocated) || 0,
      isLeaf: a.is_leaf,
    }));

    // Get product colors
    let colors = [];
    const colorResult = await query(
      `SELECT id, color_name, color_code, display_order
       FROM product_colors
       WHERE product_id = $1 AND is_active = true
       ORDER BY display_order, id`,
      [product.id]
    );
    colors = colorResult.rows.map(c => ({
      id: c.id,
      name: c.color_name,
      code: c.color_code,
      displayOrder: c.display_order,
    }));

    // Get structured product images from product_images_v2
    let structuredImages = [];
    const imgResult = await query(
      `SELECT pi.id, pi.image_url, pi.alt_text, pi.display_order, pi.is_primary, pi.color_id
       FROM product_images_v2 pi
       WHERE pi.product_id = $1
       ORDER BY pi.is_primary DESC, pi.display_order, pi.id`,
      [product.id]
    );
    structuredImages = imgResult.rows.map(img => ({
      id: String(img.id),
      url: img.image_url,
      alt: img.alt_text || '',
      position: img.display_order || 0,
      isPrimary: img.is_primary,
      colorId: img.color_id,
    }));

    // Increment view count
    query(`UPDATE products SET view_count = view_count + 1 WHERE id = $1`, [product.id]).catch(() => {});

    const detail = formatProductDetail(product);
    // Use structured images if available, otherwise fall back to legacy JSONB images
    if (structuredImages.length > 0) {
      detail.images = structuredImages;
      detail.thumbnail = structuredImages[0]?.url || detail.image;
    }

    res.json({ ...detail, variants, options, categoryAssignments, colors });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/store/:slug/categories
const getCategories = async (req, res) => {
  try {
    const { format } = req.query; // ?format=tree for nested
    const result = await query(
      `SELECT c.id, c.category_name as name, c.slug, c.description, c.image_url,
              c.parent_category_id, c.level, c.unit_of_measure,
              c.is_selection_attribute, c.display_order,
              COUNT(p.id) FILTER (WHERE p.is_online_available = true AND p.deleted_at IS NULL)::int as product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
       WHERE c.is_active = true
       GROUP BY c.id
       ORDER BY c.level, c.display_order, c.category_name ASC`
    );

    // Map to camelCase for store frontend
    const mapped = result.rows.map(r => ({
      id: String(r.id),
      name: r.name,
      slug: r.slug,
      description: r.description,
      image: r.image_url,
      parentId: r.parent_category_id ? String(r.parent_category_id) : null,
      level: r.level || 1,
      unitOfMeasure: r.unit_of_measure,
      isSelectionAttribute: r.is_selection_attribute,
      productCount: parseInt(r.product_count) || 0,
    }));

    // Filter out selection-attribute categories from browsing navigation
    const browsable = mapped.filter(c => !c.isSelectionAttribute);

    if (format === 'tree') {
      return res.json(buildStoreCategoryTree(browsable));
    }

    // Default: return nested tree for browsing-level categories
    res.json(buildStoreCategoryTree(browsable));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Build a nested tree from flat mapped categories for the store.
 */
function buildStoreCategoryTree(cats, parentId = null) {
  return cats
    .filter(c => c.parentId === parentId)
    .map(c => ({
      ...c,
      children: buildStoreCategoryTree(cats, c.id),
    }))
    .filter(c => c.productCount > 0 || (c.children && c.children.length > 0));
}

// GET /api/store/:slug/categories/:categorySlug — products in a category
const getProductsByCategory = async (req, res) => {
  try {
    const { categorySlug } = req.params;
    const { page = 1, limit = 20, sort = 'newest' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const catResult = await query(
      `SELECT * FROM categories WHERE slug = $1 OR id::text = $1 LIMIT 1`,
      [categorySlug]
    );
    if (catResult.rows.length === 0) return res.status(404).json({ message: 'Category not found' });
    const cat = catResult.rows[0];

    const sortMap = {
      newest: 'p.created_at DESC', price_asc: 'p.retail_price ASC',
      price_desc: 'p.retail_price DESC', name_asc: 'p.product_name ASC', popular: 'p.sale_count DESC',
    };
    const orderBy = sortMap[sort] || 'p.created_at DESC';

    const countRes = await query(
      `SELECT COUNT(*) FROM products p WHERE p.category_id = $1 AND p.is_online_available = true AND p.deleted_at IS NULL`,
      [cat.id]
    );

    const dataRes = await query(
      `SELECT p.id, p.slug, p.product_name as name, p.short_description,
              p.retail_price as price, p.product_images as images,
              p.has_variants, p.is_featured,
              COALESCE(inv.total_qty, 0) > 0 as in_stock,
              COALESCE(inv.total_qty, 0) as stock_quantity
       FROM products p
       LEFT JOIN (SELECT product_id, SUM(quantity_available) as total_qty FROM inventory GROUP BY product_id) inv ON inv.product_id = p.id
       WHERE p.category_id = $1 AND p.is_online_available = true AND p.deleted_at IS NULL
       ORDER BY ${orderBy} LIMIT $2 OFFSET $3`,
      [cat.id, parseInt(limit), offset]
    );

    const total = parseInt(countRes.rows[0].count);
    res.json({
      category: cat,
      products: dataRes.rows.map(formatProduct),
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/store/:slug/bank-channels — active bank channels for bank transfer payment
const getBankChannels = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, channel_name, channel_type, account_number, account_name, bank_name
       FROM bank_channels
       WHERE is_active = true AND channel_type IN ('bank', 'mobile_money', 'cash')
       ORDER BY channel_type, channel_name`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/store/track-order?number=&email=
const trackOrder = async (req, res) => {
  try {
    const { number, email } = req.query;
    if (!number || !email) return res.status(400).json({ message: 'Order number and email required' });

    const result = await query(
      `SELECT o.id, o.order_number, o.status, o.payment_status, o.payment_method,
              o.customer_name, o.customer_email,
              o.shipping_address, o.tracking_number, o.shipping_carrier,
              o.estimated_delivery, o.delivered_at, o.status_history,
              o.subtotal, o.shipping_amount, o.tax_amount, o.discount_amount, o.total, o.currency,
              o.created_at, o.confirmed_at, o.shipped_at
       FROM online_orders o
       WHERE o.order_number = $1 AND LOWER(o.customer_email) = LOWER($2)`,
      [number, email]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Order not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

function formatProduct(row) {
  const rawImages = Array.isArray(row.images) ? row.images : (row.images || []);
  // Normalize images to { id, url, alt, position } objects
  const images = rawImages.map((img, i) => {
    if (typeof img === 'string') return { id: String(i), url: img, alt: '', position: i };
    if (img && typeof img === 'object') return { id: String(img.id || i), url: img.url || img.image_url || '', alt: img.alt || img.alt_text || '', position: img.position ?? img.display_order ?? i };
    return null;
  }).filter(Boolean);
  const thumbnail = images[0]?.url || null;
  return {
    id: row.id,
    slug: row.slug || String(row.id),
    name: row.name || row.product_name,
    shortDescription: row.short_description,
    description: row.description,
    price: parseFloat(row.price || row.retail_price || 0),
    compareAtPrice: row.compare_at_price ? parseFloat(row.compare_at_price) : null,
    images: images,
    thumbnail: thumbnail,
    inStock: Boolean(row.in_stock),
    stockQuantity: parseInt(row.stock_quantity || 0),
    hasVariants: Boolean(row.has_variants),
    sku: row.sku || row.product_code,
    barcode: row.barcode,
    category: row.category_name ? { id: row.category_id, name: row.category_name, slug: row.category_slug } : null,
    isFeatured: Boolean(row.is_featured),
    saleCount: parseInt(row.sale_count || 0),
    createdAt: row.created_at,
  };
}

function formatProductDetail(row) {
  return {
    ...formatProduct(row),
    specifications: row.specifications,
    weight: row.weight_per_unit,
    trackSerialNumbers: row.track_serial_numbers,
    trackBatches: row.track_batches,
  };
}

// GET /api/store/:slug/pages/:pageSlug
// Returns a published custom page with its sections for the storefront.
const getPageBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    // Strip any leading slash the user may have saved in the DB
    const pageSlug = req.params.pageSlug.replace(/^\/+/, '');

    // Resolve org from store_config
    const cfgRes = await query(
      `SELECT organization_id FROM store_config WHERE store_slug = $1 AND is_active = true LIMIT 1`,
      [slug]
    );
    if (!cfgRes.rows.length) return res.status(404).json({ message: 'Store not found' });
    const orgId = cfgRes.rows[0].organization_id;
    if (!orgId) return res.status(404).json({ message: 'Store not configured' });

    // Fetch the page
    const pageRes = await query(
      `SELECT id, title, slug, meta_title, meta_description, og_image
       FROM website_pages
       WHERE org_id = $1 AND slug = $2 AND is_active = true`,
      [orgId, pageSlug]
    );
    if (!pageRes.rows.length) return res.status(404).json({ message: 'Page not found' });
    const page = pageRes.rows[0];

    // Fetch its visible sections in order
    const sectionsRes = await query(
      `SELECT section_type, label, content, settings
       FROM website_sections
       WHERE page_id = $1 AND is_visible = true
       ORDER BY sort_order, id`,
      [page.id]
    );

    res.json({ ...page, sections: sectionsRes.rows });
  } catch (err) {
    console.error('getPageBySlug', err);
    res.status(500).json({ message: 'Failed to load page' });
  }
};

// GET /api/store/:slug/pages
// Returns all active custom pages (for nav/sitemap use).
const listPages = async (req, res) => {
  try {
    const { slug } = req.params;
    const cfgRes = await query(
      `SELECT organization_id FROM store_config WHERE store_slug = $1 AND is_active = true LIMIT 1`,
      [slug]
    );
    if (!cfgRes.rows.length) return res.status(404).json({ message: 'Store not found' });
    const orgId = cfgRes.rows[0].organization_id;
    if (!orgId) return res.json([]);

    const { rows } = await query(
      `SELECT id, title, slug, nav_label, show_in_nav, nav_order
       FROM website_pages
       WHERE org_id = $1 AND is_active = true
       ORDER BY nav_order, created_at`,
      [orgId]
    );
    res.json(rows);
  } catch (err) {
    console.error('listPages (public)', err);
    res.status(500).json({ message: 'Failed to load pages' });
  }
};

module.exports = { getProducts, getFeaturedProducts, getProductBySlug, getCategories, getProductsByCategory, getBankChannels, trackOrder, getPageBySlug, listPages };
