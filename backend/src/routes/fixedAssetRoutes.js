const express = require('express');
const router = express.Router();
const { getFixedAssets, getFixedAssetById, createFixedAsset, updateFixedAsset, deleteFixedAsset, runDepreciation } = require('../controllers/fixedAssetController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

router.use(authenticateToken);

router.get('/', authorize('view_accounting'), getFixedAssets);
router.get('/:id', authorize('view_accounting'), getFixedAssetById);
router.post('/', authorize('manage_accounting'), createFixedAsset);
router.put('/:id', authorize('manage_accounting'), updateFixedAsset);
router.delete('/:id', authorize('manage_accounting'), deleteFixedAsset);
router.post('/depreciation/run', authorize('manage_accounting'), runDepreciation);

module.exports = router;
