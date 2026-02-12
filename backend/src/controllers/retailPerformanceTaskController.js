const taskService = require('../services/RetailPerformanceTaskService');

class RetailPerformanceTaskController {
    async createTask(req, res) {
        try {
            const userId = req.user.id;
            const task = await taskService.createTask(req.body, userId);
            res.status(201).json(task);
        } catch (error) {
            console.error('Error creating task:', error);
            res.status(500).json({ message: error.message });
        }
    }

    async getAllTasks(req, res) {
        try {
            const filters = {
                status: req.query.status,
                type: req.query.type,
                userId: req.query.userId
            };
            const tasks = await taskService.getAllTasks(filters);
            res.json(tasks);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async getMyTasks(req, res) {
        try {
            const userId = req.user.id;
            const tasks = await taskService.getAllTasks({ userId });
            res.json(tasks);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async getTaskById(req, res) {
        try {
            const task = await taskService.getTaskById(req.params.id);
            res.json(task);
        } catch (error) {
            res.status(404).json({ message: error.message });
        }
    }

    async updateStatus(req, res) {
        try {
            const { status, reason } = req.body;
            const userId = req.user.id;
            await taskService.updateTaskStatus(req.params.id, status, userId, reason);
            res.json({ message: `Task status updated to ${status}` });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // ============================================================================
    // ADVANCED TASK MANAGEMENT
    // ============================================================================

    /**
     * Pause Task
     */
    async pauseTask(req, res) {
        try {
            const { reason } = req.body;
            const userId = req.user.id;
            await taskService.pauseTask(req.params.id, userId, reason);
            res.json({ message: 'Task paused successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * Resume Task
     */
    async resumeTask(req, res) {
        try {
            const userId = req.user.id;
            await taskService.resumeTask(req.params.id, userId);
            res.json({ message: 'Task resumed successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * Extend Task Deadline
     */
    async extendTask(req, res) {
        try {
            const { new_end_time, extension_reason } = req.body;
            const userId = req.user.id;
            await taskService.extendTask(req.params.id, new_end_time, extension_reason, userId);
            res.json({ message: 'Task deadline extended successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * End Task Early
     */
    async endTaskEarly(req, res) {
        try {
            const { end_reason } = req.body;
            const userId = req.user.id;
            await taskService.endTaskEarly(req.params.id, end_reason, userId);
            res.json({ message: 'Task ended early successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * Reassign Task
     */
    async reassignTask(req, res) {
        try {
            const { user_ids, reassignment_reason } = req.body;
            const userId = req.user.id;
            await taskService.reassignTask(req.params.id, user_ids, reassignment_reason, userId);
            res.json({ message: 'Task reassigned successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * Get Task Statistics
     */
    async getTaskStatistics(req, res) {
        try {
            const stats = await taskService.getTaskStatistics(req.params.id);
            res.json(stats);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * Get Task History (pause/resume/extension events)
     */
    async getTaskHistory(req, res) {
        try {
            const history = await taskService.getTaskHistory(req.params.id);
            res.json(history);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * Get Performance Dashboard
     */
    async getPerformanceDashboard(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const dashboard = await taskService.getPerformanceDashboard(startDate, endDate);
            res.json(dashboard);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}

module.exports = new RetailPerformanceTaskController();
