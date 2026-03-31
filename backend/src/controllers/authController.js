const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { query, pool } = require('../config/db');

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=])[A-Za-z\d@$!%*?&#^()_\-+=]{8,}$/;

const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const generateRefreshToken = () => crypto.randomBytes(40).toString('hex');

/** Extract a short prefix from a refresh token for fast DB lookup. */
const tokenFamily = (token) => token.substring(0, 16);

/** Fetch session_timeout (minutes) from the security settings row. */
const getSessionTimeout = async () => {
  try {
    const res = await pool.query(
      `SELECT s.settings FROM settings s JOIN organizations o ON s.organization_id = o.id WHERE s.category = 'security' LIMIT 1`
    );
    return res.rows[0]?.settings?.session_timeout ?? 30;
  } catch {
    return 30; // default
  }
};

const register = async (req, res) => {
  try {
    const { email, password, full_name, role_name } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ message: 'Email, password, and full name are required' });
    }

    if (!PASSWORD_REGEX.test(password)) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
      });
    }

    const userCheck = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    let roleId;
    if (role_name) {
      const roleRes = await query('SELECT id FROM roles WHERE role_name = $1', [role_name]);
      if (roleRes.rows.length > 0) roleId = roleRes.rows[0].id;
    }

    if (!roleId) {
        const rolesCount = await query('SELECT COUNT(*) FROM roles');
        if (parseInt(rolesCount.rows[0].count) === 0) {
             const newRole = await query('INSERT INTO roles (role_name, description) VALUES ($1, $2) RETURNING id', ['Super Admin', 'System Administrator']);
             roleId = newRole.rows[0].id;
        } else {
             const anyRole = await query('SELECT id FROM roles LIMIT 1');
             roleId = anyRole.rows[0].id;
        }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await query(
      `INSERT INTO users (email, password_hash, full_name, role_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, full_name, role_id`,
      [email, hashedPassword, full_name, roleId]
    );

    const createdUser = await query(
      `SELECT u.id, u.email, u.full_name, u.role_id, r.role_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [newUser.rows[0].id]
    );

    res.status(201).json(createdUser.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS  = 30 * 60 * 1000; // 30 minutes

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const userRes = await query(
      `SELECT u.*, r.role_name, r.role_level, r.permissions
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.email = $1 AND u.deleted_at IS NULL`,
      [email]
    );

    if (userRes.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = userRes.rows[0];

    // ── Lockout check ──────────────────────────────────────────
    if (user.status === 'LOCKED') {
      if (user.locked_at) {
        const lockExpiry = new Date(user.locked_at).getTime() + LOCKOUT_DURATION_MS;
        if (Date.now() < lockExpiry) {
          const minutesLeft = Math.ceil((lockExpiry - Date.now()) / 60000);
          return res.status(403).json({
            message: `Account is locked. Try again in ${minutesLeft} minute(s) or contact an administrator.`
          });
        }
        // Auto-lockout window expired — restore account
        await query(
          `UPDATE users SET status = 'ACTIVE', is_active = true, locked_at = NULL,
                           lock_reason = NULL, failed_login_attempts = 0 WHERE id = $1`,
          [user.id]
        );
        user.status = 'ACTIVE';
        user.failed_login_attempts = 0;
      } else {
        return res.status(403).json({
          message: 'Your account has been locked. Please contact an administrator.'
        });
      }
    }

    // ── Inactive account ───────────────────────────────────────
    if (user.status === 'INACTIVE' || user.is_active === false) {
      return res.status(403).json({ message: 'Account is inactive. Contact an administrator.' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      const newAttempts = (user.failed_login_attempts || 0) + 1;

      if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        await query(
          `UPDATE users SET failed_login_attempts = $1, status = 'LOCKED', is_active = false,
                           locked_at = NOW(), lock_reason = 'Auto-locked after ${MAX_FAILED_ATTEMPTS} failed login attempts'
           WHERE id = $2`,
          [newAttempts, user.id]
        );
        return res.status(403).json({
          message: `Account locked after ${MAX_FAILED_ATTEMPTS} failed attempts. Try again in 30 minutes or contact an administrator.`
        });
      }

      await query('UPDATE users SET failed_login_attempts = $1 WHERE id = $2', [newAttempts, user.id]);
      const attemptsLeft = MAX_FAILED_ATTEMPTS - newAttempts;
      return res.status(400).json({
        message: `Invalid credentials. ${attemptsLeft} attempt(s) remaining before account lockout.`
      });
    }

    // ── Successful login — reset failed attempts ───────────────
    await query(
      'UPDATE users SET failed_login_attempts = 0, last_login_at = NOW() WHERE id = $1',
      [user.id]
    );

    // Generate access token (short-lived)
    const accessToken = jwt.sign(
      {
        id: user.id, email: user.email,
        role_id: user.role_id, role_name: user.role_name,
        role_level: user.role_level,
        org_id: user.org_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Generate refresh token (long-lived)
    const refreshToken = generateRefreshToken();
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const family = tokenFamily(refreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, token_family, expires_at) VALUES ($1, $2, $3, $4)`,
      [user.id, refreshTokenHash, family, expiresAt]
    );

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: REFRESH_TOKEN_EXPIRY_MS,
      path: '/'
    });

    const sessionTimeout = await getSessionTimeout();

    res.json({
      accessToken,
      sessionTimeout,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role_id: user.role_id,
        role_name: user.role_name,
        role_level: user.role_level,
        permissions: user.permissions || {}
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token provided' });
    }

    const family = tokenFamily(refreshToken);

    // Fast lookup: use token_family prefix to narrow candidates instead of scanning all tokens
    const tokensRes = await query(
      `SELECT rt.*, u.email, u.full_name, u.org_id, u.role_id, r.role_name, r.role_level, r.permissions
       FROM refresh_tokens rt
       JOIN users u ON rt.user_id = u.id
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE rt.token_family = $1
         AND rt.revoked_at IS NULL AND rt.expires_at > NOW()
         AND u.deleted_at IS NULL AND (u.status IS NULL OR u.status = 'ACTIVE')
       ORDER BY rt.created_at DESC`,
      [family]
    );

    let matchedToken = null;
    for (const tokenRow of tokensRes.rows) {
      const isMatch = await bcrypt.compare(refreshToken, tokenRow.token_hash);
      if (isMatch) {
        matchedToken = tokenRow;
        break;
      }
    }

    if (!matchedToken) {
      // Fallback: try without token_family filter for tokens created before migration
      const fallbackRes = await query(
        `SELECT rt.*, u.email, u.full_name, u.org_id, u.role_id, r.role_name, r.role_level, r.permissions
         FROM refresh_tokens rt
         JOIN users u ON rt.user_id = u.id
         LEFT JOIN roles r ON u.role_id = r.id
         WHERE rt.token_family IS NULL
           AND rt.revoked_at IS NULL AND rt.expires_at > NOW()
           AND u.deleted_at IS NULL AND (u.status IS NULL OR u.status = 'ACTIVE')
         ORDER BY rt.created_at DESC`
      );
      for (const tokenRow of fallbackRes.rows) {
        const isMatch = await bcrypt.compare(refreshToken, tokenRow.token_hash);
        if (isMatch) {
          matchedToken = tokenRow;
          break;
        }
      }
    }

    if (!matchedToken) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    // ── Token rotation: revoke old, issue new ──────────────────────
    await query(
      `UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1`,
      [matchedToken.id]
    );

    const newRefreshToken = generateRefreshToken();
    const newHash = await bcrypt.hash(newRefreshToken, 10);
    const newFamily = tokenFamily(newRefreshToken);
    const newExpiry = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, token_family, expires_at) VALUES ($1, $2, $3, $4)`,
      [matchedToken.user_id, newHash, newFamily, newExpiry]
    );

    // Send rotated refresh token in cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: REFRESH_TOKEN_EXPIRY_MS,
      path: '/'
    });

    const accessToken = jwt.sign(
      {
        id: matchedToken.user_id, email: matchedToken.email,
        role_id: matchedToken.role_id, role_name: matchedToken.role_name,
        role_level: matchedToken.role_level,
        org_id: matchedToken.org_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const sessionTimeout = await getSessionTimeout();

    res.json({
      accessToken,
      sessionTimeout,
      user: {
        id: matchedToken.user_id,
        email: matchedToken.email,
        full_name: matchedToken.full_name,
        role_id: matchedToken.role_id,
        role_name: matchedToken.role_name,
        role_level: matchedToken.role_level,
        permissions: matchedToken.permissions || {}
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      const userId = req.user?.id;
      if (userId) {
        await query(
          `UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
          [userId]
        );
      }
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/'
    });
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const userRes = await query('SELECT id, email FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      // Return success even if user not found to prevent email enumeration
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    const user = userRes.rows[0];

    // Invalidate any existing unused tokens for this user
    await query(
      `UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL`,
      [user.id]
    );

    // Generate a random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(resetToken, 10);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [user.id, tokenHash, expiresAt]
    );

    const response = { message: 'If an account with that email exists, a password reset link has been sent.' };

    // In development, return the token so it can be tested without email
    if (process.env.NODE_ENV !== 'production') {
      response.resetToken = resetToken;
    }

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    const tokensRes = await query(
      `SELECT prt.*, u.email FROM password_reset_tokens prt
       JOIN users u ON prt.user_id = u.id
       WHERE prt.used_at IS NULL AND prt.expires_at > NOW()
       ORDER BY prt.created_at DESC`
    );

    let matchedToken = null;
    for (const tokenRow of tokensRes.rows) {
      const isMatch = await bcrypt.compare(token, tokenRow.token_hash);
      if (isMatch) {
        matchedToken = tokenRow;
        break;
      }
    }

    if (!matchedToken) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    res.json({ message: 'Token is valid', email: matchedToken.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (!PASSWORD_REGEX.test(newPassword)) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
      });
    }

    const tokensRes = await query(
      `SELECT * FROM password_reset_tokens
       WHERE used_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC`
    );

    let matchedToken = null;
    for (const tokenRow of tokensRes.rows) {
      const isMatch = await bcrypt.compare(token, tokenRow.token_hash);
      if (isMatch) {
        matchedToken = tokenRow;
        break;
      }
    }

    if (!matchedToken) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, matchedToken.user_id]);
    await query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1', [matchedToken.id]);

    // Revoke all refresh tokens for this user (force re-login)
    await query(
      `UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
      [matchedToken.user_id]
    );

    res.json({ message: 'Password has been reset successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── PATCH /auth/profile ───────────────────────────────────────────────────────
// Lets a logged-in user update their own email (requires current password).

const updateProfile = async (req, res) => {
  try {
    const { email, currentPassword } = req.body;
    const userId = req.user.id;

    if (!email || !currentPassword) {
      return res.status(400).json({ message: 'New email and current password are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email address' });
    }

    const userRes = await query(
      'SELECT email, password_hash FROM users WHERE id = $1 AND deleted_at IS NULL',
      [userId]
    );
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userRes.rows[0];

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    if (email.toLowerCase() === user.email.toLowerCase()) {
      return res.status(400).json({ message: 'New email must be different from your current email' });
    }

    const dup = await query(
      'SELECT id FROM users WHERE email = $1 AND id != $2 AND deleted_at IS NULL',
      [email, userId]
    );
    if (dup.rows.length > 0) {
      return res.status(409).json({ message: 'This email is already in use by another account' });
    }

    await query(
      'UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2',
      [email, userId]
    );

    res.json({ message: 'Email updated successfully', email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (!PASSWORD_REGEX.test(newPassword)) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
      });
    }

    const userRes = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const validPassword = await bcrypt.compare(currentPassword, userRes.rows[0].password_hash);
    if (!validPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, userId]);

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { register, login, refresh, logout, requestPasswordReset, verifyResetToken, resetPassword, changePassword, updateProfile };
