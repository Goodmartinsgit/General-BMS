const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');
const c = require('../controllers/websiteBuilderController');

router.use(authenticateToken);

// ── Pages ─────────────────────────────────────────────────────────────────────
router.get('/pages', authorize('view_online_store'), c.listPages);
router.post('/pages', authorize('manage_online_store'), c.createPage);
router.put('/pages/:id', authorize('manage_online_store'), c.updatePage);
router.delete('/pages/:id', authorize('manage_online_store'), c.deletePage);

// ── Sections (within a page) ───────────────────────────────────────────────────
router.get('/pages/:pageId/sections', authorize('view_online_store'), c.listSections);
router.post('/pages/:pageId/sections', authorize('manage_online_store'), c.createSection);
router.put('/pages/:pageId/sections/reorder', authorize('manage_online_store'), c.reorderSections);
router.put('/pages/:pageId/sections/:sectionId', authorize('manage_online_store'), c.updateSection);
router.delete('/pages/:pageId/sections/:sectionId', authorize('manage_online_store'), c.deleteSection);

// ── Global content (header, footer, announcement_bar) ─────────────────────────
router.get('/global', authorize('view_online_store'), c.listGlobalContent);
router.put('/global/:section_key', authorize('manage_online_store'), c.upsertGlobalContent);

// ── Navigation menu ────────────────────────────────────────────────────────────
router.get('/navigation', authorize('view_online_store'), c.listNavigation);
router.post('/navigation', authorize('manage_online_store'), c.createNavItem);
router.put('/navigation/reorder', authorize('manage_online_store'), c.reorderNavItems);
router.put('/navigation/:id', authorize('manage_online_store'), c.updateNavItem);
router.delete('/navigation/:id', authorize('manage_online_store'), c.deleteNavItem);

module.exports = router;
