const { pool } = require('../config/db');

const getNotifications = async (req, res) => {
    try {
        const { limit = 20, offset = 0 } = req.query;
        const result = await pool.query(
            `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
            [req.user.id, parseInt(limit), parseInt(offset)]
        );
        const countRes = await pool.query('SELECT COUNT(*) FROM notifications WHERE user_id = $1', [req.user.id]);
        res.json({ notifications: result.rows, total: parseInt(countRes.rows[0].count) });
    } catch (err) {
        console.error('Error fetching notifications:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getUnreadCount = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE', [req.user.id]
        );
        res.json({ count: parseInt(result.rows[0].count) });
    } catch (err) {
        console.error('Error fetching unread count:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const markAsRead = async (req, res) => {
    try {
        const result = await pool.query(
            'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *',
            [req.params.id, req.user.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Notification not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error marking notification:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const markAllAsRead = async (req, res) => {
    try {
        await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE', [req.user.id]);
        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        console.error('Error marking all notifications:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteNotification = async (req, res) => {
    try {
        await pool.query('DELETE FROM notifications WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
        res.json({ message: 'Notification deleted' });
    } catch (err) {
        console.error('Error deleting notification:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const createNotification = async (user_id, type, title, message, reference_type = null, reference_id = null) => {
    try {
        await pool.query(
            `INSERT INTO notifications (user_id, type, title, message, reference_type, reference_id)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [user_id, type, title, message, reference_type, reference_id]
        );
    } catch (err) {
        console.error('Error creating notification:', err);
    }
};

module.exports = { getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification, createNotification };
