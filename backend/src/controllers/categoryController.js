const { query } = require('../config/db');

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Compute level from parent chain, and build materialized path.
 * Returns { level, path }.
 */
const computeLevelAndPath = async (parentId, ownId) => {
  if (!parentId) {
    return { level: 1, path: String(ownId) };
  }
  const parent = await query('SELECT level, path FROM categories WHERE id = $1', [parentId]);
  if (parent.rows.length === 0) throw new Error('Parent category not found');
  const parentLevel = parent.rows[0].level || 1;
  const parentPath = parent.rows[0].path || String(parentId);
  return {
    level: parentLevel + 1,
    path: `${parentPath}/${ownId}`,
  };
};

/**
 * Recursively update level and path for all descendants of a category.
 */
const updateDescendants = async (parentId, parentLevel, parentPath) => {
  const children = await query(
    'SELECT id FROM categories WHERE parent_category_id = $1',
    [parentId]
  );
  for (const child of children.rows) {
    const childLevel = parentLevel + 1;
    const childPath = `${parentPath}/${child.id}`;
    await query(
      'UPDATE categories SET level = $1, path = $2, updated_at = NOW() WHERE id = $3',
      [childLevel, childPath, child.id]
    );
    await updateDescendants(child.id, childLevel, childPath);
  }
};

/**
 * Recalculate is_selection_attribute across all categories based on product_listing_level.
 */
const recalcSelectionAttributes = async () => {
  const setting = await query(
    "SELECT setting_value FROM settings WHERE setting_key = 'product_listing_level'"
  );
  const listingLevel = setting.rows.length ? parseInt(setting.rows[0].setting_value) : 1;
  await query(
    'UPDATE categories SET is_selection_attribute = (level > $1)',
    [listingLevel]
  );
};

/**
 * Generate a slug from a name.
 */
const slugify = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/**
 * Build a nested tree from a flat array of category rows.
 */
const buildTree = (rows, parentId = null) => {
  return rows
    .filter(r => (r.parent_category_id || null) === parentId)
    .map(r => ({
      ...r,
      children: buildTree(rows, r.id),
    }));
};

// ============================================================================
// CONTROLLERS
// ============================================================================

/**
 * GET /api/categories
 * Returns flat list of categories with product counts and hierarchy info.
 */
