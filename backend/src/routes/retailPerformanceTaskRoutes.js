const express = require('express');
const router = express.Router();
const taskController = require('../controllers/retailPerformanceTaskController');
const authenticateToken = require('../middleware/authMiddleware');

router.use(authenticateToken);

// ============================================================================
// TASK CRUD ROUTES
// ============================================================================

// Create new task
router.post('/', taskController.createTask);

// Get all tasks with filtering
router.get('/', taskController.getAllTasks);

// Get my tasks
router.get('/my-tasks', taskController.getMyTasks);

// Get performance dashboard
router.get('/dashboard', taskController.getPerformanceDashboard);

// Get single task
router.get('/:id', taskController.getTaskById);

// Update task status
router.patch('/:id/status', taskController.updateStatus);

// ============================================================================
// TASK MANAGEMENT ROUTES
// ============================================================================

// Pause task
router.post('/:id/pause', taskController.pauseTask);

// Resume task
router.post('/:id/resume', taskController.resumeTask);

// Extend task deadline
router.post('/:id/extend', taskController.extendTask);

// End task early
router.post('/:id/end-early', taskController.endTaskEarly);

// Reassign task
router.post('/:id/reassign', taskController.reassignTask);

// ============================================================================
// TASK ANALYTICS ROUTES
// ============================================================================

// Get task statistics
router.get('/:id/statistics', taskController.getTaskStatistics);

// Get task history (pause/resume/extension events)
router.get('/:id/history', taskController.getTaskHistory);

module.exports = router;
