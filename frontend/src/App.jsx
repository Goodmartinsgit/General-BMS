import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import { useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Product & Catalog Pages
import ProductsPage from './pages/ProductsPage';
import ProductCatalog from './pages/ProductCatalog';
import CategoryManagement from './pages/CategoryManagement';
import PurchaseOrders from './pages/PurchaseOrders';

// Sales & POS Pages
import SalesPage from './pages/SalesPage';
import SalesHistoryPage from './pages/SalesHistoryPage';
import SalesHistory from './pages/SalesHistory';
import SaleDetail from './pages/SaleDetail';
import POS from './pages/POS';

// Returns & Stock Pages
import Returns from './pages/Returns';
import StockTransfers from './pages/StockTransfers';
import StockDamages from './pages/StockDamages';
import StockActivity from './pages/StockActivity';

// Promotions
import PromotionsPage from './pages/PromotionsPage';

// Analytics
import SalesAnalytics from './pages/SalesAnalytics';
import InventoryAnalytics from './pages/InventoryAnalytics';
import CustomerAnalytics from './pages/CustomerAnalytics';

// Users & Branches
import UsersPage from './pages/UsersPage';
import BranchesPage from './pages/BranchesPage';

// Inventory & Stock
import InventoryPage from './pages/InventoryPage';
import StockMovementsPage from './pages/StockMovementsPage';

// Customers & Suppliers
import CustomersPage from './pages/CustomersPage';
import SuppliersPage from './pages/SuppliersPage';
import ReferrersPage from './pages/ReferrersPage';

// Finance & Payments
import PriceTiersPage from './pages/PriceTiersPage';
import WholesaleOrdersPage from './pages/WholesaleOrdersPage';
import ExpensesPage from './pages/ExpensesPage';
import BudgetsPage from './pages/BudgetsPage';
import PaymentsPage from './pages/PaymentsPage';
import BankChannelsPage from './pages/BankChannelsPage';
import CashFlowPage from './pages/CashFlowPage';

// Performance Tasks
import PerformanceTasksPage from './pages/PerformanceTasksPage';
import PerformanceTaskDetailPage from './pages/PerformanceTaskDetailPage';

// Quotations
import QuotationsDashboard from './pages/QuotationsDashboard';
import QuotationDetailPage from './pages/QuotationDetailPage';

// Settings
import Settings from './pages/Settings';

// Administration
import RecycleBin from './pages/RecycleBin';

const ProtectedRoute = ({ children }) => {
    const { auth, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    if (!auth.accessToken) return <Navigate to="/login" />;
    return children;
};

function App() {
    return (
        <ThemeProvider>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                }>
                    <Route index element={<Dashboard />} />

                    {/* POS & Sales */}
                    <Route path="pos" element={<POS />} />
                    <Route path="sales" element={<SalesHistory />} />
                    <Route path="sales/:id" element={<SaleDetail />} />
                    <Route path="sales-history" element={<SalesHistoryPage />} />
                    <Route path="sales-legacy" element={<SalesPage />} />

                    {/* Products & Catalog */}
                    <Route path="products" element={<ProductsPage />} />
                    <Route path="product-catalog" element={<ProductCatalog />} />
                    <Route path="categories" element={<CategoryManagement />} />
                    <Route path="purchase-orders" element={<PurchaseOrders />} />

                    {/* Returns & Exchanges */}
                    <Route path="returns" element={<Returns />} />

                    {/* Stock Management */}
                    <Route path="inventory" element={<InventoryPage />} />
                    <Route path="inventory/movements" element={<StockMovementsPage />} />
                    <Route path="stock-transfers" element={<StockTransfers />} />
                    <Route path="stock-damages" element={<StockDamages />} />
                    <Route path="stock-activity" element={<StockActivity />} />

                    {/* Promotions */}
                    <Route path="promotions" element={<PromotionsPage />} />

                    {/* Analytics */}
                    <Route path="analytics/sales" element={<SalesAnalytics />} />
                    <Route path="analytics/inventory" element={<InventoryAnalytics />} />
                    <Route path="analytics/customers" element={<CustomerAnalytics />} />

                    {/* Users & Branches */}
                    <Route path="users" element={<UsersPage />} />
                    <Route path="branches" element={<BranchesPage />} />

                    {/* Customers & Suppliers */}
                    <Route path="customers" element={<CustomersPage />} />
                    <Route path="suppliers" element={<SuppliersPage />} />
                    <Route path="referrers" element={<ReferrersPage />} />

                    {/* Finance & Payments */}
                    <Route path="price-tiers" element={<PriceTiersPage />} />
                    <Route path="wholesale-orders" element={<WholesaleOrdersPage />} />
                    <Route path="expenses" element={<ExpensesPage />} />
                    <Route path="budgets" element={<BudgetsPage />} />
                    <Route path="payments" element={<PaymentsPage />} />
                    <Route path="bank-channels" element={<BankChannelsPage />} />
                    <Route path="cash-flow" element={<CashFlowPage />} />

                    {/* Performance Tasks */}
                    <Route path="performance-tasks" element={<PerformanceTasksPage />} />
                    <Route path="performance-tasks/:id" element={<PerformanceTaskDetailPage />} />

                    {/* Quotations */}
                    <Route path="quotations" element={<QuotationsDashboard />} />
                    <Route path="quotations/:id" element={<QuotationDetailPage />} />

                    {/* Settings */}
                    <Route path="settings" element={<Settings />} />

                    {/* Administration */}
                    <Route path="recycle-bin" element={<RecycleBin />} />
                </Route>
            </Routes>
            <ToastContainer position="top-right" autoClose={3000} />
        </ThemeProvider>
    );
}

export default App;