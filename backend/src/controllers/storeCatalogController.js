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

    // Get variants if product has them
    let variants = [];
    if (product.has_variants) {
      const varResult = await query(
        `SELECT pv.*, vi.quantity_available as stock
         FROM product_variants pv
         LEFT JOIN (SELECT variant_id, SUM(quantity_available) as quantity_available FROM variant_inventory GROUP BY variant_id) vi ON vi.variant_id = pv.id
         WHERE pv.product_id = $1 AND pv.deleted_at IS NULL`,
        [product.id]
      );
      variants = varResult.rows;
    }

    // Increment view count
    query(`UPDATE products SET view_count = view_count + 1 WHERE id = $1`, [product.id]).catch(() => {});

    res.json({ ...formatProductDetail(product), variants });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/store/:slug/categories
const getCategories = async (req, res) => {
  try {
    const result = await query(
      `SELECT c.id, c.category_name as name, c.slug, c.description, c.image_url,
              COUNT(p.id) FILTER (WHERE p.is_online_available = true AND p.deleted_at IS NULL) as product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
       WHERE c.is_active = true
       GROUP BY c.id
       HAVING COUNT(p.id) FILTER (WHERE p.is_online_available = true AND p.deleted_at IS NULL) > 0
       ORDER BY c.category_name ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

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
  const images = Array.isArray(row.images) ? row.images : (row.images || []);
  return {
    id: row.id,
    slug: row.slug || String(row.id),
    name: row.name || row.product_name,
    shortDescription: row.short_description,
    description: row.description,
    price: parseFloat(row.price || row.retail_price || 0),
    compareAtPrice: row.compare_at_price ? parseFloat(row.compare_at_price) : null,
    images: images,
    image: images[0] || null,
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

module.exports = { getProducts, getFeaturedProducts, getProductBySlug, getCategories, getProductsByCategory, getBankChannels, trackOrder };
