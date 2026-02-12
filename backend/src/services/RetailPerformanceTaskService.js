const { pool } = require('../config/db');

class RetailPerformanceTaskService {
    /**
     * Create a new performance task
     */
    async createTask(taskData, createdBy) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const {
                title,
                description,
                task_type,
                target_value,
                target_min,
                target_max,
                start_time,
                end_time,
                user_ids // Array of UUIDs
            } = taskData;

            // Basic validation
            if (!title || !task_type || !target_value || !start_time || !end_time || !user_ids || user_ids.length === 0) {
                throw new Error('Missing required fields or assignments');
            }

            const createTaskQuery = `
                INSERT INTO retail_performance_tasks (
                    title, description, task_type, target_value, 
                    target_min, target_max, start_time, end_time, 
                    status, created_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'scheduled', $9)
                RETURNING *
            `;

            const taskResult = await client.query(createTaskQuery, [
                title, description, task_type, target_value,
                target_min, target_max, start_time, end_time, createdBy
            ]);

            const task = taskResult.rows[0];

            // Assign users
            for (const userId of user_ids) {
                await client.query(
                    'INSERT INTO task_assignments (task_id, user_id) VALUES ($1, $2)',
                    [task.id, userId]
                );
            }

            await client.query('COMMIT');
            return task;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get task details with assignments and progress
     */
    async getTaskById(taskId) {
        const res = await pool.query(`
            SELECT t.*, u.full_name as creator_name
            FROM retail_performance_tasks t
            LEFT JOIN users u ON t.created_by = u.id
            WHERE t.id = $1
        `, [taskId]);

        if (res.rows.length === 0) throw new Error('Task not found');
        const task = res.rows[0];

        const assignments = await pool.query(`
            SELECT u.id, u.full_name, u.role, 
                   COALESCE(tps.total_progress, 0) as progress
            FROM task_assignments ta
            JOIN users u ON ta.user_id = u.id
            LEFT JOIN task_progress_summary tps ON tps.task_id = ta.task_id AND tps.user_id = u.id
            WHERE ta.task_id = $1
        `, [taskId]);

        task.assignments = assignments.rows;
        return task;
    }

