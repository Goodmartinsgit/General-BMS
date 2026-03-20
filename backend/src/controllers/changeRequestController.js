'use strict';

const { query } = require('../config/db');
const { createNotification } = require('./notificationController');

// =========================================================================
// CUSTOMER-FACING  (storeAuth)
// =========================================================================

// POST /api/store/:slug/customers/change-request
const submitChangeRequest = async (req, res) => {
  try {
    const { customerId } = req.customer;
    const { requestType, newValue, reason } = req.body;

    if (!['email', 'whatsapp'].includes(requestType)) {
      return res.status(400).json({ message: 'Invalid request type. Must be "email" or "whatsapp".' });
    }
    if (!newValue || !newValue.trim()) {
      return res.status(400).json({ message: 'New value is required.' });
    }

    // Get current value
    const authRes = await query(
      `SELECT email, whatsapp_number FROM customer_auth WHERE customer_id = $1`,
      [customerId]
    );
    if (authRes.rows.length === 0) return res.status(404).json({ message: 'Customer not found' });
    const auth = authRes.rows[0];
    const currentValue = requestType === 'email' ? auth.email : (auth.whatsapp_number || '');

    if (newValue.trim() === currentValue) {
      return res.status(400).json({ message: `The new ${requestType} is the same as the current one.` });
    }

    // Check for existing pending request of same type
    const existingRes = await query(
      `SELECT id FROM customer_change_requests
       WHERE customer_id = $1 AND request_type = $2 AND status = 'pending'`,
      [customerId, requestType]
    );
    if (existingRes.rows.length > 0) {
      return res.status(409).json({
        message: `You already have a pending ${requestType} change request. Please wait for it to be reviewed.`,
      });
    }

    // If email, check uniqueness
    if (requestType === 'email') {
      const dupRes = await query(
        `SELECT id FROM customer_auth WHERE email = $1 AND customer_id != $2`,
        [newValue.trim().toLowerCase(), customerId]
      );
      if (dupRes.rows.length > 0) {
        return res.status(409).json({ message: 'This email is already in use by another account.' });
      }
    }

    // If whatsapp, check uniqueness
    if (requestType === 'whatsapp') {
      const dupRes = await query(
        `SELECT id FROM customer_auth WHERE whatsapp_number = $1 AND customer_id != $2`,
        [newValue.trim(), customerId]
      );
      if (dupRes.rows.length > 0) {
        return res.status(409).json({ message: 'This WhatsApp number is already in use by another account.' });
      }
    }

    const result = await query(
      `INSERT INTO customer_change_requests
         (customer_id, request_type, current_value, new_value, reason)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [customerId, requestType, currentValue, newValue.trim(), reason || null]
    );

    // Get customer name for the notification
    const custRes = await query(`SELECT customer_name FROM customers WHERE id = $1`, [customerId]);
    const customerName = custRes.rows[0]?.customer_name || 'A customer';

    // Notify all admin users
    const adminsRes = await query(`SELECT id FROM users WHERE is_active = true`);
    for (const admin of adminsRes.rows) {
      await createNotification(
        admin.id,
        'info',
        `${requestType === 'email' ? 'Email' : 'WhatsApp'} Change Request`,
        `${customerName} requested to change their ${requestType} from "${currentValue}" to "${newValue.trim()}".`,
        'change_request',
        result.rows[0].id
      );
    }

    res.status(201).json({
      message: `Your ${requestType} change request has been submitted. You will be notified once it is reviewed.`,
      request: formatRequest(result.rows[0]),
    });
  } catch (err) {
    console.error('[changeRequestController.submitChangeRequest]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/store/:slug/customers/change-requests
const getMyChangeRequests = async (req, res) => {
  try {
    const { customerId } = req.customer;
    const result = await query(
      `SELECT * FROM customer_change_requests
       WHERE customer_id = $1 ORDER BY created_at DESC`,
      [customerId]
    );
    res.json(result.rows.map(formatRequest));
  } catch (err) {
    console.error('[changeRequestController.getMyChangeRequests]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================================================================
// ADMIN-FACING  (auth + permission)
// =========================================================================

// GET /api/change-requests
const listChangeRequests = async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    let where = '';
    if (status !== 'all') {
      params.push(status);
      where = `WHERE cr.status = $${params.length}`;
    }

    const countRes = await query(
      `SELECT COUNT(*) FROM customer_change_requests cr ${where}`,
      params
    );

    params.push(parseInt(limit), offset);
    const result = await query(
      `SELECT cr.*, c.customer_name, ca.email AS current_email, ca.whatsapp_number AS current_whatsapp
       FROM customer_change_requests cr
       JOIN customers c ON c.id = cr.customer_id
       LEFT JOIN customer_auth ca ON ca.customer_id = cr.customer_id
       ${where}
       ORDER BY CASE WHEN cr.status = 'pending' THEN 0 ELSE 1 END, cr.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const total = parseInt(countRes.rows[0].count);
    res.json({
      requests: result.rows.map(formatAdminRequest),
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    console.error('[changeRequestController.listChangeRequests]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/change-requests/:id/approve
const approveChangeRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const { adminNote } = req.body;

    const reqRes = await query(`SELECT * FROM customer_change_requests WHERE id = $1`, [id]);
    if (reqRes.rows.length === 0) return res.status(404).json({ message: 'Request not found' });
    const cr = reqRes.rows[0];

    if (cr.status !== 'pending') {
      return res.status(400).json({ message: `Request already ${cr.status}` });
    }

    // Apply the change
    if (cr.request_type === 'email') {
      await query(
        `UPDATE customer_auth SET email = $1, is_email_verified = true, updated_at = NOW() WHERE customer_id = $2`,
        [cr.new_value, cr.customer_id]
      );
      // Also update the customers table email if it exists
      await query(`UPDATE customers SET email = $1, updated_at = NOW() WHERE id = $2`, [cr.new_value, cr.customer_id]);
    } else if (cr.request_type === 'whatsapp') {
      await query(
        `UPDATE customer_auth SET whatsapp_number = $1, updated_at = NOW() WHERE customer_id = $2`,
        [cr.new_value, cr.customer_id]
      );
    }

    // Mark approved
    await query(
      `UPDATE customer_change_requests
       SET status = 'approved', admin_note = $1, reviewed_by = $2, reviewed_at = NOW(), updated_at = NOW()
       WHERE id = $3`,
      [adminNote || null, adminId, id]
    );

    res.json({ message: `${cr.request_type} change approved and applied.` });
  } catch (err) {
    console.error('[changeRequestController.approveChangeRequest]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/change-requests/:id/reject
const rejectChangeRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const { adminNote } = req.body;

    const reqRes = await query(`SELECT * FROM customer_change_requests WHERE id = $1`, [id]);
    if (reqRes.rows.length === 0) return res.status(404).json({ message: 'Request not found' });
    const cr = reqRes.rows[0];

    if (cr.status !== 'pending') {
      return res.status(400).json({ message: `Request already ${cr.status}` });
    }

    await query(
      `UPDATE customer_change_requests
       SET status = 'rejected', admin_note = $1, reviewed_by = $2, reviewed_at = NOW(), updated_at = NOW()
       WHERE id = $3`,
      [adminNote || null, adminId, id]
    );

    res.json({ message: `${cr.request_type} change request rejected.` });
  } catch (err) {
    console.error('[changeRequestController.rejectChangeRequest]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================================================================
// Helpers
// =========================================================================

function formatRequest(row) {
  return {
    id: row.id,
    requestType: row.request_type,
    currentValue: row.current_value,
    newValue: row.new_value,
    reason: row.reason,
    status: row.status,
    adminNote: row.admin_note,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
  };
}

function formatAdminRequest(row) {
  return {
    id: row.id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    currentEmail: row.current_email,
    currentWhatsapp: row.current_whatsapp,
    requestType: row.request_type,
    currentValue: row.current_value,
    newValue: row.new_value,
    reason: row.reason,
    status: row.status,
    adminNote: row.admin_note,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
  };
}

module.exports = {
  submitChangeRequest,
  getMyChangeRequests,
  listChangeRequests,
  approveChangeRequest,
  rejectChangeRequest,
};
