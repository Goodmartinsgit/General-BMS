'use strict';

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { query, pool } = require('../config/db');
const { signCustomerToken } = require('../middleware/storeAuthMiddleware');

// ---------------------------------------------------------------------------
// Helper: format customer object for API responses
// ---------------------------------------------------------------------------
function formatCustomer(customer, auth) {
  return {
    id: customer.id,
    email: auth.email,
    firstName: customer.customer_name ? customer.customer_name.split(' ')[0] : '',
    lastName: customer.customer_name ? customer.customer_name.split(' ').slice(1).join(' ') : '',
    phone: customer.phone_number,
    isEmailVerified: auth.is_email_verified,
    lastLoginAt: auth.last_login_at,
    createdAt: customer.created_at,
  };
}

// ---------------------------------------------------------------------------
// Helper: build cart merge SQL during login (merges guest session cart)
// ---------------------------------------------------------------------------
async function mergeGuestCart(client, customerId, sessionId) {
  if (!sessionId) return;

  // Find guest cart
  const guestCartRes = await client.query(
    `SELECT id FROM carts WHERE session_id = $1 AND customer_id IS NULL LIMIT 1`,
    [sessionId]
  );
  if (guestCartRes.rows.length === 0) return;
  const guestCartId = guestCartRes.rows[0].id;

  // Find or create customer cart
  let customerCartRes = await client.query(
    `SELECT id FROM carts WHERE customer_id = $1 LIMIT 1`,
    [customerId]
  );

  if (customerCartRes.rows.length === 0) {
    // No existing cart — just take over the guest cart
    await client.query(
      `UPDATE carts SET customer_id = $1, session_id = NULL, updated_at = NOW() WHERE id = $2`,
      [customerId, guestCartId]
    );
    return;
  }

  const customerCartId = customerCartRes.rows[0].id;

  // Merge guest cart items into customer cart
  await client.query(
    `INSERT INTO cart_items (cart_id, product_id, variant_id, quantity, unit_price)
     SELECT $1, product_id, variant_id, quantity, unit_price
     FROM cart_items
     WHERE cart_id = $2
     ON CONFLICT (cart_id, product_id, COALESCE(variant_id, 0))
     DO UPDATE SET
       quantity = cart_items.quantity + EXCLUDED.quantity,
       updated_at = NOW()`,
    [customerCartId, guestCartId]
  );

  // Delete the guest cart (cascade deletes its items)
  await client.query(`DELETE FROM carts WHERE id = $1`, [guestCartId]);
}

