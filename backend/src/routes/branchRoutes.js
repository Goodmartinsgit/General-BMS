const express = require('express');
const router = express.Router();
const { getBranchMode, getAllBranches, getBranchById, createBranch, updateBranch, deleteBranch, getOrganizations } = require('../controllers/branchController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

router.use(authenticateToken);

// Must be declared before /:id to prevent 'mode' being treated as an ID
router.get('/mode', getBranchMode);
router.get('/organizations', authorize('view_branches'), getOrganizations);
router.get('/', authorize('view_branches'), getAllBranches);
router.get('/:id', authorize('view_branches'), getBranchById);
router.post('/', authorize('manage_branches'), createBranch);
router.put('/:id', authorize('manage_branches'), updateBranch);
router.delete('/:id', authorize('manage_branches'), deleteBranch);

module.exports = router;