    /**
     * Get all tasks with optional filters
     */
    async getAllTasks(filters = {}) {
        const { status, type, userId } = filters;
        let query = `
            SELECT t.*, 
                   (SELECT SUM(total_progress) FROM task_progress_summary WHERE task_id = t.id) as current_total_progress
            FROM retail_performance_tasks t
        `;
        const params = [];
        const conditions = [];

        if (status) {
            params.push(status);
            conditions.push(`t.status = $${params.length}`);
        }
        if (type) {
            params.push(type);
            conditions.push(`t.task_type = $${params.length}`);
        }
        if (userId) {
            params.push(userId);
            conditions.push(`t.id IN (SELECT task_id FROM task_assignments WHERE user_id = $${params.length})`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY t.created_at DESC';
        const res = await pool.query(query, params);
        return res.rows;
    }

    /**
     * Record sale contribution to active tasks
     */
    async recordSaleProgress(sale, userId) {
        try {
            // Find active tasks assigned to this user
            const activeTasks = await pool.query(`
                SELECT t.*
                FROM retail_performance_tasks t
                JOIN task_assignments ta ON t.id = ta.task_id
                WHERE ta.user_id = $1 AND t.status = 'active'
                  AND NOW() BETWEEN t.start_time AND COALESCE(t.extended_end_time, t.end_time)
            `, [userId]);

            for (const task of activeTasks.rows) {
                let contribution = 0;
                switch (task.task_type) {
                    case 'sales_count': contribution = 1; break;
                    case 'sales_amount': contribution = parseFloat(sale.total_amount); break;
                    case 'tiles_quantity':
                        contribution = (sale.items || []).reduce((sum, item) => 
                            sum + (item.category === 'Tiles' ? parseFloat(item.quantity) : 0), 0);
                        break;
                    case 'accessories_quantity':
                        contribution = (sale.items || []).reduce((sum, item) => 
                            sum + (item.category === 'Accessory' ? parseFloat(item.quantity) : 0), 0);
                        break;
                    case 'general_product_quantity':
                        contribution = (sale.items || []).reduce((sum, item) => 
                            sum + parseFloat(item.quantity), 0);
                        break;
                }

                if (contribution > 0) {
                    await pool.query(`
                        INSERT INTO task_progress (task_id, user_id, sale_id, contribution_value)
                        VALUES ($1, $2, $3, $4)
                        ON CONFLICT (task_id, sale_id, user_id) DO NOTHING
                    `, [task.id, userId, sale.id, contribution]);
                    
                    // Refresh materialized view (could be throttled or moved to background)
                    await pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY task_progress_summary');
                }
            }
        } catch (error) {
            console.error('Error recording task progress:', error);
        }
    }

    async updateTaskStatus(taskId, status, userId, reason = '') {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const updateFields = [`status = $1`, `updated_at = NOW()`];
            const params = [status, taskId];

            if (status === 'paused') {
                updateFields.push(`paused_at = NOW()`, `paused_by = $${params.length + 1}`);
                params.push(userId);
                await client.query(`INSERT INTO task_pause_history (task_id, paused_at, paused_by, pause_reason) VALUES ($1, NOW(), $2, $3)`, [taskId, userId, reason]);
            } else if (status === 'active') {
                updateFields.push(`resumed_at = NOW()`);
                await client.query(`UPDATE task_pause_history SET resumed_at = NOW(), resumed_by = $1, pause_duration_seconds = EXTRACT(EPOCH FROM (NOW() - paused_at)) WHERE task_id = $2 AND resumed_at IS NULL`, [userId, taskId]);
            } else if (status === 'cancelled') {
                updateFields.push(`cancelled_at = NOW()`, `cancelled_by = $${params.length + 1}`, `cancel_reason = $${params.length + 2}`);
                params.push(userId, reason);
            }

            await client.query(`UPDATE retail_performance_tasks SET ${updateFields.join(', ')} WHERE id = $2`, params);
            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // ============================================================================
    // ADVANCED TASK MANAGEMENT
    // ============================================================================

    /**
     * Pause Task
     */
    async pauseTask(taskId, userId, reason) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Check task exists and is active
            const task = await client.query(
                'SELECT * FROM retail_performance_tasks WHERE id = $1 FOR UPDATE',
                [taskId]
            );

            if (task.rows.length === 0) {
                throw new Error('Task not found');
            }

            if (task.rows[0].status !== 'active') {
                throw new Error('Can only pause active tasks');
            }

            // Update task status
            await client.query(
                `UPDATE retail_performance_tasks SET
                    status = 'paused',
                    pause_count = pause_count + 1,
                    updated_at = NOW()
                 WHERE id = $1`,
                [taskId]
            );

            // Record pause event
            await client.query(
                `INSERT INTO task_pause_history (task_id, paused_at, paused_by, pause_reason)
                 VALUES ($1, NOW(), $2, $3)`,
                [taskId, userId, reason || null]
            );

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Resume Task
     */
    async resumeTask(taskId, userId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Check task exists and is paused
            const task = await client.query(
                'SELECT * FROM retail_performance_tasks WHERE id = $1 FOR UPDATE',
                [taskId]
            );

            if (task.rows.length === 0) {
                throw new Error('Task not found');
            }

            if (task.rows[0].status !== 'paused') {
                throw new Error('Can only resume paused tasks');
            }

            // Update task status
            await client.query(
                `UPDATE retail_performance_tasks SET
                    status = 'active',
                    updated_at = NOW()
                 WHERE id = $1`,
                [taskId]
            );

            // Update pause history
            await client.query(
                `UPDATE task_pause_history SET
                    resumed_at = NOW(),
                    resumed_by = $1,
                    pause_duration_seconds = EXTRACT(EPOCH FROM (NOW() - paused_at))
                 WHERE task_id = $2 AND resumed_at IS NULL`,
                [userId, taskId]
            );

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Extend Task Deadline
     */
    async extendTask(taskId, new_end_time, extension_reason, userId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Check task exists
            const task = await client.query(
                'SELECT * FROM retail_performance_tasks WHERE id = $1 FOR UPDATE',
                [taskId]
            );

            if (task.rows.length === 0) {
                throw new Error('Task not found');
            }

            if (task.rows[0].status === 'completed' || task.rows[0].status === 'cancelled') {
                throw new Error('Cannot extend completed or cancelled tasks');
            }

            const old_end_time = task.rows[0].extended_end_time || task.rows[0].end_time;

            // Validate new end time is after current end time
            if (new Date(new_end_time) <= new Date(old_end_time)) {
                throw new Error('New end time must be after current end time');
            }

            // Update task
            await client.query(
                `UPDATE retail_performance_tasks SET
                    extended_end_time = $1,
                    extended_count = extended_count + 1,
                    updated_at = NOW()
                 WHERE id = $2`,
                [new_end_time, taskId]
            );

            // Record extension history
            await client.query(
                `INSERT INTO task_extension_history (
                    task_id, old_end_time, new_end_time, extension_reason, extended_by
                )
                 VALUES ($1, $2, $3, $4, $5)`,
                [taskId, old_end_time, new_end_time, extension_reason || null, userId]
            );

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * End Task Early
     */
    async endTaskEarly(taskId, end_reason, userId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Check task exists
            const task = await client.query(
                'SELECT * FROM retail_performance_tasks WHERE id = $1 FOR UPDATE',
                [taskId]
            );

            if (task.rows.length === 0) {
                throw new Error('Task not found');
            }

            if (task.rows[0].status === 'completed' || task.rows[0].status === 'cancelled') {
                throw new Error('Task is already completed or cancelled');
            }

            // Update task
            await client.query(
                `UPDATE retail_performance_tasks SET
                    status = 'completed',
                    early_end_at = NOW(),
                    early_end_reason = $1,
                    early_ended_by = $2,
                    updated_at = NOW()
                 WHERE id = $3`,
                [end_reason, userId, taskId]
            );

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Reassign Task
     */
    async reassignTask(taskId, new_user_ids, reassignment_reason, userId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Check task exists
            const task = await client.query(
                'SELECT * FROM retail_performance_tasks WHERE id = $1',
                [taskId]
            );

            if (task.rows.length === 0) {
                throw new Error('Task not found');
            }

            // Get old assignments
            const oldAssignments = await client.query(
                'SELECT user_id FROM task_assignments WHERE task_id = $1',
                [taskId]
            );

            // Remove old assignments
            await client.query('DELETE FROM task_assignments WHERE task_id = $1', [taskId]);

            // Add new assignments
            for (const new_user_id of new_user_ids) {
                await client.query(
                    'INSERT INTO task_assignments (task_id, user_id) VALUES ($1, $2)',
                    [taskId, new_user_id]
                );
            }

            // Record reassignment history
            await client.query(
                `INSERT INTO task_reassignment_history (
                    task_id, old_user_ids, new_user_ids, reassignment_reason, reassigned_by
                )
                 VALUES ($1, $2, $3, $4, $5)`,
                [
                    taskId,
                    JSON.stringify(oldAssignments.rows.map(r => r.user_id)),
                    JSON.stringify(new_user_ids),
                    reassignment_reason || null,
                    userId
                ]
            );

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get Task Statistics
     */
    async getTaskStatistics(taskId) {
        const task = await this.getTaskById(taskId);

        // Get progress by user
        const progressResult = await pool.query(
            `SELECT ta.user_id, u.full_name, COALESCE(tps.total_progress, 0) as progress,
                    COUNT(tp.id) as contribution_count
             FROM task_assignments ta
             JOIN users u ON ta.user_id = u.id
             LEFT JOIN task_progress_summary tps ON tps.task_id = ta.task_id AND tps.user_id = u.id
             LEFT JOIN task_progress tp ON tp.task_id = ta.task_id AND tp.user_id = u.id
             WHERE ta.task_id = $1
             GROUP BY ta.user_id, u.full_name, tps.total_progress`,
            [taskId]
        );

        // Calculate total progress
        const total_progress = progressResult.rows.reduce((sum, row) => sum + parseFloat(row.progress || 0), 0);
        const progress_percentage = task.target_value > 0 ? (total_progress / task.target_value) * 100 : 0;

        // Get pause/resume count
        const pauseResult = await pool.query(
            'SELECT COUNT(*) as pause_count FROM task_pause_history WHERE task_id = $1',
            [taskId]
        );

        // Get extension count
        const extensionResult = await pool.query(
            'SELECT COUNT(*) as extension_count FROM task_extension_history WHERE task_id = $1',
            [taskId]
        );

        // Calculate time remaining
        const end_time = new Date(task.extended_end_time || task.end_time);
        const now = new Date();
        const time_remaining_ms = end_time - now;
        const time_remaining_hours = Math.max(0, time_remaining_ms / (1000 * 60 * 60));

        return {
            task_id: taskId,
            task_title: task.title,
            task_type: task.task_type,
            status: task.status,
            target_value: task.target_value,
            current_progress: total_progress,
            progress_percentage: progress_percentage.toFixed(2),
            time_remaining_hours: time_remaining_hours.toFixed(2),
            pause_count: parseInt(pauseResult.rows[0].pause_count),
            extension_count: parseInt(extensionResult.rows[0].extension_count),
            progress_by_user: progressResult.rows,
            start_time: task.start_time,
            end_time: task.end_time,
            extended_end_time: task.extended_end_time
        };
    }

    /**
     * Get Task History
     */
    async getTaskHistory(taskId) {
        // Get pause/resume history
        const pauseHistory = await pool.query(
            `SELECT tph.*, u1.full_name as paused_by_name, u2.full_name as resumed_by_name
             FROM task_pause_history tph
             LEFT JOIN users u1 ON tph.paused_by = u1.id
             LEFT JOIN users u2 ON tph.resumed_by = u2.id
             WHERE tph.task_id = $1
             ORDER BY tph.paused_at DESC`,
            [taskId]
        );

        // Get extension history
        const extensionHistory = await pool.query(
            `SELECT teh.*, u.full_name as extended_by_name
             FROM task_extension_history teh
             LEFT JOIN users u ON teh.extended_by = u.id
             WHERE teh.task_id = $1
             ORDER BY teh.created_at DESC`,
            [taskId]
        );

        // Get reassignment history
        const reassignmentHistory = await pool.query(
            `SELECT trh.*, u.full_name as reassigned_by_name
             FROM task_reassignment_history trh
             LEFT JOIN users u ON trh.reassigned_by = u.id
             WHERE trh.task_id = $1
             ORDER BY trh.created_at DESC`,
            [taskId]
        );

        return {
            pause_history: pauseHistory.rows,
            extension_history: extensionHistory.rows,
            reassignment_history: reassignmentHistory.rows
        };
    }

    /**
     * Get Performance Dashboard
     */
    async getPerformanceDashboard(startDate, endDate) {
        let dateFilter = '';
        const params = [];

        if (startDate) {
            params.push(startDate);
            dateFilter += ` AND t.created_at >= $${params.length}`;
        }
        if (endDate) {
            params.push(endDate);
            dateFilter += ` AND t.created_at <= $${params.length}`;
        }

        // Total tasks by status
        const statusResult = await pool.query(
            `SELECT status, COUNT(*) as count
             FROM retail_performance_tasks t
             WHERE 1=1 ${dateFilter}
             GROUP BY status`,
            params
        );

        // Completion rate
        const completionResult = await pool.query(
            `SELECT
                COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
                COUNT(*) as total_count
             FROM retail_performance_tasks t
             WHERE 1=1 ${dateFilter}`,
            params
        );

        const completion_rate = completionResult.rows[0].total_count > 0
            ? (completionResult.rows[0].completed_count / completionResult.rows[0].total_count) * 100
            : 0;

        // Average completion time for completed tasks
        const avgTimeResult = await pool.query(
            `SELECT AVG(EXTRACT(EPOCH FROM (updated_at - start_time))) / 3600 as avg_hours
             FROM retail_performance_tasks t
             WHERE status = 'completed' ${dateFilter}`,
            params
        );

        return {
            tasks_by_status: statusResult.rows,
            total_tasks: parseInt(completionResult.rows[0].total_count),
            completed_tasks: parseInt(completionResult.rows[0].completed_count),
            completion_rate: completion_rate.toFixed(2),
            average_completion_hours: parseFloat(avgTimeResult.rows[0].avg_hours || 0).toFixed(2)
        };
    }
}

module.exports = new RetailPerformanceTaskService();
