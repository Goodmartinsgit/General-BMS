const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const c = require('../controllers/websiteBuilderController');

router.use(authenticateToken);

// ── Pages ─────────────────────────────────────────────────────────────────────
router.get('/pages', c.listPages);
router.post('/pages', c.createPage);
router.put('/pages/:id', c.updatePage);
router.delete('/pages/:id', c.deletePage);

// ── Sections (within a page) ───────────────────────────────────────────────────
router.get('/pages/:pageId/sections', c.listSections);
router.post('/pages/:pageId/sections', c.createSection);
router.put('/pages/:pageId/sections/reorder', c.reorderSections);   // before :sectionId
router.put('/pages/:pageId/sections/:sectionId', c.updateSection);
router.delete('/pages/:pageId/sections/:sectionId', c.deleteSection);

// ── Global content (header, footer, announcement_bar) ─────────────────────────
router.get('/global', c.listGlobalContent);
router.put('/global/:section_key', c.upsertGlobalContent);

// ── Navigation menu ────────────────────────────────────────────────────────────
router.get('/navigation', c.listNavigation);          // ?type=header|footer
router.post('/navigation', c.createNavItem);
router.put('/navigation/reorder', c.reorderNavItems); // before :id
router.put('/navigation/:id', c.updateNavItem);
router.delete('/navigation/:id', c.deleteNavItem);

module.exports = router;