// ---------------------------------------------------------------------------
// POST /api/store/:slug/customers/register
// ---------------------------------------------------------------------------
const register = async (req, res) => {
  const client = await pool.connect();
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    // Basic validation
    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    await client.query('BEGIN');

    // Check email uniqueness in customer_auth
    const emailCheck = await client.query(
      `SELECT id FROM customer_auth WHERE email = LOWER($1)`,
      [email]
    );
    if (emailCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    // Generate customer_code: CUS-ONL-XXXXXX
    const countRes = await client.query(`SELECT COUNT(*) FROM customers WHERE source = 'online'`);
    const seq = parseInt(countRes.rows[0].count) + 1;
    const customerCode = `CUS-ONL-${String(seq).padStart(6, '0')}`;
    const customerName = `${firstName.trim()} ${lastName.trim()}`;

    // Insert into customers
    const customerRes = await client.query(
      `INSERT INTO customers
         (customer_name, customer_code, customer_type, email, phone_number, source, is_active_online, created_at)
       VALUES ($1, $2, 'retail', $3, $4, 'online', true, NOW())
       RETURNING *`,
      [customerName, customerCode, email.toLowerCase(), phone]
    );
    const customer = customerRes.rows[0];

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Insert into customer_auth
    const authRes = await client.query(
      `INSERT INTO customer_auth
         (customer_id, email, password_hash, is_email_verified,
          email_verification_token, email_verification_expires)
       VALUES ($1, $2, $3, false, $4, $5)
       RETURNING *`,
      [customer.id, email.toLowerCase(), passwordHash, verificationToken, verificationExpires]
    );
    const auth = authRes.rows[0];

    await client.query('COMMIT');

    // Log token (email sending is future work)
    console.log(`[EMAIL] Verify email token: ${verificationToken}`);

    // Build token and response
    const token = signCustomerToken({ id: customer.id, email: auth.email });

    res.status(201).json({
      token,
      customer: formatCustomer(customer, auth),
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[storeCustomerController.register]', err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};

// ---------------------------------------------------------------------------
// POST /api/store/:slug/customers/login
// ---------------------------------------------------------------------------
const login = async (req, res) => {
  const client = await pool.connect();
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Look up auth record
    const authRes = await client.query(
      `SELECT ca.*, c.id as cust_id
       FROM customer_auth ca
       JOIN customers c ON c.id = ca.customer_id
       WHERE ca.email = LOWER($1) AND c.deleted_at IS NULL`,
      [email]
    );
    if (authRes.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const authRow = authRes.rows[0];

    // Verify password
    const valid = await bcrypt.compare(password, authRow.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Fetch customer row
    const customerRes = await client.query(
      `SELECT * FROM customers WHERE id = $1`,
      [authRow.cust_id]
    );
    const customer = customerRes.rows[0];

    await client.query('BEGIN');

    // Update last_login_at
    await client.query(
      `UPDATE customer_auth SET last_login_at = NOW() WHERE id = $1`,
      [authRow.id]
    );

    // Merge guest cart (if sessionId present)
    if (req.sessionId) {
      try {
        await mergeGuestCart(client, customer.id, req.sessionId);
      } catch (mergeErr) {
        console.error('[storeCustomerController.login] cart merge error:', mergeErr);
        // Non-fatal: continue
      }
    }

    await client.query('COMMIT');

    // Re-fetch auth for updated last_login_at
    const updatedAuthRes = await client.query(
      `SELECT * FROM customer_auth WHERE id = $1`,
      [authRow.id]
    );
    const updatedAuth = updatedAuthRes.rows[0];

    const token = signCustomerToken({ id: customer.id, email: updatedAuth.email });

    res.json({
      token,
      customer: formatCustomer(customer, updatedAuth),
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[storeCustomerController.login]', err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};

// ---------------------------------------------------------------------------
// POST /api/store/:slug/customers/logout
// ---------------------------------------------------------------------------
const logout = async (req, res) => {
  // JWT is stateless — nothing to invalidate server-side
  res.json({ message: 'Logged out successfully' });
};

// ---------------------------------------------------------------------------
// POST /api/store/:slug/customers/forgot-password
// ---------------------------------------------------------------------------
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const authRes = await query(
      `SELECT ca.* FROM customer_auth ca
       JOIN customers c ON c.id = ca.customer_id
       WHERE ca.email = LOWER($1) AND c.deleted_at IS NULL`,
      [email]
    );

    // Always return 200 to prevent email enumeration
    if (authRes.rows.length === 0) {
      return res.json({ message: 'If that email exists, a reset link has been sent' });
    }
    const auth = authRes.rows[0];

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await query(
      `UPDATE customer_auth SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3`,
      [resetToken, resetExpires, auth.id]
    );

    console.log(`[EMAIL] Password reset token for ${email}: ${resetToken}`);

    res.json({ message: 'If that email exists, a reset link has been sent' });
  } catch (err) {
    console.error('[storeCustomerController.forgotPassword]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------------------------------------------------------------------------
// POST /api/store/:slug/customers/reset-password
// ---------------------------------------------------------------------------
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    const authRes = await query(
      `SELECT * FROM customer_auth
       WHERE password_reset_token = $1
         AND password_reset_expires > NOW()`,
      [token]
    );
    if (authRes.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    const auth = authRes.rows[0];

    const passwordHash = await bcrypt.hash(password, 10);

    await query(
      `UPDATE customer_auth
       SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL
       WHERE id = $2`,
      [passwordHash, auth.id]
    );

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('[storeCustomerController.resetPassword]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------------------------------------------------------------------------
// POST /api/store/:slug/customers/verify-email  { token }
// ---------------------------------------------------------------------------
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Token is required' });

    const authRes = await query(
      `SELECT * FROM customer_auth
       WHERE email_verification_token = $1
         AND email_verification_expires > NOW()`,
      [token]
    );
    if (authRes.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }
    const auth = authRes.rows[0];

    await query(
      `UPDATE customer_auth
       SET is_email_verified = true,
           email_verification_token = NULL,
           email_verification_expires = NULL
       WHERE id = $1`,
      [auth.id]
    );

    // If there is a pending_email waiting, apply it now
    if (auth.pending_email && auth.pending_email_token === token) {
      await query(
        `UPDATE customer_auth
         SET email = pending_email, pending_email = NULL, pending_email_token = NULL
         WHERE id = $1`,
        [auth.id]
      );
    }

    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    console.error('[storeCustomerController.verifyEmail]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------------------------------------------------------------------------
// POST /api/store/:slug/customers/resend-verification  (requires storeAuth)
// ---------------------------------------------------------------------------
const resendVerification = async (req, res) => {
  try {
    const { customerId } = req.customer;

    const authRes = await query(
      `SELECT * FROM customer_auth WHERE customer_id = $1`,
      [customerId]
    );
    if (authRes.rows.length === 0) {
      return res.status(404).json({ message: 'Account not found' });
    }
    const auth = authRes.rows[0];

    if (auth.is_email_verified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    const newToken = crypto.randomBytes(32).toString('hex');
    const newExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await query(
      `UPDATE customer_auth
       SET email_verification_token = $1, email_verification_expires = $2
       WHERE id = $3`,
      [newToken, newExpires, auth.id]
    );

    console.log(`[EMAIL] Verify email token: ${newToken}`);

    res.json({ message: 'Verification email sent' });
  } catch (err) {
    console.error('[storeCustomerController.resendVerification]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------------------------------------------------------------------------
// GET /api/store/:slug/customers/profile  (requires storeAuth)
// ---------------------------------------------------------------------------
const getProfile = async (req, res) => {
  try {
    const { customerId } = req.customer;

    const profileRes = await query(
      `SELECT c.*, ca.email as auth_email, ca.is_email_verified, ca.last_login_at
       FROM customers c
       JOIN customer_auth ca ON ca.customer_id = c.id
       WHERE c.id = $1 AND c.deleted_at IS NULL`,
      [customerId]
    );
    if (profileRes.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    const row = profileRes.rows[0];

    // Order stats
    const statsRes = await query(
      `SELECT COUNT(*) as total_orders, COALESCE(SUM(total), 0) as total_spent
       FROM online_orders
       WHERE customer_id = $1 AND status != 'CANCELLED'`,
      [customerId]
    );
    const stats = statsRes.rows[0];

    const customerObj = {
      id: row.id,
      customer_name: row.customer_name,
      phone_number: row.phone_number,
      created_at: row.created_at,
    };
    const authObj = {
      email: row.auth_email,
      is_email_verified: row.is_email_verified,
      last_login_at: row.last_login_at,
    };

    res.json({
      ...formatCustomer(customerObj, authObj),
      customerCode: row.customer_code,
      address: row.address,
      city: row.city,
      state: row.state,
      country: row.country,
      totalOrders: parseInt(stats.total_orders),
      totalSpent: parseFloat(stats.total_spent),
    });
  } catch (err) {
    console.error('[storeCustomerController.getProfile]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------------------------------------------------------------------------
// PATCH /api/store/:slug/customers/profile  (requires storeAuth)
// ---------------------------------------------------------------------------
const updateProfile = async (req, res) => {
  try {
    const { customerId } = req.customer;
    const { firstName, lastName, phone } = req.body;

    // Build update fields
    const updates = [];
    const params = [];

    if (firstName !== undefined || lastName !== undefined) {
      // We need the current name to patch just one part
      const curRes = await query(
        `SELECT customer_name FROM customers WHERE id = $1`,
        [customerId]
      );
      if (curRes.rows.length === 0) return res.status(404).json({ message: 'Customer not found' });
      const current = curRes.rows[0].customer_name || '';
      const curFirst = current.split(' ')[0];
      const curLast = current.split(' ').slice(1).join(' ');
      const newFirst = firstName !== undefined ? firstName.trim() : curFirst;
      const newLast = lastName !== undefined ? lastName.trim() : curLast;
      params.push(`${newFirst} ${newLast}`.trim());
      updates.push(`customer_name = $${params.length}`);
    }

    if (phone !== undefined) {
      params.push(phone);
      updates.push(`phone_number = $${params.length}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    params.push(customerId);
    const updatedRes = await query(
      `UPDATE customers SET ${updates.join(', ')} WHERE id = $${params.length} AND deleted_at IS NULL RETURNING *`,
      params
    );
    if (updatedRes.rows.length === 0) return res.status(404).json({ message: 'Customer not found' });

    const customer = updatedRes.rows[0];
    const authRes = await query(`SELECT * FROM customer_auth WHERE customer_id = $1`, [customerId]);
    const auth = authRes.rows[0];

    res.json({ customer: formatCustomer(customer, auth) });
  } catch (err) {
    console.error('[storeCustomerController.updateProfile]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------------------------------------------------------------------------
// PATCH /api/store/:slug/customers/change-password  (requires storeAuth)
// ---------------------------------------------------------------------------
const changePassword = async (req, res) => {
  try {
    const { customerId } = req.customer;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }

    const authRes = await query(
      `SELECT * FROM customer_auth WHERE customer_id = $1`,
      [customerId]
    );
    if (authRes.rows.length === 0) return res.status(404).json({ message: 'Account not found' });
    const auth = authRes.rows[0];

    const valid = await bcrypt.compare(currentPassword, auth.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await query(
      `UPDATE customer_auth SET password_hash = $1 WHERE id = $2`,
      [newHash, auth.id]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('[storeCustomerController.changePassword]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------------------------------------------------------------------------
// PATCH /api/store/:slug/customers/change-email  (requires storeAuth)
// ---------------------------------------------------------------------------
const changeEmail = async (req, res) => {
  try {
    const { customerId } = req.customer;
    const { newEmail, currentPassword } = req.body;

    if (!newEmail || !currentPassword) {
      return res.status(400).json({ message: 'New email and current password are required' });
    }

    const authRes = await query(
      `SELECT * FROM customer_auth WHERE customer_id = $1`,
      [customerId]
    );
    if (authRes.rows.length === 0) return res.status(404).json({ message: 'Account not found' });
    const auth = authRes.rows[0];

    const valid = await bcrypt.compare(currentPassword, auth.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Password is incorrect' });
    }

    // Check new email not already in use
    const emailCheck = await query(
      `SELECT id FROM customer_auth WHERE email = LOWER($1) AND id != $2`,
      [newEmail, auth.id]
    );
    if (emailCheck.rows.length > 0) {
      return res.status(409).json({ message: 'That email is already in use' });
    }

    const pendingToken = crypto.randomBytes(32).toString('hex');

    await query(
      `UPDATE customer_auth
       SET pending_email = $1, pending_email_token = $2,
           email_verification_token = $2,
           email_verification_expires = $3,
           is_email_verified = false
       WHERE id = $4`,
      [newEmail.toLowerCase(), pendingToken, new Date(Date.now() + 24 * 60 * 60 * 1000), auth.id]
    );

    console.log(`[EMAIL] Verify new email token for ${newEmail}: ${pendingToken}`);

    res.json({ message: 'Verification sent to new email address' });
  } catch (err) {
    console.error('[storeCustomerController.changeEmail]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/store/:slug/customers/account  (requires storeAuth)
// ---------------------------------------------------------------------------
const deleteAccount = async (req, res) => {
  const client = await pool.connect();
  try {
    const { customerId } = req.customer;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required to delete account' });
    }

    const authRes = await client.query(
      `SELECT * FROM customer_auth WHERE customer_id = $1`,
      [customerId]
    );
    if (authRes.rows.length === 0) return res.status(404).json({ message: 'Account not found' });
    const auth = authRes.rows[0];

    const valid = await bcrypt.compare(password, auth.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Password is incorrect' });
    }

    await client.query('BEGIN');

    // Soft-delete customer
    await client.query(
      `UPDATE customers SET deleted_at = NOW(), is_active_online = false WHERE id = $1`,
      [customerId]
    );

    // Deactivate auth
    await client.query(
      `UPDATE customer_auth
       SET password_hash = '', email_verification_token = NULL, password_reset_token = NULL
       WHERE id = $1`,
      [auth.id]
    );

    await client.query('COMMIT');

    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[storeCustomerController.deleteAccount]', err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};

// ---------------------------------------------------------------------------
// GET /api/store/:slug/customers/addresses  (requires storeAuth)
// ---------------------------------------------------------------------------
const getAddresses = async (req, res) => {
  try {
    const { customerId } = req.customer;

    const result = await query(
      `SELECT * FROM customer_addresses WHERE customer_id = $1 ORDER BY is_default DESC, id ASC`,
      [customerId]
    );

    res.json(result.rows.map(formatAddress));
  } catch (err) {
    console.error('[storeCustomerController.getAddresses]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------------------------------------------------------------------------
// POST /api/store/:slug/customers/addresses  (requires storeAuth)
// ---------------------------------------------------------------------------
const addAddress = async (req, res) => {
  const client = await pool.connect();
  try {
    const { customerId } = req.customer;
    const {
      label,
      recipientName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country = 'Nigeria',
      deliveryNotes,
      isDefaultShipping = false,
      isDefaultBilling = false,
      addressType = 'shipping',
    } = req.body;

    if (!recipientName || !addressLine1 || !city || !state) {
      return res.status(400).json({ message: 'recipientName, addressLine1, city, and state are required' });
    }

    // Store address fields as a JSON string in full_address (TEXT column)
    const fullAddress = JSON.stringify({
      addressLine1,
      addressLine2: addressLine2 || '',
      city,
      state,
      postalCode: postalCode || '',
      country,
      deliveryNotes: deliveryNotes || '',
    });

    const isDefault = isDefaultShipping || isDefaultBilling;

    await client.query('BEGIN');

    if (isDefault) {
      await client.query(
        `UPDATE customer_addresses SET is_default = false
         WHERE customer_id = $1 AND address_type = $2`,
        [customerId, addressType]
      );
    }

    const result = await client.query(
      `INSERT INTO customer_addresses
         (customer_id, address_type, address_label, full_address, contact_person, contact_phone, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [customerId, addressType, label || null, fullAddress, recipientName, phone || null, isDefault]
    );

    await client.query('COMMIT');

    res.status(201).json(formatAddress(result.rows[0]));
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[storeCustomerController.addAddress]', err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};

// ---------------------------------------------------------------------------
// PATCH /api/store/:slug/customers/addresses/:addressId  (requires storeAuth)
// ---------------------------------------------------------------------------
const updateAddress = async (req, res) => {
  const client = await pool.connect();
  try {
    const { customerId } = req.customer;
    const { addressId } = req.params;

    // Verify ownership
    const existing = await client.query(
      `SELECT * FROM customer_addresses WHERE id = $1 AND customer_id = $2`,
      [addressId, customerId]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Address not found' });
    }
    const addr = existing.rows[0];

    const {
      label,
      recipientName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      deliveryNotes,
      isDefaultShipping,
      isDefaultBilling,
      addressType,
    } = req.body;

    // Parse existing full_address JSON
    let addrData = {};
    try { addrData = JSON.parse(addr.full_address); } catch (e) { addrData = {}; }

    const newFullAddress = JSON.stringify({
      addressLine1: addressLine1 !== undefined ? addressLine1 : addrData.addressLine1,
      addressLine2: addressLine2 !== undefined ? addressLine2 : (addrData.addressLine2 || ''),
      city: city !== undefined ? city : addrData.city,
      state: state !== undefined ? state : addrData.state,
      postalCode: postalCode !== undefined ? postalCode : (addrData.postalCode || ''),
      country: country !== undefined ? country : (addrData.country || 'Nigeria'),
      deliveryNotes: deliveryNotes !== undefined ? deliveryNotes : (addrData.deliveryNotes || ''),
    });

    const newLabel = label !== undefined ? label : addr.address_label;
    const newContactPerson = recipientName !== undefined ? recipientName : addr.contact_person;
    const newContactPhone = phone !== undefined ? phone : addr.contact_phone;
    const newAddressType = addressType !== undefined ? addressType : addr.address_type;
    const isDefault = isDefaultShipping !== undefined
      ? isDefaultShipping
      : (isDefaultBilling !== undefined ? isDefaultBilling : addr.is_default);

    await client.query('BEGIN');

    if (isDefault) {
      await client.query(
        `UPDATE customer_addresses SET is_default = false WHERE customer_id = $1 AND address_type = $2 AND id != $3`,
        [customerId, newAddressType, addressId]
      );
    }

    const result = await client.query(
      `UPDATE customer_addresses
       SET address_label = $1, full_address = $2, contact_person = $3,
           contact_phone = $4, is_default = $5, address_type = $6
       WHERE id = $7 AND customer_id = $8
       RETURNING *`,
      [newLabel, newFullAddress, newContactPerson, newContactPhone, isDefault, newAddressType, addressId, customerId]
    );

    await client.query('COMMIT');

    res.json(formatAddress(result.rows[0]));
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[storeCustomerController.updateAddress]', err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/store/:slug/customers/addresses/:addressId  (requires storeAuth)
// ---------------------------------------------------------------------------
const deleteAddress = async (req, res) => {
  try {
    const { customerId } = req.customer;
    const { addressId } = req.params;

    const result = await query(
      `DELETE FROM customer_addresses WHERE id = $1 AND customer_id = $2 RETURNING id`,
      [addressId, customerId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Address not found' });
    }

    res.json({ message: 'Address deleted' });
  } catch (err) {
    console.error('[storeCustomerController.deleteAddress]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------------------------------------------------------------------------
// PATCH /api/store/:slug/customers/addresses/:addressId/default  (requires storeAuth)
// ---------------------------------------------------------------------------
const setDefaultAddress = async (req, res) => {
  const client = await pool.connect();
  try {
    const { customerId } = req.customer;
    const { addressId } = req.params;
    const { addressType = 'shipping' } = req.body;

    // Verify ownership
    const existing = await client.query(
      `SELECT * FROM customer_addresses WHERE id = $1 AND customer_id = $2`,
      [addressId, customerId]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Address not found' });
    }

    await client.query('BEGIN');

    // Clear defaults for this address type
    await client.query(
      `UPDATE customer_addresses SET is_default = false WHERE customer_id = $1 AND address_type = $2`,
      [customerId, addressType]
    );

    // Set this one as default
    const result = await client.query(
      `UPDATE customer_addresses SET is_default = true WHERE id = $1 RETURNING *`,
      [addressId]
    );

    await client.query('COMMIT');

    res.json(formatAddress(result.rows[0]));
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[storeCustomerController.setDefaultAddress]', err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};

// ---------------------------------------------------------------------------
// Helper: format customer_address row for API
// ---------------------------------------------------------------------------
function formatAddress(row) {
  let parsed = {};
  try { parsed = JSON.parse(row.full_address); } catch (e) { parsed = { addressLine1: row.full_address }; }

  return {
    id: row.id,
    customerId: row.customer_id,
    addressType: row.address_type,
    label: row.address_label,
    recipientName: row.contact_person,
    phone: row.contact_phone,
    addressLine1: parsed.addressLine1 || '',
    addressLine2: parsed.addressLine2 || '',
    city: parsed.city || '',
    state: parsed.state || '',
    postalCode: parsed.postalCode || '',
    country: parsed.country || 'Nigeria',
    deliveryNotes: parsed.deliveryNotes || '',
    isDefault: row.is_default,
    createdAt: row.created_at,
  };
}

module.exports = {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  getProfile,
  updateProfile,
  changePassword,
  changeEmail,
  deleteAccount,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
