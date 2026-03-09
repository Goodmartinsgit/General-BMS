const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { globalLimiter, authLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
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
const expenseCategoryRoutes = require('./routes/expenseCategoryRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const reportRoutes = require('./routes/reportRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const referrerRoutes = require('./routes/referrerRoutes');
const bankRoutes = require('./routes/bankRoutes');
const performanceTaskRoutes = require('./routes/retailPerformanceTaskRoutes');
const quotationRoutes = require('./routes/quotationRoutes');
const receiptRoutes = require('./routes/receiptRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const purchaseOrderRoutes = require('./routes/purchaseOrderRoutes');
const variantRoutes = require('./routes/variantRoutes');
const stockRoutes = require('./routes/stockRoutes');
const serialTrackingRoutes = require('./routes/serialTrackingRoutes');
const returnsRoutes = require('./routes/returnsRoutes');
const recycleBinRoutes = require('./routes/recycleBinRoutes');
const promotionRoutes = require('./routes/promotionRoutes');
const branchAnalyticsRoutes = require('./routes/branchAnalyticsRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const fiscalPeriodRoutes = require('./routes/fiscalPeriodRoutes');
const taxSettingsRoutes = require('./routes/taxSettingsRoutes');
const brandingRoutes = require('./routes/brandingRoutes');
const demoRoutes = require('./routes/demoRoutes');
const financialReportsRoutes = require('./routes/financialReportsRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

// New feature routes
const glRoutes = require('./routes/glRoutes');
const bankReconciliationRoutes = require('./routes/bankReconciliationRoutes');
const costCenterRoutes = require('./routes/costCenterRoutes');
const fixedAssetRoutes = require('./routes/fixedAssetRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const billRoutes = require('./routes/billRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const taskRoutes = require('./routes/taskRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Website Builder (admin-only)
const websiteBuilderRoutes = require('./routes/websiteBuilderRoutes');

// Online Store (storefront-facing + admin)
const storeConfigRoutes = require('./routes/storeConfigRoutes');
const storeAdminConfigRoutes = require('./routes/storeAdminConfigRoutes');
const storeCatalogRoutes = require('./routes/storeCatalogRoutes');
const storePublicRoutes = require('./routes/storePublicRoutes');
const storeCustomerRoutes = require('./routes/storeCustomerRoutes');
const storeCartRoutes = require('./routes/storeCartRoutes');
const storeCheckoutRoutes = require('./routes/storeCheckoutRoutes');
const storeOrderRoutes = require('./routes/storeOrderRoutes');
const onlineOrderRoutes = require('./routes/onlineOrderRoutes');

const app = express();

// Trust first proxy (Render, Railway, etc.) so express-rate-limit
// and req.ip work correctly behind a reverse proxy.
app.set('trust proxy', 1);

// Middleware
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:5173', 'http://localhost:3006'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Slug', 'X-Session-Id']
};
app.use(cors(corsOptions));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com"],
      connectSrc: ["'self'", ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) : ['http://localhost:5173'])],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  }
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(globalLimiter);

// ─── Paystack webhook — must be raw body BEFORE express.json() ──────────────
app.use('/api/store/webhooks/paystack', express.raw({ type: 'application/json' }), require('./routes/storeWebhookRoutes'));

app.use(express.json());
app.use(cookieParser());

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
app.use('/api/expense-categories', expenseCategoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/referrers', referrerRoutes);
app.use('/api/banks', bankRoutes);
app.use('/api/retail-performance-tasks', performanceTaskRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/variants', variantRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/serial-tracking', serialTrackingRoutes);
app.use('/api/returns', returnsRoutes);
app.use('/api/recycle-bin', recycleBinRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/branch-analytics', branchAnalyticsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/fiscal-periods', fiscalPeriodRoutes);
app.use('/api/tax-settings', taxSettingsRoutes);
app.use('/api/branding', brandingRoutes);
app.use('/api/demo', demoRoutes);
app.use('/api/financial-reports', financialReportsRoutes);
app.use('/api/upload', uploadRoutes);

// New feature routes
app.use('/api/gl', glRoutes);
app.use('/api/bank-reconciliations', bankReconciliationRoutes);
app.use('/api/cost-centers', costCenterRoutes);
app.use('/api/fixed-assets', fixedAssetRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ─── Online Store — Storefront-facing (public + customer JWT) ───────────────
app.use('/api/store', storeConfigRoutes);           // GET /api/store/config/:slug etc.
app.use('/api/store', storePublicRoutes);            // GET /api/store/track-order
app.use('/api/store/cart', storeCartRoutes);         // must be before /:slug to avoid conflict
app.use('/api/store/:slug', storeCatalogRoutes);    // /products, /categories, /bank-channels
app.use('/api/store/:slug/customers', storeCustomerRoutes);
app.use('/api/store/:slug/checkout', storeCheckoutRoutes);
app.use('/api/store/:slug/orders', storeOrderRoutes);

// ─── Online Store — Admin-facing (staff JWT) ────────────────────────────────
app.use('/api/store-config', storeAdminConfigRoutes);
app.use('/api/online-orders', onlineOrderRoutes);

// ─── Website Builder — Admin-facing ─────────────────────────────────────────
app.use('/api/website-builder', websiteBuilderRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Centralized error handler (must be last middleware)
app.use(errorHandler);

module.exports = app;

