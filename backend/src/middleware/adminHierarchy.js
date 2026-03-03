/**
 * Admin Hierarchy Middleware
 *
 * Enforces role-level hierarchy for user management actions.
 * role_level: 1 = highest privilege (Super Admin), higher numbers = lower privilege.
 *
 * Rules:
 *  - Super Admin (level 1): can manage anyone
 *  - Admin (level 2): can manage anyone EXCEPT other Admins (level 2) and Super Admins (level 1)
 *    — same visibility as Super Admin, but cannot delete/lock/edit peers or above
 *  - Lower roles (level 3+): can only manage users strictly below their own level
 *  - Actors cannot act on themselves
 */

const { query } = require('../config/db');

/**
 * Fetch role_level for a user by their UUID
 */
async function getRoleLevel(userId) {
  const res = await query(
    `SELECT r.role_level
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE u.id = $1 AND u.deleted_at IS NULL`,
    [userId]
  );
  return res.rows[0]?.role_level ?? 99;
}

/**
 * Middleware: enforce that the acting user has higher privilege than the target user.
 * Target user ID is taken from req.params.id.
 */
async function enforceHierarchy(req, res, next) {
  const actorId = req.user.id;
  const targetId = req.params.id;

  if (!targetId) return next();

  // Prevent self-modification through management endpoints
  if (actorId.toString() === targetId.toString()) {
    return res.status(400).json({ message: 'Cannot perform this action on your own account' });
  }

  try {
    const [actorLevel, targetLevel] = await Promise.all([
      getRoleLevel(actorId),
      getRoleLevel(targetId)
    ]);

    if (targetLevel === 99 && actorLevel >= 99) {
      // Both unknown — allow and let controller handle it
      return next();
    }

    if (actorLevel >= targetLevel) {
      return res.status(403).json({
        message: 'Insufficient privileges to manage this user'
      });
    }

    // Attach levels to request for controllers to use if needed
    req.actorRoleLevel = actorLevel;
    req.targetRoleLevel = targetLevel;
    next();
  } catch (err) {
    console.error('Hierarchy check error:', err);
    res.status(500).json({ message: 'Authorization check failed' });
  }
}

module.exports = { enforceHierarchy };
