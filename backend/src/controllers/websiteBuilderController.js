const db = require('../config/db');
const logger = require('../config/logger');

// ─────────────────────────────────────────────────────────────────────────────
// PAGES
// ─────────────────────────────────────────────────────────────────────────────

exports.listPages = async (req, res) => {
  const orgId = req.user.org_id;
  try {
    const { rows } = await db.query(
      `SELECT p.*,
        (SELECT COUNT(*) FROM website_sections s WHERE s.page_id = p.id) AS section_count
       FROM website_pages p
       WHERE p.org_id = $1
       ORDER BY p.nav_order, p.created_at`,
      [orgId]
    );
    res.json(rows);
  } catch (err) {
    logger.error('websiteBuilder listPages', err);
    res.status(500).json({ message: 'Failed to fetch pages' });
  }
};

exports.createPage = async (req, res) => {
  const orgId = req.user.org_id;
  const {
    title, page_type = 'custom',
    is_active = true, show_in_nav = true,
    nav_label, nav_order = 0,
    meta_title, meta_description, og_image,
  } = req.body;
  // Normalize slug: strip leading/trailing slashes and whitespace
  const slug = (req.body.slug || '').trim().replace(/^\/+|\/+$/g, '');

  if (!title || !slug) return res.status(400).json({ message: 'title and slug are required' });

  try {
    const { rows } = await db.query(
      `INSERT INTO website_pages
         (org_id, title, slug, page_type, is_active, show_in_nav, nav_label, nav_order, meta_title, meta_description, og_image)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [orgId, title, slug, page_type, is_active, show_in_nav, nav_label || title, nav_order, meta_title, meta_description, og_image]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'A page with this slug already exists' });
    logger.error('websiteBuilder createPage', err);
    res.status(500).json({ message: 'Failed to create page' });
  }
};

exports.updatePage = async (req, res) => {
  const orgId = req.user.org_id;
  const { id } = req.params;
  const {
    title, is_active, show_in_nav,
    nav_label, nav_order,
    meta_title, meta_description, og_image,
  } = req.body;
  // Normalize slug if provided
  const slug = req.body.slug != null
    ? req.body.slug.trim().replace(/^\/+|\/+$/g, '')
    : undefined;

  try {
    const { rows } = await db.query(
      `UPDATE website_pages
       SET title            = COALESCE($1,  title),
           slug             = COALESCE($2,  slug),
           is_active        = COALESCE($3,  is_active),
           show_in_nav      = COALESCE($4,  show_in_nav),
           nav_label        = COALESCE($5,  nav_label),
           nav_order        = COALESCE($6,  nav_order),
           meta_title       = COALESCE($7,  meta_title),
           meta_description = COALESCE($8,  meta_description),
           og_image         = COALESCE($9,  og_image),
           updated_at       = NOW()
       WHERE id = $10 AND org_id = $11
       RETURNING *`,
      [title, slug, is_active, show_in_nav, nav_label, nav_order, meta_title, meta_description, og_image, id, orgId]
    );
    if (!rows.length) return res.status(404).json({ message: 'Page not found' });
    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'A page with this slug already exists' });
    logger.error('websiteBuilder updatePage', err);
    res.status(500).json({ message: 'Failed to update page' });
  }
};

exports.deletePage = async (req, res) => {
  const orgId = req.user.org_id;
  const { id } = req.params;
  try {
    const { rows } = await db.query(
      `DELETE FROM website_pages
       WHERE id = $1 AND org_id = $2 AND page_type <> 'home'
       RETURNING id`,
      [id, orgId]
    );
    if (!rows.length) return res.status(404).json({ message: 'Page not found or the home page cannot be deleted' });
    res.json({ message: 'Page deleted' });
  } catch (err) {
    logger.error('websiteBuilder deletePage', err);
    res.status(500).json({ message: 'Failed to delete page' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTIONS
// ─────────────────────────────────────────────────────────────────────────────

const _verifyPageOrg = async (pageId, orgId) => {
  const { rows } = await db.query(
    'SELECT id FROM website_pages WHERE id = $1 AND org_id = $2',
    [pageId, orgId]
  );
  return rows.length > 0;
};

exports.listSections = async (req, res) => {
  const { pageId } = req.params;
  const orgId = req.user.org_id;
  try {
    if (!(await _verifyPageOrg(pageId, orgId))) return res.status(404).json({ message: 'Page not found' });
    const { rows } = await db.query(
      'SELECT * FROM website_sections WHERE page_id = $1 ORDER BY sort_order, id',
      [pageId]
    );
    res.json(rows);
  } catch (err) {
    logger.error('websiteBuilder listSections', err);
    res.status(500).json({ message: 'Failed to fetch sections' });
  }
};

exports.createSection = async (req, res) => {
  const { pageId } = req.params;
  const orgId = req.user.org_id;
  const { section_type, label, content = {}, settings = {}, is_visible = true } = req.body;

  if (!section_type) return res.status(400).json({ message: 'section_type is required' });

  try {
    if (!(await _verifyPageOrg(pageId, orgId))) return res.status(404).json({ message: 'Page not found' });

    const { rows: maxRows } = await db.query(
      'SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM website_sections WHERE page_id = $1',
      [pageId]
    );

    const { rows } = await db.query(
      `INSERT INTO website_sections (page_id, section_type, label, content, settings, is_visible, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [pageId, section_type, label || section_type, JSON.stringify(content), JSON.stringify(settings), is_visible, maxRows[0].next]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    logger.error('websiteBuilder createSection', err);
    res.status(500).json({ message: 'Failed to create section' });
  }
};

exports.updateSection = async (req, res) => {
  const { pageId, sectionId } = req.params;
  const orgId = req.user.org_id;
  const { label, content, settings, is_visible, sort_order } = req.body;

  try {
    if (!(await _verifyPageOrg(pageId, orgId))) return res.status(404).json({ message: 'Page not found' });

    const { rows } = await db.query(
      `UPDATE website_sections
       SET label      = COALESCE($1, label),
           content    = COALESCE($2::jsonb, content),
           settings   = COALESCE($3::jsonb, settings),
           is_visible = COALESCE($4, is_visible),
           sort_order = COALESCE($5, sort_order),
           updated_at = NOW()
       WHERE id = $6 AND page_id = $7
       RETURNING *`,
      [
        label,
        content != null ? JSON.stringify(content) : null,
        settings != null ? JSON.stringify(settings) : null,
        is_visible,
        sort_order,
        sectionId,
        pageId,
      ]
    );
    if (!rows.length) return res.status(404).json({ message: 'Section not found' });
    res.json(rows[0]);
  } catch (err) {
    logger.error('websiteBuilder updateSection', err);
    res.status(500).json({ message: 'Failed to update section' });
  }
};

exports.deleteSection = async (req, res) => {
  const { pageId, sectionId } = req.params;
  const orgId = req.user.org_id;
  try {
    if (!(await _verifyPageOrg(pageId, orgId))) return res.status(404).json({ message: 'Page not found' });
    const { rows } = await db.query(
      'DELETE FROM website_sections WHERE id = $1 AND page_id = $2 RETURNING id',
      [sectionId, pageId]
    );
    if (!rows.length) return res.status(404).json({ message: 'Section not found' });
    res.json({ message: 'Section deleted' });
  } catch (err) {
    logger.error('websiteBuilder deleteSection', err);
    res.status(500).json({ message: 'Failed to delete section' });
  }
};

exports.reorderSections = async (req, res) => {
  const { pageId } = req.params;
  const orgId = req.user.org_id;
  const { order } = req.body; // [{ id, sort_order }]
  if (!Array.isArray(order)) return res.status(400).json({ message: 'order must be an array' });
  try {
    if (!(await _verifyPageOrg(pageId, orgId))) return res.status(404).json({ message: 'Page not found' });
    for (const item of order) {
      await db.query(
        'UPDATE website_sections SET sort_order = $1 WHERE id = $2 AND page_id = $3',
        [item.sort_order, item.id, pageId]
      );
    }
    res.json({ message: 'Sections reordered' });
  } catch (err) {
    logger.error('websiteBuilder reorderSections', err);
    res.status(500).json({ message: 'Failed to reorder sections' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL CONTENT  (header, footer, announcement_bar)
// ─────────────────────────────────────────────────────────────────────────────

exports.listGlobalContent = async (req, res) => {
  const orgId = req.user.org_id;
  try {
    const { rows } = await db.query(
      'SELECT * FROM website_global_content WHERE org_id = $1',
      [orgId]
    );
    const result = {};
    rows.forEach(r => { result[r.section_key] = r; });
    res.json(result);
  } catch (err) {
    logger.error('websiteBuilder listGlobalContent', err);
    res.status(500).json({ message: 'Failed to fetch global content' });
  }
};

exports.upsertGlobalContent = async (req, res) => {
  const orgId = req.user.org_id;
  const { section_key } = req.params;
  const { content = {}, settings = {}, is_visible = true } = req.body;
  try {
    const { rows } = await db.query(
      `INSERT INTO website_global_content (org_id, section_key, content, settings, is_visible, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (org_id, section_key) DO UPDATE
         SET content    = EXCLUDED.content,
             settings   = EXCLUDED.settings,
             is_visible = EXCLUDED.is_visible,
             updated_at = NOW()
       RETURNING *`,
      [orgId, section_key, JSON.stringify(content), JSON.stringify(settings), is_visible]
    );
    res.json(rows[0]);
  } catch (err) {
    logger.error('websiteBuilder upsertGlobalContent', err);
    res.status(500).json({ message: 'Failed to save global content' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────────────────────────────────────────

exports.listNavigation = async (req, res) => {
  const orgId = req.user.org_id;
  const { type = 'header' } = req.query;
  try {
    const { rows } = await db.query(
      `SELECT n.*, p.title AS page_title, p.slug AS page_slug
       FROM website_navigation n
       LEFT JOIN website_pages p ON n.page_id = p.id
       WHERE n.org_id = $1 AND n.nav_type = $2
       ORDER BY n.sort_order, n.id`,
      [orgId, type]
    );
    res.json(rows);
  } catch (err) {
    logger.error('websiteBuilder listNavigation', err);
    res.status(500).json({ message: 'Failed to fetch navigation' });
  }
};

exports.createNavItem = async (req, res) => {
  const orgId = req.user.org_id;
  const {
    nav_type = 'header', label, url,
    page_id, parent_id, sort_order = 0,
    is_active = true, opens_in_new_tab = false,
  } = req.body;
  if (!label) return res.status(400).json({ message: 'label is required' });
  try {
    const { rows } = await db.query(
      `INSERT INTO website_navigation
         (org_id, nav_type, label, url, page_id, parent_id, sort_order, is_active, opens_in_new_tab)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [orgId, nav_type, label, url, page_id || null, parent_id || null, sort_order, is_active, opens_in_new_tab]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    logger.error('websiteBuilder createNavItem', err);
    res.status(500).json({ message: 'Failed to create nav item' });
  }
};

exports.updateNavItem = async (req, res) => {
  const orgId = req.user.org_id;
  const { id } = req.params;
  const { label, url, page_id, sort_order, is_active, opens_in_new_tab } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE website_navigation
       SET label            = COALESCE($1, label),
           url              = COALESCE($2, url),
           page_id          = $3,
           sort_order       = COALESCE($4, sort_order),
           is_active        = COALESCE($5, is_active),
           opens_in_new_tab = COALESCE($6, opens_in_new_tab),
           updated_at       = NOW()
       WHERE id = $7 AND org_id = $8
       RETURNING *`,
      [label, url, page_id || null, sort_order, is_active, opens_in_new_tab, id, orgId]
    );
    if (!rows.length) return res.status(404).json({ message: 'Nav item not found' });
    res.json(rows[0]);
  } catch (err) {
    logger.error('websiteBuilder updateNavItem', err);
    res.status(500).json({ message: 'Failed to update nav item' });
  }
};

exports.deleteNavItem = async (req, res) => {
  const orgId = req.user.org_id;
  const { id } = req.params;
  try {
    const { rows } = await db.query(
      'DELETE FROM website_navigation WHERE id = $1 AND org_id = $2 RETURNING id',
      [id, orgId]
    );
    if (!rows.length) return res.status(404).json({ message: 'Nav item not found' });
    res.json({ message: 'Nav item deleted' });
  } catch (err) {
    logger.error('websiteBuilder deleteNavItem', err);
    res.status(500).json({ message: 'Failed to delete nav item' });
  }
};

exports.reorderNavItems = async (req, res) => {
  const orgId = req.user.org_id;
  const { order } = req.body; // [{ id, sort_order }]
  if (!Array.isArray(order)) return res.status(400).json({ message: 'order must be an array' });
  try {
    for (const item of order) {
      await db.query(
        'UPDATE website_navigation SET sort_order = $1 WHERE id = $2 AND org_id = $3',
        [item.sort_order, item.id, orgId]
      );
    }
    res.json({ message: 'Navigation reordered' });
  } catch (err) {
    logger.error('websiteBuilder reorderNavItems', err);
    res.status(500).json({ message: 'Failed to reorder navigation' });
  }
};
