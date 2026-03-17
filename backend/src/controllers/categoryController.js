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

const recalcSelectionAttributes = async () => {
  await query(`
    UPDATE categories c
    SET is_selection_attribute = EXISTS (
      SELECT 1 FROM categories anc
      WHERE (c.path LIKE anc.path || '/%')
        AND anc.id != c.id
        AND anc.is_listing_category = true
    )
  `);
};

/**
 * Generate a slug from a name.
 */
const slugify = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
/**
 * Enforce single-listing-level rule per tree:
 * Only ONE level within a root tree can be is_listing_category = true.
 * When setting a new level as listing, clear listing from all other levels first.
 */
const syncListingLevel = async (categoryId, isListing) => {
  const cat = await query('SELECT level, path FROM categories WHERE id = $1', [categoryId]);
  if (cat.rows.length === 0) return;
  const { level, path } = cat.rows[0];
  const rootId = path.split('/')[0];

  // First: clear listing from ALL categories in this tree
  await query(
    `UPDATE categories
     SET is_listing_category = false
     WHERE path LIKE $1 || '/%' OR id = $1::int`,
    [rootId]
  );

  // Then: if enabling, set listing on all categories at the target level in this tree
  if (isListing) {
    await query(
      `UPDATE categories
       SET is_listing_category = true
       WHERE level = $1 AND (path LIKE $2 || '/%' OR id = $2::int)`,
      [level, rootId]
    );
  }
};

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
              c.is_selection_attribute, c.is_listing_category, c.is_active, c.display_order,
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
              c.is_selection_attribute, c.is_listing_category, c.is_active, c.display_order,
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