const getCategories = async (req, res) => {
  try {
    const { format } = req.query; // ?format=tree for nested
    const result = await query(
      `SELECT c.id, c.category_name, c.description, c.parent_category_id,
              c.level, c.path, c.slug, c.unit_of_measure,
              c.is_selection_attribute, c.is_active, c.display_order,
              c.icon, c.image_url, c.category_type,
              c.created_at, c.updated_at,
              COUNT(DISTINCT p.id)::int AS product_count,
              (SELECT COUNT(*) FROM categories ch WHERE ch.parent_category_id = c.id)::int AS children_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id AND p.deleted_at IS NULL
       GROUP BY c.id
       ORDER BY c.level, c.display_order, c.category_name`
    );

    if (format === 'tree') {
      return res.json(buildTree(result.rows));
    }
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/categories/tree
 * Returns the full category hierarchy as nested JSON.
 */
const getCategoryTree = async (req, res) => {
  try {
    const result = await query(
      `SELECT c.id, c.category_name, c.description, c.parent_category_id,
              c.level, c.path, c.slug, c.unit_of_measure,
              c.is_selection_attribute, c.is_active, c.display_order,
              c.icon, c.image_url,
              COUNT(DISTINCT p.id)::int AS product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id AND p.deleted_at IS NULL
       GROUP BY c.id
       ORDER BY c.level, c.display_order, c.category_name`
    );
    res.json(buildTree(result.rows));
  } catch (err) {
    console.error('Error fetching category tree:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/categories/levels
 * Returns all distinct levels with their category counts.
 */
const getCategoryLevels = async (req, res) => {
  try {
    const result = await query(
      `SELECT level, COUNT(*)::int AS category_count,
              bool_or(is_selection_attribute) AS is_selection_level
       FROM categories
       GROUP BY level
       ORDER BY level`
    );

    const setting = await query(
      "SELECT setting_value FROM settings WHERE setting_key = 'product_listing_level'"
    );
    const listingLevel = setting.rows.length ? parseInt(setting.rows[0].setting_value) : 1;

    res.json({
      levels: result.rows,
      product_listing_level: listingLevel,
    });
  } catch (err) {
    console.error('Error fetching category levels:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/categories/:id
 * Returns a single category with its children.
 */
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT c.*, COUNT(DISTINCT p.id)::int AS product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id AND p.deleted_at IS NULL
       WHERE c.id = $1
       GROUP BY c.id`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Category not found' });

    // Get direct children
    const children = await query(
      `SELECT c.*, COUNT(DISTINCT p.id)::int AS product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id AND p.deleted_at IS NULL
       WHERE c.parent_category_id = $1
       GROUP BY c.id
       ORDER BY c.display_order, c.category_name`,
      [id]
    );

    res.json({
      ...result.rows[0],
      children: children.rows,
    });
  } catch (err) {
    console.error('Error fetching category:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /api/categories
 * Create a category. Accepts parent_category_id for nesting.
 */
const createCategory = async (req, res) => {
  try {
    const {
      category_name, description, parent_category_id,
      unit_of_measure, display_order, icon, image_url,
    } = req.body;

    if (!category_name?.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const slug = slugify(category_name);

    // Insert the category first to get its ID
    const result = await query(
      `INSERT INTO categories
        (category_name, description, parent_category_id, slug,
         unit_of_measure, display_order, icon, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        category_name.trim(),
        description || null,
        parent_category_id || null,
        slug,
        unit_of_measure || null,
        display_order || 0,
        icon || null,
        image_url || null,
      ]
    );

    const newCat = result.rows[0];

    // Compute level and path
    const { level, path } = await computeLevelAndPath(parent_category_id, newCat.id);

    // Determine if this is a selection attribute
    const setting = await query(
      "SELECT setting_value FROM settings WHERE setting_key = 'product_listing_level'"
    );
    const listingLevel = setting.rows.length ? parseInt(setting.rows[0].setting_value) : 1;
    const isSelection = level > listingLevel;

    await query(
      'UPDATE categories SET level = $1, path = $2, is_selection_attribute = $3 WHERE id = $4',
      [level, path, isSelection, newCat.id]
    );

    const updated = await query('SELECT * FROM categories WHERE id = $1', [newCat.id]);
    res.status(201).json(updated.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Category name already exists at this level' });
    }
    console.error('Error creating category:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * PUT /api/categories/:id
 * Update a category. Supports reparenting.
 */
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      category_name, description, parent_category_id,
      unit_of_measure, is_active, display_order, icon, image_url,
    } = req.body;

    // Check if reparenting would create a cycle
    if (parent_category_id) {
      if (parseInt(parent_category_id) === parseInt(id)) {
        return res.status(400).json({ message: 'Category cannot be its own parent' });
      }
      // Check that the new parent is not a descendant
      const descendants = await query(
        "SELECT id FROM categories WHERE path LIKE '%/' || $1 || '/%' OR path LIKE $1 || '/%'",
        [id]
      );
      const descIds = descendants.rows.map(r => r.id);
      if (descIds.includes(parseInt(parent_category_id))) {
        return res.status(400).json({ message: 'Cannot reparent under a descendant (cycle)' });
      }
    }

    const slug = category_name ? slugify(category_name) : undefined;

    const result = await query(
      `UPDATE categories SET
         category_name = COALESCE($1, category_name),
         description = $2,
         parent_category_id = $3,
         slug = COALESCE($4, slug),
         unit_of_measure = $5,
         is_active = COALESCE($6, is_active),
         display_order = COALESCE($7, display_order),
         icon = COALESCE($8, icon),
         image_url = COALESCE($9, image_url),
         updated_at = NOW()
       WHERE id = $10 RETURNING *`,
      [
        category_name?.trim() || null,
        description ?? null,
        parent_category_id !== undefined ? (parent_category_id || null) : undefined,
        slug || null,
        unit_of_measure !== undefined ? (unit_of_measure || null) : undefined,
        is_active ?? null,
        display_order ?? null,
        icon || null,
        image_url || null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Recompute level and path
    const { level, path } = await computeLevelAndPath(
      result.rows[0].parent_category_id,
      id
    );
    await query(
      'UPDATE categories SET level = $1, path = $2 WHERE id = $3',
      [level, path, id]
    );

    // Update all descendants
    await updateDescendants(parseInt(id), level, path);

    // Recalculate selection attributes
    await recalcSelectionAttributes();

    const updated = await query('SELECT * FROM categories WHERE id = $1', [id]);
    res.json(updated.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Category name already exists' });
    }
    console.error('Error updating category:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * DELETE /api/categories/:id
 * Delete a category (blocks if it has children or assigned products).
 */
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Block deletion if children exist
    const childCheck = await query(
      'SELECT COUNT(*)::int AS cnt FROM categories WHERE parent_category_id = $1',
      [id]
    );
    if (childCheck.rows[0].cnt > 0) {
      return res.status(400).json({
        message: 'Cannot delete category with sub-categories. Remove children first.',
      });
    }

    // Block deletion if products are assigned
    const productCheck = await query(
      'SELECT COUNT(*)::int AS cnt FROM products WHERE category_id = $1 AND deleted_at IS NULL',
      [id]
    );
    if (productCheck.rows[0].cnt > 0) {
      return res.status(400).json({
        message: 'Cannot delete category with assigned products.',
      });
    }

    await query('DELETE FROM categories WHERE id = $1', [id]);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/categories/listing-level
 * Returns the configured product listing level.
 */
const getListingLevel = async (req, res) => {
  try {
    const result = await query(
      "SELECT setting_value FROM settings WHERE setting_key = 'product_listing_level'"
    );
    const level = result.rows.length ? parseInt(result.rows[0].setting_value) : 1;
    res.json({ product_listing_level: level });
  } catch (err) {
    console.error('Error fetching listing level:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * PUT /api/categories/listing-level
 * Set the product listing level. Triggers recalculation of is_selection_attribute.
 */
const setListingLevel = async (req, res) => {
  try {
    const { level } = req.body;
    if (!level || level < 1) {
      return res.status(400).json({ message: 'Level must be a positive integer' });
    }

    await query(
      `INSERT INTO settings (setting_key, setting_value, setting_type, category, description)
       VALUES ('product_listing_level', $1, 'number', 'products', 'Category level for product listing')
       ON CONFLICT (setting_key)
       DO UPDATE SET setting_value = $1, updated_at = NOW()`,
      [String(level)]
    );

    // Recalculate all categories
    await recalcSelectionAttributes();

    res.json({ product_listing_level: level, message: 'Listing level updated' });
  } catch (err) {
    console.error('Error setting listing level:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getCategories,
  getCategoryTree,
  getCategoryLevels,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getListingLevel,
  setListingLevel,
};
