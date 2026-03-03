const { query } = require('../config/db');
const bcrypt = require('bcryptjs');
const { generatePassword, validatePassword } = require('../utils/passwordPolicy');

// ── helpers ──────────────────────────────────────────────────────────────────

async function getActorLevel(userId) {
  const res = await query(
    `SELECT r.role_level
     FROM users u JOIN roles r ON u.role_id = r.id
     WHERE u.id = $1 AND u.deleted_at IS NULL`,
    [userId]
  );
  return res.rows[0]?.role_level ?? 99;
}

async function revokeRefreshTokens(userId) {
  await query(
    `UPDATE refresh_tokens SET revoked_at = NOW()
     WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId]
  );
}

// ── GET /users ────────────────────────────────────────────────────────────────

const getAllUsers = async (req, res) => {
  try {
    const actorLevel = await getActorLevel(req.user.id);

    // Super Admin (level 1) and Admin (level 2) see ALL users.
    // Lower-privilege roles (level 3+) see only users at their own level and below.
    const result = await query(
      `SELECT u.id, u.email, u.full_name, u.phone_number,
              u.is_active, u.status, u.failed_login_attempts,
              u.locked_at, u.lock_reason, u.require_password_change,
              u.last_password_change, u.last_login_at, u.created_at,
              r.id        AS role_id,
              r.role_name,
              r.role_level
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.deleted_at IS NULL
         AND ($1 <= 2 OR r.role_level >= $1 OR r.role_level IS NULL)
       ORDER BY r.role_level ASC NULLS LAST, u.created_at DESC`,
      [actorLevel]
    );

    const users = result.rows.map(u => ({
      ...u,
      is_locked: u.status === 'LOCKED'
    }));

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── POST /users ───────────────────────────────────────────────────────────────

const createUser = async (req, res) => {
  try {
    const actorId = req.user.id;
    const { email, full_name, phone_number, role_id, password: rawPassword, generate_password } = req.body;

    if (!email || !full_name || !role_id) {
      return res.status(400).json({ message: 'Email, full name, and role are required' });
    }

    // Duplicate email check
    const dup = await query(
      'SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL',
      [email]
    );
    if (dup.rows.length > 0) {
      return res.status(409).json({ message: 'A user with this email already exists' });
    }

    // Hierarchy check: actor must outrank target role
    const [actorLevel, targetRoleRes] = await Promise.all([
      getActorLevel(actorId),
      query('SELECT role_level FROM roles WHERE id = $1', [role_id])
    ]);

    if (targetRoleRes.rows.length === 0) {
      return res.status(404).json({ message: 'Role not found' });
    }

    const targetRoleLevel = targetRoleRes.rows[0].role_level ?? 99;

    // Super Admin is a singleton — nobody may create a second one
    if (targetRoleLevel <= 1) {
      return res.status(403).json({
        message: 'Cannot create additional Super Admin accounts. Only one Super Admin is permitted.'
      });
    }

    if (actorLevel >= targetRoleLevel) {
      return res.status(403).json({
        message: 'You cannot create a user with a role at or above your own privilege level'
      });
    }

    // Password handling
    let passwordToUse = rawPassword;
    let passwordGenerated = false;

    if (!passwordToUse || generate_password) {
      passwordToUse = generatePassword(12);
      passwordGenerated = true;
    } else {
      const v = validatePassword(passwordToUse, { email, full_name });
      if (!v.isValid) {
        return res.status(400).json({ message: v.errors[0] });
      }
    }

    const hashed = await bcrypt.hash(passwordToUse, 12);

    const newUser = await query(
      `INSERT INTO users
         (email, password_hash, full_name, phone_number, role_id,
          status, require_password_change, last_password_change)
       VALUES ($1, $2, $3, $4, $5, 'ACTIVE', $6, NOW())
       RETURNING id, email, full_name, is_active, status, created_at`,
      [email, hashed, full_name, phone_number || null, role_id, passwordGenerated]
    );

    const response = { user: newUser.rows[0] };
    if (passwordGenerated) {
      response.temporary_password = passwordToUse;
    }

    res.status(201).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── PUT /users/:id ────────────────────────────────────────────────────────────

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, phone_number, is_active } = req.body;

    const result = await query(
      `UPDATE users
       SET full_name    = COALESCE($1, full_name),
           phone_number = COALESCE($2, phone_number),
           is_active    = COALESCE($3, is_active),
           updated_at   = NOW()
       WHERE id = $4 AND deleted_at IS NULL
       RETURNING id, full_name, email, is_active, status`,
      [full_name, phone_number, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── DELETE /users/:id ─────────────────────────────────────────────────────────

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const actorId = req.user.id;

    if (id === actorId) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const result = await query(
      `UPDATE users
       SET deleted_at = NOW(), is_active = false, status = 'INACTIVE', updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    await revokeRefreshTokens(id);

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── POST /users/:id/lock ──────────────────────────────────────────────────────

const lockUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const result = await query(
      `UPDATE users
       SET status = 'LOCKED', is_active = false,
           locked_at = NOW(), lock_reason = $1, updated_at = NOW()
       WHERE id = $2 AND deleted_at IS NULL AND status != 'LOCKED'
       RETURNING id, full_name, status`,
      [reason || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found or already locked' });
    }

    await revokeRefreshTokens(id);

    res.json({
      message: `User "${result.rows[0].full_name}" has been locked`,
      user: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── POST /users/:id/unlock ────────────────────────────────────────────────────

const unlockUser = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE users
       SET status = 'ACTIVE', is_active = true,
           locked_at = NULL, lock_reason = NULL,
           failed_login_attempts = 0, updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL AND status = 'LOCKED'
       RETURNING id, full_name, status`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found or not currently locked' });
    }

    res.json({
      message: `User "${result.rows[0].full_name}" has been unlocked`,
      user: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── POST /users/:id/reset-password ───────────────────────────────────────────

const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const actorId = req.user.id;

    if (id === actorId) {
      return res.status(400).json({
        message: 'Cannot reset your own password here. Use Change Password instead.'
      });
    }

    const userCheck = await query(
      'SELECT id, full_name FROM users WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const tempPassword = generatePassword(12);
    const hashed = await bcrypt.hash(tempPassword, 12);

    await query(
      `UPDATE users
       SET password_hash = $1, require_password_change = true,
           last_password_change = NOW(), updated_at = NOW()
       WHERE id = $2`,
      [hashed, id]
    );

    await revokeRefreshTokens(id);

    res.json({
      message: 'Password reset successfully',
      temporary_password: tempPassword
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── PATCH /users/:id/role ─────────────────────────────────────────────────────

const changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role_id } = req.body;
    const actorId = req.user.id;

    if (!role_id) {
      return res.status(400).json({ message: 'role_id is required' });
    }

    const [actorLevel, newRoleRes] = await Promise.all([
      getActorLevel(actorId),
      query('SELECT id, role_name, role_level FROM roles WHERE id = $1', [role_id])
    ]);

    if (newRoleRes.rows.length === 0) {
      return res.status(404).json({ message: 'Target role not found' });
    }

    const newRoleLevel = newRoleRes.rows[0].role_level ?? 99;

    // Super Admin is a singleton — the role cannot be reassigned to anyone
    if (newRoleLevel <= 1) {
      return res.status(403).json({
        message: 'Cannot assign the Super Admin role to other users.'
      });
    }

    if (actorLevel >= newRoleLevel) {
      return res.status(403).json({
        message: 'Cannot assign a role at or above your own privilege level'
      });
    }

    const result = await query(
      `UPDATE users SET role_id = $1, updated_at = NOW()
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING id, full_name`,
      [role_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Force re-login so new role takes effect immediately
    await revokeRefreshTokens(id);

    res.json({
      message: `Role changed to "${newRoleRes.rows[0].role_name}"`,
      user: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET /users/manageable-roles ───────────────────────────────────────────────

const getManageableRoles = async (req, res) => {
  try {
    const actorLevel = await getActorLevel(req.user.id);

    const roles = await query(
      `SELECT id, role_name, role_level, description
       FROM roles
       WHERE role_level > $1
       ORDER BY role_level ASC`,
      [actorLevel]
    );

    res.json(roles.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET /users/roles ──────────────────────────────────────────────────────────

const getRoles = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, role_name, role_level, description FROM roles ORDER BY role_level ASC NULLS LAST, id'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getRoles,
  lockUser,
  unlockUser,
  resetUserPassword,
  changeUserRole,
  getManageableRoles
};
