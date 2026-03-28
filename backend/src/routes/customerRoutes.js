const express = require('express');
const router = express.Router();
const { getAllCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer } = require('../controllers/customerController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

router.use(authenticateToken);

router.get('/', authorize('view_customers'), getAllCustomers);
router.get('/:id', authorize('view_customers'), getCustomerById);
router.post('/', authorize('create_customers'), createCustomer);
router.put('/:id', authorize('update_customers'), updateCustomer);
router.delete('/:id', authorize('delete_customers'), deleteCustomer);

module.exports = router;
