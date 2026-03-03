const express = require('express');
const router = express.Router();
const fiscalPeriodController = require('../controllers/fiscalPeriodController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

router.use(authenticateToken);

router.get('/', authorize('view_settings'), fiscalPeriodController.getFiscalPeriods);
router.get('/active', authorize('view_settings'), fiscalPeriodController.getActiveFiscalPeriod);
router.get('/global-settings', authorize('view_settings'), fiscalPeriodController.getGlobalFiscalSettings);
router.get('/current-range', authorize('view_settings'), fiscalPeriodController.getActivePeriodRange);
router.post('/', authorize('manage_settings'), fiscalPeriodController.createFiscalPeriod);
router.put('/global-settings', authorize('manage_settings'), fiscalPeriodController.updateGlobalFiscalSettings);
router.put('/:id', authorize('manage_settings'), fiscalPeriodController.updateFiscalPeriod);
router.put('/:id/activate', authorize('manage_settings'), fiscalPeriodController.activateFiscalPeriod);
router.put('/:id/close', authorize('manage_settings'), fiscalPeriodController.closeFiscalPeriod);
router.put('/:id/lock', authorize('manage_settings'), fiscalPeriodController.lockFiscalPeriod);
router.put('/:id/unlock', authorize('manage_settings'), fiscalPeriodController.unlockFiscalPeriod);
router.delete('/:id', authorize('manage_settings'), fiscalPeriodController.deleteFiscalPeriod);

module.exports = router;