const getCategoryLevels = async (req, res) => {
  try {
    const result = await query(
      `SELECT level, COUNT(*)::int AS category_count,
              bool_or(is_selection_attribute) AS is_selection_level
       FROM categories
       GROUP BY level
       ORDER BY level`
    );

    res.json({
      levels: result.rows,
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
      unit_of_measure, display_order, icon, image_url, is_listing_category
    } = req.body;

    if (!category_name?.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const slug = slugify(category_name);

    // Insert the category first to get its ID
    const result = await query(
      `INSERT INTO categories
        (category_name, description, parent_category_id, slug,
         unit_of_measure, display_order, icon, image_url, is_listing_category)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
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
        is_listing_category || false,
      ]
    );

    const newCat = result.rows[0];

    // Compute level and path
    const { level, path } = await computeLevelAndPath(parent_category_id, newCat.id);

    await query(
      'UPDATE categories SET level = $1, path = $2 WHERE id = $3',
      [level, path, newCat.id]
    );

    // Sync sibling listing status if this is a listing category or if siblings are already listing
    if (is_listing_category) {
      await syncListingLevel(newCat.id, true);
    } else {
      // Check if siblings are listing levels
      const siblings = await query(
        `SELECT is_listing_category FROM categories 
         WHERE parent_category_id = $1 AND id != $2 AND is_listing_category = true LIMIT 1`,
        [parent_category_id || null, newCat.id]
      );
      if (siblings.rows.length > 0) {
        await query('UPDATE categories SET is_listing_category = true WHERE id = $1', [newCat.id]);
      }
    }

    await recalcSelectionAttributes();

    const updated = await query('SELECT * FROM categories WHERE id = $1', [newCat.id]);
    res.status(201).json(updated.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      if (err.constraint === 'idx_categories_parent_name' || err.constraint === 'idx_categories_parent_slug') {
        return res.status(400).json({ 
          message: parent_category_id 
            ? 'A category with this name already exists under the same parent category' 
            : 'A category with this name already exists at the root level'
        });
      }
      return res.status(400).json({ message: 'Category already exists' });
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
      unit_of_measure, is_active, display_order, icon, image_url, is_listing_category
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

    // Capture the old category name before updating (for product name propagation)
    let oldCategoryName = null;
    if (category_name) {
      const oldCatRes = await query('SELECT category_name FROM categories WHERE id = $1', [id]);
      oldCategoryName = oldCatRes.rows[0]?.category_name || null;
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
         is_listing_category = COALESCE($10, is_listing_category),
         updated_at = NOW()
       WHERE id = $11 RETURNING *`,
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
        is_listing_category ?? null,
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

    // Sync listing status across siblings at this level in the same branch
    if (is_listing_category !== undefined) {
      await syncListingLevel(id, is_listing_category);
    }

    // Recalculate selection attributes
    await recalcSelectionAttributes();

    // If category name changed, propagate to linked product names
    // Use base_product_name to reconstruct the full name reliably
    const newCatName = category_name?.trim();
    if (newCatName && oldCategoryName && newCatName !== oldCategoryName) {
      const linkedProducts = await query(
        `SELECT id, product_name, base_product_name FROM products
         WHERE category_id = $1 AND deleted_at IS NULL`,
        [id]
      );
      for (const prod of linkedProducts.rows) {
        // If product has base_product_name, reconstruct using it; otherwise fall back to string replace
        let updatedName;
        if (prod.base_product_name) {
          updatedName = `${prod.base_product_name} (${newCatName})`;
        } else {
          updatedName = prod.product_name.replace(
            ` (${oldCategoryName})`, ` (${newCatName})`
          );
        }
        if (updatedName !== prod.product_name) {
          const updatedSlug = updatedName.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')
            + '-' + Date.now();
          await query(
            `UPDATE products SET product_name = $1, slug = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
            [updatedName, updatedSlug, prod.id]
          );
        }
      }
    }

    const updated = await query('SELECT * FROM categories WHERE id = $1', [id]);
    res.json(updated.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      if (err.constraint === 'idx_categories_parent_name' || err.constraint === 'idx_categories_parent_slug') {
        return res.status(400).json({ 
          message: 'A category with this name already exists under the same parent category'
        });
      }
      return res.status(400).json({ message: 'Category already exists' });
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

// ============================================================================
// PRODUCT CATEGORY ASSIGNMENTS (Stock & Price per selection-level node)
// ============================================================================

/**
 * GET /api/categories/assignments/:productId
 * Get all category assignments for a product.
 */
const getProductAssignments = async (req, res) => {
  try {
    const { productId } = req.params;
    const result = await query(
      `SELECT pca.*, c.category_name, c.level, c.parent_category_id,
              c.unit_of_measure, c.path
       FROM product_category_assignments pca
       JOIN categories c ON c.id = pca.category_id
       WHERE pca.product_id = $1
       ORDER BY c.level, c.display_order, c.category_name`,
      [productId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching product assignments:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /api/categories/assignments/:productId
 * Batch save category assignments for a product.
 * Enforces hard stock balancing: parent.stock == SUM(children.stock) at every non-leaf level.
 *
 * Body: { assignments: [{ category_id, price_override, stock_allocated, is_leaf }] }
 */
const saveProductAssignments = async (req, res) => {
  try {
    const { productId } = req.params;
    const { assignments = [] } = req.body;

    if (!Array.isArray(assignments)) {
      return res.status(400).json({ message: 'assignments must be an array' });
    }

    // ── Stock balancing validation ──────────────────────────────────
    // Build a map of category_id -> assignment for quick lookup
    const assignMap = {};
    for (const a of assignments) {
      assignMap[a.category_id] = a;
    }

    // Load category tree info for these categories
    const catIds = assignments.map(a => a.category_id);
    if (catIds.length > 0) {
      const catsResult = await query(
        `SELECT id, parent_category_id, level FROM categories WHERE id = ANY($1)`,
        [catIds]
      );
      const catsMap = {};
      for (const c of catsResult.rows) {
        catsMap[c.id] = c;
      }

      // For every non-leaf assignment, check that SUM(children) == parent stock
      for (const a of assignments) {
        if (a.is_leaf) continue;
        const cat = catsMap[a.category_id];
        if (!cat) continue;

        // Find children in the assignment list that have this category as parent
        const childAssignments = assignments.filter(ch => {
          const childCat = catsMap[ch.category_id];
          return childCat && childCat.parent_category_id === cat.id;
        });

        if (childAssignments.length === 0) continue; // No children submitted, skip

        const childTotal = childAssignments.reduce(
          (sum, ch) => sum + (parseInt(ch.stock_allocated) || 0),
          0
        );
        const parentStock = parseInt(a.stock_allocated) || 0;

        if (childTotal !== parentStock) {
          const catInfo = catsMap[a.category_id];
          return res.status(400).json({
            message: `Stock imbalance: Category ID ${a.category_id} has ${parentStock} units allocated, but its children total ${childTotal} units. Stock must balance exactly.`,
            error_type: 'STOCK_IMBALANCE',
            category_id: a.category_id,
            parent_stock: parentStock,
            children_total: childTotal,
          });
        }
      }
    }

    // ── Save assignments in a transaction ───────────────────────────
    await query('BEGIN');

    try {
      // Delete existing assignments for this product
      await query(
        'DELETE FROM product_category_assignments WHERE product_id = $1',
        [productId]
      );

      // Insert new assignments
      const insertedCatIds = new Set();
      for (const a of assignments) {
        // Get the category level
        const catResult = await query('SELECT level FROM categories WHERE id = $1', [a.category_id]);
        const catLevel = catResult.rows.length ? catResult.rows[0].level : 1;

        await query(
          `INSERT INTO product_category_assignments
            (product_id, category_id, category_level, price_override, cost_price_override, image_url, stock_allocated, is_leaf, display_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            productId,
            a.category_id,
            catLevel,
            a.price_override || null,
            a.cost_price_override || null,
            a.image_url || null,
            parseInt(a.stock_allocated) || 0,
            a.is_leaf || false,
            a.display_order || 0,
          ]
        );
        insertedCatIds.add(parseInt(a.category_id));
      }

      // Auto-ensure the product's own category_id has a root assignment
      // (the subtree API excludes the root, so it may be missing from the submitted list)
      const productRes = await query('SELECT category_id FROM products WHERE id = $1', [productId]);
      if (productRes.rows.length > 0) {
        const productCatId = productRes.rows[0].category_id;
        if (productCatId && !insertedCatIds.has(productCatId)) {
          const rootCatRes = await query('SELECT level FROM categories WHERE id = $1', [productCatId]);
          const rootLevel = rootCatRes.rows.length ? rootCatRes.rows[0].level : 1;
          // Compute stock as sum of direct leaf children
          const leafStock = assignments
            .filter(a => a.is_leaf)
            .reduce((sum, a) => sum + (parseInt(a.stock_allocated) || 0), 0);
          await query(
            `INSERT INTO product_category_assignments
              (product_id, category_id, category_level, stock_allocated, is_leaf, display_order)
             VALUES ($1, $2, $3, $4, false, 0)`,
            [productId, productCatId, rootLevel, leafStock]
          );
        }
      }

      await query('COMMIT');

      // Return the saved assignments
      const saved = await query(
        `SELECT pca.*, c.category_name, c.level, c.parent_category_id, c.unit_of_measure
         FROM product_category_assignments pca
         JOIN categories c ON c.id = pca.category_id
         WHERE pca.product_id = $1
         ORDER BY c.level, c.display_order`,
        [productId]
      );

      res.json(saved.rows);
    } catch (err) {
      await query('ROLLBACK');
      throw err;
    }
  } catch (err) {
    console.error('Error saving product assignments:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/categories/:id/subtree
 * Get the full subtree under a category (selection-level children for product assignment UI).
 */
const getSubcategoryTree = async (req, res) => {
  try {
    const { id } = req.params;

    // Get the category and all descendants using the path column
    const parent = await query('SELECT path FROM categories WHERE id = $1', [id]);
    if (parent.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    const parentPath = parent.rows[0].path;

    const result = await query(
      `SELECT id, category_name, description, parent_category_id,
              level, path, unit_of_measure, is_selection_attribute, is_listing_category,
              is_active, display_order
       FROM categories
       WHERE path LIKE $1 || '/%'
       ORDER BY level, display_order, category_name`,
      [parentPath]
    );

    // Build tree from these descendants
    const tree = buildTree(result.rows, parseInt(id));
    res.json(tree);
  } catch (err) {
    console.error('Error fetching subtree:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/categories/by-level/:level
 * Get all categories at a specific level.
 */
const getCategoriesByLevel = async (req, res) => {
  try {
    const { level } = req.params;
    const result = await query(
      `SELECT c.*, COUNT(DISTINCT p.id)::int AS product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id AND p.deleted_at IS NULL
       WHERE c.level = $1 AND c.is_active = true
       GROUP BY c.id
       ORDER BY c.display_order, c.category_name`,
      [parseInt(level)]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching categories by level:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/categories/:id/listing-level
 * Get the listing-level categories within a root category's tree.
 * Used by the product form to show which products will be auto-generated.
 */
const getListingLevelCategories = async (req, res) => {
  try {
    const { id } = req.params;
    const rootCat = await query('SELECT id, path FROM categories WHERE id = $1', [parseInt(id)]);
    if (rootCat.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    const rootPath = rootCat.rows[0].path;

    const result = await query(
      `SELECT id, category_name, level, path, parent_category_id
       FROM categories
       WHERE is_listing_category = true AND is_active = true
         AND (path LIKE $1 || '/%' OR id = $2)
       ORDER BY level, display_order, category_name`,
      [rootPath, parseInt(id)]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching listing-level categories:', err);
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
  getProductAssignments,
  saveProductAssignments,
  getSubcategoryTree,
  getCategoriesByLevel,
  getListingLevelCategories,
};
