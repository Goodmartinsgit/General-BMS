const express = require('express');
const router = express.Router();
const { getAllBranches, getBranchById, createBranch, updateBranch, deleteBranch, getOrganizations } = require('../controllers/branchController');
const authenticateToken = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/', getAllBranches);
router.get('/organizations', getOrganizations);
router.get('/:id', getBranchById);
router.post('/', createBranch);
router.put('/:id', updateBranch);
router.delete('/:id', deleteBranch);

module.exports = router;
