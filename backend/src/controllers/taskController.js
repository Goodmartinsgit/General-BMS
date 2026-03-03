const { pool } = require('../config/db');

const getTasks = async (req, res) => {
    try {
        const { status, priority, assigned_to, category, start_date, end_date, branch_id } = req.query;
        let q = `SELECT t.*,
                        ua.full_name AS assigned_to_name,
                        ub.full_name AS assigned_by_name
                 FROM tasks t
                 LEFT JOIN users ua ON t.assigned_to = ua.id
                 LEFT JOIN users ub ON t.assigned_by = ub.id
                 WHERE t.is_deleted = false`;
        const params = [];

        if (status) {
            params.push(status);
            q += ` AND t.status = $${params.length}`;
        }
        if (priority) {
            params.push(priority);
            q += ` AND t.priority = $${params.length}`;
        }
        if (assigned_to) {
            params.push(assigned_to);
            q += ` AND t.assigned_to = $${params.length}`;
        }
        if (category) {
            params.push(category);
            q += ` AND t.category = $${params.length}`;
        }
        if (start_date) {
            params.push(start_date);
            q += ` AND t.due_date >= $${params.length}`;
        }
        if (end_date) {
            params.push(end_date);
            q += ` AND t.due_date <= $${params.length}`;
        }
        if (branch_id) {
            params.push(branch_id);
            q += ` AND t.branch_id = $${params.length}`;
        }

        q += ` ORDER BY t.created_at DESC`;

        const result = await pool.query(q, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching tasks:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getTaskById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT t.*,
                    ua.full_name AS assigned_to_name,
                    ub.full_name AS assigned_by_name
             FROM tasks t
             LEFT JOIN users ua ON t.assigned_to = ua.id
             LEFT JOIN users ub ON t.assigned_by = ub.id
             WHERE t.id = $1 AND t.is_deleted = false`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching task:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const createTask = async (req, res) => {
    try {
        const {
            title, description, priority, category, assigned_to,
            due_date, branch_id
        } = req.body;
        const assigned_by = req.user.id;

        // Generate task number: TASK-YYYYMMDD-NNN
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const countResult = await pool.query(
            `SELECT COUNT(*) FROM tasks WHERE task_number LIKE $1`,
            [`TASK-${dateStr}-%`]
        );
        const seq = (parseInt(countResult.rows[0].count, 10) + 1).toString().padStart(3, '0');
        const task_number = `TASK-${dateStr}-${seq}`;

        const result = await pool.query(
            `INSERT INTO tasks (task_number, title, description, priority, category, assigned_to, assigned_by, due_date, branch_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [task_number, title, description, priority || 'medium', category, assigned_to, assigned_by, due_date, branch_id]
        );

        const task = result.rows[0];

        // Insert task_history record
        await pool.query(
            `INSERT INTO task_history (task_id, action_type, changed_by, new_values)
             VALUES ($1, 'created', $2, $3)`,
            [task.id, assigned_by, JSON.stringify(task)]
        );

        // Create notification for assigned user
        if (assigned_to) {
            await pool.query(
                `INSERT INTO task_notifications (task_id, user_id, type, message)
                 VALUES ($1, $2, 'assignment', $3)`,
                [task.id, assigned_to, `You have been assigned a new task: ${title}`]
            );
        }

        res.status(201).json(task);
    } catch (err) {
        console.error('Error creating task:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title, description, priority, category, due_date, branch_id
        } = req.body;
        const userId = req.user.id;

        // Fetch old values
        const oldResult = await pool.query(
            `SELECT * FROM tasks WHERE id = $1 AND is_deleted = false`,
            [id]
        );

        if (oldResult.rows.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const oldTask = oldResult.rows[0];

        const result = await pool.query(
            `UPDATE tasks SET
                title = COALESCE($1, title),
                description = COALESCE($2, description),
                priority = COALESCE($3, priority),
                category = COALESCE($4, category),
                due_date = COALESCE($5, due_date),
                branch_id = COALESCE($6, branch_id),
                updated_at = NOW()
             WHERE id = $7 AND is_deleted = false RETURNING *`,
            [title, description, priority, category, due_date, branch_id, id]
        );

        const updatedTask = result.rows[0];

        // Record changes in task_history
        await pool.query(
            `INSERT INTO task_history (task_id, action_type, changed_by, old_values, new_values)
             VALUES ($1, 'updated', $2, $3, $4)`,
            [id, userId, JSON.stringify(oldTask), JSON.stringify(updatedTask)]
        );

        res.json(updatedTask);
    } catch (err) {
        console.error('Error updating task:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await pool.query(
            `UPDATE tasks SET is_deleted = true, deleted_at = NOW(), deleted_by = $1, updated_at = NOW()
             WHERE id = $2 AND is_deleted = false RETURNING *`,
            [userId, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json({ message: 'Task deleted successfully' });
    } catch (err) {
        console.error('Error deleting task:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateTaskStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user.id;

        // Fetch old status
        const oldResult = await pool.query(
            `SELECT status FROM tasks WHERE id = $1 AND is_deleted = false`,
            [id]
        );

        if (oldResult.rows.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const oldStatus = oldResult.rows[0].status;

        let q = `UPDATE tasks SET status = $1, updated_at = NOW()`;
        const params = [status];

        if (status === 'completed') {
            q += `, completed_at = NOW()`;
        }

        params.push(id);
        q += ` WHERE id = $${params.length} AND is_deleted = false RETURNING *`;

        const result = await pool.query(q, params);
        const updatedTask = result.rows[0];

        // Record in history
        await pool.query(
            `INSERT INTO task_history (task_id, action_type, changed_by, old_values, new_values)
             VALUES ($1, 'status_changed', $2, $3, $4)`,
            [id, userId, JSON.stringify({ status: oldStatus }), JSON.stringify({ status })]
        );

        res.json(updatedTask);
    } catch (err) {
        console.error('Error updating task status:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const reassignTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { assigned_to } = req.body;
        const userId = req.user.id;

        // Fetch old assignee
        const oldResult = await pool.query(
            `SELECT assigned_to, title FROM tasks WHERE id = $1 AND is_deleted = false`,
            [id]
        );

        if (oldResult.rows.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const oldAssignedTo = oldResult.rows[0].assigned_to;
        const taskTitle = oldResult.rows[0].title;

        const result = await pool.query(
            `UPDATE tasks SET assigned_to = $1, updated_at = NOW()
             WHERE id = $2 AND is_deleted = false RETURNING *`,
            [assigned_to, id]
        );

        const updatedTask = result.rows[0];

        // Record in history
        await pool.query(
            `INSERT INTO task_history (task_id, action_type, changed_by, old_values, new_values)
             VALUES ($1, 'reassigned', $2, $3, $4)`,
            [id, userId, JSON.stringify({ assigned_to: oldAssignedTo }), JSON.stringify({ assigned_to })]
        );

        // Create notification for new assignee
        if (assigned_to) {
            await pool.query(
                `INSERT INTO task_notifications (task_id, user_id, type, message)
                 VALUES ($1, $2, 'assignment', $3)`,
                [id, assigned_to, `You have been assigned the task: ${taskTitle}`]
            );
        }

        res.json(updatedTask);
    } catch (err) {
        console.error('Error reassigning task:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getTaskStatistics = async (req, res) => {
    try {
        const { branch_id } = req.query;
        let branchFilter = '';
        const params = [];

        if (branch_id) {
            params.push(branch_id);
            branchFilter = ` AND branch_id = $${params.length}`;
        }

        // Counts by status
        const statusResult = await pool.query(
            `SELECT status, COUNT(*)::int AS count
             FROM tasks
             WHERE is_deleted = false${branchFilter}
             GROUP BY status`,
            params
        );

        // Counts by priority
        const priorityResult = await pool.query(
            `SELECT priority, COUNT(*)::int AS count
             FROM tasks
             WHERE is_deleted = false${branchFilter}
             GROUP BY priority`,
            params
        );

        // Overdue count
        const overdueResult = await pool.query(
            `SELECT COUNT(*)::int AS count
             FROM tasks
             WHERE is_deleted = false AND status != 'completed' AND due_date < NOW()${branchFilter}`,
            params
        );

        // Per-user stats
        const userStatsResult = await pool.query(
            `SELECT t.assigned_to, u.full_name,
                    COUNT(*)::int AS total,
                    COUNT(*) FILTER (WHERE t.status = 'completed')::int AS completed,
                    COUNT(*) FILTER (WHERE t.status != 'completed' AND t.due_date < NOW())::int AS overdue
             FROM tasks t
             LEFT JOIN users u ON t.assigned_to = u.id
             WHERE t.is_deleted = false${branchFilter}
             GROUP BY t.assigned_to, u.full_name`,
            params
        );

        res.json({
            by_status: statusResult.rows,
            by_priority: priorityResult.rows,
            overdue_count: overdueResult.rows[0].count,
            per_user: userStatsResult.rows
        });
    } catch (err) {
        console.error('Error fetching task statistics:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getTaskHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT th.*, u.full_name AS changed_by_name
             FROM task_history th
             LEFT JOIN users u ON th.changed_by = u.id
             WHERE th.task_id = $1
             ORDER BY th.created_at DESC`,
            [id]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching task history:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getMyTasks = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status, priority } = req.query;

        let q = `SELECT t.*,
                        ua.full_name AS assigned_to_name,
                        ub.full_name AS assigned_by_name
                 FROM tasks t
                 LEFT JOIN users ua ON t.assigned_to = ua.id
                 LEFT JOIN users ub ON t.assigned_by = ub.id
                 WHERE t.assigned_to = $1 AND t.is_deleted = false`;
        const params = [userId];

        if (status) {
            params.push(status);
            q += ` AND t.status = $${params.length}`;
        }
        if (priority) {
            params.push(priority);
            q += ` AND t.priority = $${params.length}`;
        }

        q += ` ORDER BY t.created_at DESC`;

        const result = await pool.query(q, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching my tasks:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    reassignTask,
    getTaskStatistics,
    getTaskHistory,
    getMyTasks
};
