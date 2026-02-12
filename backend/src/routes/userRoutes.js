const express = require('express');
const router = express.Router();
const { getAllUsers, createUser, updateUser, deleteUser, getRoles } = require('../controllers/userController');
const authenticateToken = require('../middleware/authMiddleware');

// Ensure only authenticated users can access these routes
// In a real app, you would also add a 'requireAdmin' middleware here
router.use(authenticateToken);

router.get('/', getAllUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.get('/roles', getRoles);

module.exports = router;
