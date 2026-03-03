const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/taskController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

router.use(authenticateToken);

router.get('/', authorize('view_tasks'), getTasks);
router.get('/my-tasks', getMyTasks);
router.get('/statistics', authorize('view_tasks'), getTaskStatistics);
router.post('/', authorize('manage_tasks'), createTask);
router.get('/:id', authorize('view_tasks'), getTaskById);
router.put('/:id', authorize('manage_tasks'), updateTask);
router.delete('/:id', authorize('manage_tasks'), deleteTask);
router.patch('/:id/status', authorize('manage_tasks'), updateTaskStatus);
router.patch('/:id/reassign', authorize('manage_tasks'), reassignTask);
router.get('/:id/history', authorize('view_tasks'), getTaskHistory);

module.exports = router;
