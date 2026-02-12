const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const branchRoutes = require('./routes/branchRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const customerRoutes = require('./routes/customerRoutes');
const priceTierRoutes = require('./routes/priceTierRoutes');
const salesRoutes = require('./routes/salesRoutes');
const wholesaleOrderRoutes = require('./routes/wholesaleOrderRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const reportRoutes = require('./routes/reportRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const referrerRoutes = require('./routes/referrerRoutes');
const bankRoutes = require('./routes/bankRoutes');
const performanceTaskRoutes = require('./routes/retailPerformanceTaskRoutes');
const quotationRoutes = require('./routes/quotationRoutes');



const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/price-tiers', priceTierRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/wholesale-orders', wholesaleOrderRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/referrers', referrerRoutes);
app.use('/api/banks', bankRoutes);
app.use('/api/retail-performance-tasks', performanceTaskRoutes);
app.use('/api/quotations', quotationRoutes);




// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

module.exports = app;
