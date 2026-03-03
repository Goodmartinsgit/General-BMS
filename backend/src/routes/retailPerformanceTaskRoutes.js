const express = require('express');
const router = express.Router();
const taskController = require('../controllers/retailPerformanceTaskController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

router.use(authenticateToken);

// ============================================================================
// TASK CRUD ROUTES
// ============================================================================

// Create new task
router.post('/', authorize('manage_performance_tasks'), taskController.createTask);

// Get all tasks with filtering
router.get('/', authorize('view_performance_tasks'), taskController.getAllTasks);

// Get my tasks
router.get('/my-tasks', authorize('view_performance_tasks'), taskController.getMyTasks);

// Get performance dashboard
router.get('/dashboard', authorize('view_performance_tasks'), taskController.getPerformanceDashboard);

// Get single task
router.get('/:id', authorize('view_performance_tasks'), taskController.getTaskById);

// Update task status
router.patch('/:id/status', authorize('manage_performance_tasks'), taskController.updateStatus);

// ============================================================================
// TASK MANAGEMENT ROUTES
// ============================================================================

// Pause task
router.post('/:id/pause', authorize('manage_performance_tasks'), taskController.pauseTask);

// Resume task
router.post('/:id/resume', authorize('manage_performance_tasks'), taskController.resumeTask);

// Extend task deadline
router.post('/:id/extend', authorize('manage_performance_tasks'), taskController.extendTask);

// End task early
router.post('/:id/end-early', authorize('manage_performance_tasks'), taskController.endTaskEarly);

// Reassign task
router.post('/:id/reassign', authorize('manage_performance_tasks'), taskController.reassignTask);

// ============================================================================
// TASK ANALYTICS ROUTES
// ============================================================================

// Get task statistics
router.get('/:id/statistics', authorize('view_performance_tasks'), taskController.getTaskStatistics);

// Get task history (pause/resume/extension events)
router.get('/:id/history', authorize('view_performance_tasks'), taskController.getTaskHistory);

module.exports = router;
