import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import { useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { BrandingProvider } from './context/BrandingContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { FiscalPeriodProvider } from './context/FiscalPeriodContext';
import { BranchProvider } from './context/BranchContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DraftNotificationToast from './components/common/DraftNotificationToast';

// Product & Catalog Pages
import ProductsPage from './pages/ProductsPage';
import CategoryInsightsPage from './pages/CategoryInsightsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ProductCatalog from './pages/ProductCatalog';
import CategoryManagement from './pages/CategoryManagement';
import PurchaseOrders from './pages/PurchaseOrders';

// Sales & POS Pages
import SalesPage from './pages/SalesPage';
import SalesListPage from './pages/SalesListPage';
import SalesHistoryPage from './pages/SalesHistoryPage';
import SalesHistory from './pages/SalesHistory';
import SaleDetail from './pages/SaleDetail';
import PendingConfirmations from './pages/PendingConfirmations';
import CancelledSales from './pages/CancelledSales';
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

// Settings (unified hub — all sub-pages consolidated)
import Settings from './pages/Settings';

// Financial Reports
import FinancialReportsHub from './pages/reports/FinancialReportsHub';
import IncomeStatementPage from './pages/reports/IncomeStatementPage';
import BalanceSheetPage from './pages/reports/BalanceSheetPage';
import TrialBalancePage from './pages/reports/TrialBalancePage';
import CashFlowReportPage from './pages/reports/CashFlowReportPage';
import ARAgingReportPage from './pages/reports/ARAgingReportPage';
import APAgingReportPage from './pages/reports/APAgingReportPage';
import BranchPLReportPage from './pages/reports/BranchPLReportPage';
import ConsolidatedPLReportPage from './pages/reports/ConsolidatedPLReportPage';
import InventoryValuationReportPage from './pages/reports/InventoryValuationReportPage';
import SalesBookPage from './pages/reports/SalesBookPage';

// Administration
import RecycleBin from './pages/RecycleBin';

// Online Store
import OnlineOrdersPage from './pages/OnlineOrdersPage';
import OnlineOrderDetailPage from './pages/OnlineOrderDetailPage';
import StoreSettingsPage from './pages/StoreSettingsPage';
import WebsiteBuilderPage from './pages/WebsiteBuilderPage';
import ChangeRequestsPage from './pages/ChangeRequestsPage';

// Auth enhancements
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ChangePassword from './pages/ChangePassword';

// Accounting / GL
import ChartOfAccountsPage from './pages/ChartOfAccountsPage';
import JournalEntriesPage from './pages/JournalEntriesPage';
import BankReconciliationPage from './pages/BankReconciliationPage';
import CostCentersPage from './pages/CostCentersPage';
import FixedAssetsPage from './pages/FixedAssetsPage';

// AP / AR
import VendorsPage from './pages/VendorsPage';
import BillsPage from './pages/BillsPage';
import InvoicesPage from './pages/InvoicesPage';

// Payroll
import PayrollDashboardPage from './pages/PayrollDashboardPage';
import EmployeeSalariesPage from './pages/EmployeeSalariesPage';
import PayrollRunsPage from './pages/PayrollRunsPage';
import PayslipsPage from './pages/PayslipsPage';
import EmployeeLoansPage from './pages/EmployeeLoansPage';

// Tasks
import TasksPage from './pages/TasksPage';
import TaskDetailPage from './pages/TaskDetailPage';

// Notifications
import NotificationsPage from './pages/NotificationsPage';

// Additional pages
import CustomerDetailPage from './pages/CustomerDetailPage';
import BranchDetailPage from './pages/BranchDetailPage';
import BranchAnalyticsPage from './pages/BranchAnalyticsPage';
import ActivityLogsPage from './pages/ActivityLogsPage';
import PurgeManagementPage from './pages/PurgeManagementPage';
import ExpenseAnalyticsPage from './pages/ExpenseAnalyticsPage';

const ProtectedRoute = ({ children }) => {
    const { auth, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    if (!auth.accessToken) return <Navigate to="/login" />;
    return children;
};

const RoleProtectedRoute = ({ children, requiredPermission }) => {
    const { auth, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    if (!auth.accessToken) return <Navigate to="/login" />;

    const userPermissions = auth.user?.permissions || {};
    if (requiredPermission && !userPermissions[requiredPermission] && !userPermissions['admin']) {
        return <Navigate to="/" />;
    }
    return children;
};

function App() {
    return (
        <ThemeProvider>
            <BrandingProvider>
            <CurrencyProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    {/* Public auth routes */}
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />

                    <Route path="/" element={
                        <ProtectedRoute>
                            <BranchProvider>
                            <FiscalPeriodProvider>
                                <Layout />
                            </FiscalPeriodProvider>
                            </BranchProvider>
                        </ProtectedRoute>
                    }>
                        <Route index element={<Dashboard />} />

                        {/* POS & Sales */}
                        <Route path="pos" element={<POS />} />
                        <Route path="sales" element={<SalesListPage />} />
                        <Route path="sales/pending-confirmations" element={<SalesListPage defaultTab="pending" />} />
                        <Route path="sales/cancelled" element={<SalesListPage defaultTab="cancelled" />} />
                        <Route path="sales/:id" element={<SaleDetail />} />
                        <Route path="sales-history" element={<SalesHistoryPage />} />
                        <Route path="sales-legacy" element={<SalesPage />} />

                        {/* Products & Catalog */}
                        <Route path="products" element={<ProductsPage />} />
                        <Route path="products/category-insights" element={<CategoryInsightsPage />} />
                        <Route path="products/:id" element={<ProductDetailPage />} />
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

                        {/* Online Store */}
                        <Route path="online-orders" element={<OnlineOrdersPage />} />
                        <Route path="online-orders/:id" element={<OnlineOrderDetailPage />} />
                        <Route path="store-settings" element={<StoreSettingsPage />} />
                        <Route path="app-builder" element={<WebsiteBuilderPage />} />
                        <Route path="change-requests" element={<ChangeRequestsPage />} />

                        {/* Analytics */}
                        <Route path="analytics/sales" element={<SalesAnalytics />} />
                        <Route path="analytics/inventory" element={<InventoryAnalytics />} />
                        <Route path="analytics/customers" element={<CustomerAnalytics />} />
                        <Route path="analytics/expenses" element={<ExpenseAnalyticsPage />} />

                        {/* Users & Branches (Admin) */}
                        <Route path="users" element={
                            <RoleProtectedRoute requiredPermission="manage_users">
                                <UsersPage />
                            </RoleProtectedRoute>
                        } />
                        <Route path="branches" element={
                            <RoleProtectedRoute requiredPermission="manage_branches">
                                <BranchesPage />
                            </RoleProtectedRoute>
                        } />
                        <Route path="branches/:id" element={<BranchDetailPage />} />
                        <Route path="branches/:id/analytics" element={<BranchAnalyticsPage />} />

                        {/* Customers & Suppliers */}
                        <Route path="customers" element={<CustomersPage />} />
                        <Route path="customers/:id" element={<CustomerDetailPage />} />
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

                        {/* Accounting / GL */}
                        <Route path="accounting/chart-of-accounts" element={<ChartOfAccountsPage />} />
                        <Route path="accounting/journal-entries" element={<JournalEntriesPage />} />
                        <Route path="accounting/bank-reconciliation" element={<BankReconciliationPage />} />
                        <Route path="accounting/cost-centers" element={<CostCentersPage />} />
                        <Route path="accounting/fixed-assets" element={<FixedAssetsPage />} />

                        {/* AP / AR */}
                        <Route path="vendors" element={<VendorsPage />} />
                        <Route path="bills" element={<BillsPage />} />
                        <Route path="invoices" element={<InvoicesPage />} />

                        {/* Payroll */}
                        <Route path="payroll" element={<PayrollDashboardPage />} />
                        <Route path="payroll/salaries" element={<EmployeeSalariesPage />} />
                        <Route path="payroll/runs" element={<PayrollRunsPage />} />
                        <Route path="payroll/payslips" element={<PayslipsPage />} />
                        <Route path="payroll/loans" element={<EmployeeLoansPage />} />

                        {/* Tasks */}
                        <Route path="tasks" element={<TasksPage />} />
                        <Route path="tasks/:id" element={<TaskDetailPage />} />

                        {/* Notifications */}
                        <Route path="notifications" element={<NotificationsPage />} />

                        {/* Account */}
                        <Route path="change-password" element={<ChangePassword />} />

                        {/* Settings (Admin) — unified hub */}
                        <Route path="settings" element={
                            <RoleProtectedRoute requiredPermission="manage_settings">
                                <Settings />
                            </RoleProtectedRoute>
                        } />
                        {/* Legacy setting routes → redirect to unified hub */}
                        <Route path="settings/branding"       element={<Navigate to="/settings" replace />} />
                        <Route path="settings/tax"            element={<Navigate to="/settings" replace />} />
                        <Route path="settings/fiscal-periods" element={<Navigate to="/settings" replace />} />
                        <Route path="settings/demo"           element={<Navigate to="/settings" replace />} />
                        <Route path="receipts/settings"       element={<Navigate to="/settings" replace />} />

                        {/* Financial Reports */}
                        <Route path="reports" element={<FinancialReportsHub />} />
                        <Route path="reports/income-statement" element={<IncomeStatementPage />} />
                        <Route path="reports/balance-sheet" element={<BalanceSheetPage />} />
                        <Route path="reports/trial-balance" element={<TrialBalancePage />} />
                        <Route path="reports/cash-flow" element={<CashFlowReportPage />} />
                        <Route path="reports/ar-aging" element={<ARAgingReportPage />} />
                        <Route path="reports/ap-aging" element={<APAgingReportPage />} />
                        <Route path="reports/branch-pl" element={<BranchPLReportPage />} />
                        <Route path="reports/consolidated-pl" element={<ConsolidatedPLReportPage />} />
                        <Route path="reports/inventory-valuation" element={<InventoryValuationReportPage />} />
                        <Route path="reports/sales-book" element={<SalesBookPage />} />

                        {/* Administration (Admin) */}
                        <Route path="recycle-bin" element={
                            <RoleProtectedRoute requiredPermission="manage_recycle_bin">
                                <RecycleBin />
                            </RoleProtectedRoute>
                        } />
                        <Route path="activity-logs" element={<ActivityLogsPage />} />
                        <Route path="purge-management" element={
                            <RoleProtectedRoute requiredPermission="manage_recycle_bin">
                                <PurgeManagementPage />
                            </RoleProtectedRoute>
                        } />
                    </Route>
                </Routes>
                <ToastContainer position="top-right" autoClose={3000} />
                <DraftNotificationToast />
            </CurrencyProvider>
            </BrandingProvider>
        </ThemeProvider>
    );
}

export default App;
