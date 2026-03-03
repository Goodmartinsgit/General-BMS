const express = require('express');
const router = express.Router();
const {
  getAllUsers, createUser, updateUser, deleteUser, getRoles,
  lockUser, unlockUser, resetUserPassword, changeUserRole, getManageableRoles
} = require('../controllers/userController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');
const { enforceHierarchy } = require('../middleware/adminHierarchy');

router.use(authenticateToken);

// ── Read ──────────────────────────────────────────────────────────────────────
router.get('/',                 authorize('view_users'),   getAllUsers);
router.get('/roles',            authorize('view_users'),   getRoles);
router.get('/manageable-roles', authorize('view_users'),   getManageableRoles);

// ── Create ────────────────────────────────────────────────────────────────────
router.post('/', authorize('manage_users'), createUser);

// ── Update profile fields ─────────────────────────────────────────────────────
router.put('/:id', authorize('manage_users'), enforceHierarchy, updateUser);

// ── Role change ───────────────────────────────────────────────────────────────
router.patch('/:id/role', authorize('manage_users'), enforceHierarchy, changeUserRole);

// ── Lock / Unlock ─────────────────────────────────────────────────────────────
router.post('/:id/lock',   authorize('manage_users'), enforceHierarchy, lockUser);
router.post('/:id/unlock', authorize('manage_users'), enforceHierarchy, unlockUser);

// ── Password reset by admin ───────────────────────────────────────────────────
router.post('/:id/reset-password', authorize('manage_users'), enforceHierarchy, resetUserPassword);

// ── Delete ────────────────────────────────────────────────────────────────────
router.delete('/:id', authorize('manage_users'), enforceHierarchy, deleteUser);

module.exports = router;
