/**
 * Password Policy Utility
 * Enforces password requirements for user management
 */

const PASSWORD_POLICY = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
  preventCommon: true,
  preventUserInfo: true,
  preventSequential: true,
  preventRepeated: true,
  expirationDays: 90
};

const COMMON_PASSWORDS = [
  'password', 'password123', 'password1', '12345678', 'qwerty',
  'abc123', 'monkey', '1234567890', 'letmein', 'trustno1',
  'dragon', 'baseball', 'iloveyou', 'master', 'sunshine',
  'ashley', 'bailey', 'passw0rd', 'shadow', '123123',
  'admin', 'admin123', 'welcome', 'login', 'qwerty123'
];

/**
 * Validate password against policy
 * @param {string} password
 * @param {Object} userInfo - Optional: { email, full_name }
 * @returns {{ isValid: boolean, errors: string[] }}
 */
function validatePassword(password, userInfo = {}) {
  const errors = [];

  if (password.length < PASSWORD_POLICY.minLength)
    errors.push(`Password must be at least ${PASSWORD_POLICY.minLength} characters`);

  if (password.length > PASSWORD_POLICY.maxLength)
    errors.push(`Password must not exceed ${PASSWORD_POLICY.maxLength} characters`);

  if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password))
    errors.push('Password must contain at least one uppercase letter');

  if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password))
    errors.push('Password must contain at least one lowercase letter');

  if (PASSWORD_POLICY.requireNumber && !/[0-9]/.test(password))
    errors.push('Password must contain at least one number');

  if (PASSWORD_POLICY.requireSpecialChar && !/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password))
    errors.push('Password must contain at least one special character');

  if (PASSWORD_POLICY.preventCommon && COMMON_PASSWORDS.includes(password.toLowerCase()))
    errors.push('Password is too common. Please choose a more secure password');

  if (PASSWORD_POLICY.preventUserInfo && userInfo) {
    const lower = password.toLowerCase();
    if (userInfo.email && lower.includes(userInfo.email.toLowerCase().split('@')[0]))
      errors.push('Password cannot contain your email address');
    if (userInfo.full_name) {
      const parts = userInfo.full_name.toLowerCase().split(' ');
      if (parts.some(p => p.length > 2 && lower.includes(p)))
        errors.push('Password cannot contain your name');
    }
  }

  if (PASSWORD_POLICY.preventSequential &&
      /123|234|345|456|567|678|789|abc|bcd|cde|def|efg|fgh|ghi/i.test(password))
    errors.push('Password cannot contain sequential characters');

  if (PASSWORD_POLICY.preventRepeated && /(.)\1{2,}/.test(password))
    errors.push('Password cannot contain three or more repeated characters');

  return { isValid: errors.length === 0, errors };
}

/**
 * Generate a secure random password
 * @param {number} length - Default 12
 */
function generatePassword(length = 12) {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';   // removed I, O
  const lowercase = 'abcdefghjkmnpqrstuvwxyz';     // removed i, l, o
  const numbers   = '23456789';                    // removed 0, 1
  const special   = '!@#$%^&*()_+-=';

  const all = uppercase + lowercase + numbers + special;

  let pwd = '';
  pwd += uppercase[Math.floor(Math.random() * uppercase.length)];
  pwd += lowercase[Math.floor(Math.random() * lowercase.length)];
  pwd += numbers[Math.floor(Math.random() * numbers.length)];
  pwd += special[Math.floor(Math.random() * special.length)];

  for (let i = pwd.length; i < length; i++) {
    pwd += all[Math.floor(Math.random() * all.length)];
  }

  // Shuffle
  return pwd.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Check if password has expired (90 days)
 */
function isPasswordExpired(lastPasswordChange) {
  if (!lastPasswordChange) return true;
  const exp = new Date(lastPasswordChange);
  exp.setDate(exp.getDate() + PASSWORD_POLICY.expirationDays);
  return new Date() > exp;
}

module.exports = { PASSWORD_POLICY, validatePassword, generatePassword, isPasswordExpired };
