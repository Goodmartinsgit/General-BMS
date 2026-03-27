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
                        <Route path="pos" element={
                            <RoleProtectedRoute requiredPermission="access_pos">
                                <POS />
                            </RoleProtectedRoute>
                        } />
                        <Route path="sales" element={
                            <RoleProtectedRoute requiredPermission="view_sales">
                                <SalesListPage />
                            </RoleProtectedRoute>
                        } />
                        <Route path="sales/pending-confirmations" element={
                            <RoleProtectedRoute requiredPermission="view_sales">
                                <SalesListPage defaultTab="pending" />
                            </RoleProtectedRoute>
                        } />
                        <Route path="sales/cancelled" element={
                            <RoleProtectedRoute requiredPermission="view_sales">
                                <SalesListPage defaultTab="cancelled" />
                            </RoleProtectedRoute>
                        } />
                        <Route path="sales/:id" element={
                            <RoleProtectedRoute requiredPermission="view_sales">
                                <SaleDetail />
                            </RoleProtectedRoute>
                        } />
                        <Route path="sales-history" element={
                            <RoleProtectedRoute requiredPermission="view_sales">
                                <SalesHistoryPage />
                            </RoleProtectedRoute>
                        } />
                        <Route path="sales-legacy" element={
                            <RoleProtectedRoute requiredPermission="view_sales">
                                <SalesPage />
                            </RoleProtectedRoute>
                        } />

                        {/* Products & Catalog */}
                        <Route path="products" element={
                            <RoleProtectedRoute requiredPermission="view_products">
                                <ProductsPage />
                            </RoleProtectedRoute>
                        } />
                        <Route path="products/category-insights" element={
                            <RoleProtectedRoute requiredPermission="view_products">
                                <CategoryInsightsPage />
                            </RoleProtectedRoute>
                        } />
                        <Route path="products/:id" element={
                            <RoleProtectedRoute requiredPermission="view_products">
                                <ProductDetailPage />
                            </RoleProtectedRoute>
                        } />
                        <Route path="product-catalog" element={
                            <RoleProtectedRoute requiredPermission="view_products">
                                <ProductCatalog />
                            </RoleProtectedRoute>
                        } />
                        <Route path="categories" element={
                            <RoleProtectedRoute requiredPermission="view_products">
                                <CategoryManagement />
                            </RoleProtectedRoute>
                        } />
                        <Route path="purchase-orders" element={
                            <RoleProtectedRoute requiredPermission="view_purchase_orders">
                                <PurchaseOrders />
                            </RoleProtectedRoute>
                        } />

                        {/* Returns & Exchanges */}
                        <Route path="returns" element={
                            <RoleProtectedRoute requiredPermission="view_returns">
                                <Returns />
                            </RoleProtectedRoute>
                        } />

                        {/* Stock Management */}
                        <Route path="inventory" element={
                            <RoleProtectedRoute requiredPermission="view_inventory">
                                <InventoryPage />
                            </RoleProtectedRoute>
                        } />
                        <Route path="inventory/movements" element={
                            <RoleProtectedRoute requiredPermission="view_inventory">
                                <StockMovementsPage />
                            </RoleProtectedRoute>
                        } />
                        <Route path="stock-transfers" element={
                            <RoleProtectedRoute requiredPermission="view_stock">
                                <StockTransfers />
                            </RoleProtectedRoute>
                        } />
                        <Route path="stock-damages" element={
                            <RoleProtectedRoute requiredPermission="view_stock">
                                <StockDamages />
                            </RoleProtectedRoute>
                        } />
                        <Route path="stock-activity" element={
                            <RoleProtectedRoute requiredPermission="view_stock">
                                <StockActivity />
                            </RoleProtectedRoute>
                        } />

                        {/* Promotions */}
                        <Route path="promotions" element={
                            <RoleProtectedRoute requiredPermission="view_promotions">
                                <PromotionsPage />
                            </RoleProtectedRoute>
                        } />

                        {/* Online Store */}
                        <Route path="online-orders" element={
                            <RoleProtectedRoute requiredPermission="view_online_orders">
                                <OnlineOrdersPage />
                            </RoleProtectedRoute>
                        } />
                        <Route path="online-orders/:id" element={
                            <RoleProtectedRoute requiredPermission="view_online_orders">
                                <OnlineOrderDetailPage />
                            </RoleProtectedRoute>
                        } />
                        <Route path="store-settings" element={
                            <RoleProtectedRoute requiredPermission="manage_online_store">
                                <StoreSettingsPage />
                            </RoleProtectedRoute>
                        } />
                        <Route path="app-builder" element={
                            <RoleProtectedRoute requiredPermission="manage_online_store">
                                <WebsiteBuilderPage />
                            </RoleProtectedRoute>
                        } />
                        <Route path="change-requests" element={
                            <RoleProtectedRoute requiredPermission="manage_online_orders">
                                <ChangeRequestsPage />
                            </RoleProtectedRoute>
                        } />

                        {/* Analytics */}
                        <Route path="analytics/sales" element={
                            <RoleProtectedRoute requiredPermission="view_analytics">
                                <SalesAnalytics />
                            </RoleProtectedRoute>
                        } />
                        <Route path="analytics/inventory" element={
                            <RoleProtectedRoute requiredPermission="view_analytics">
                                <InventoryAnalytics />
                            </RoleProtectedRoute>
                        } />
                        <Route path="analytics/customers" element={
                            <RoleProtectedRoute requiredPermission="view_analytics">
                                <CustomerAnalytics />
                            </RoleProtectedRoute>
                        } />
                        <Route path="analytics/expenses" element={
                            <RoleProtectedRoute requiredPermission="view_analytics">
                                <ExpenseAnalyticsPage />
                            </RoleProtectedRoute>
                        } />

                        {/* Users & Branches (Admin) */}
                        <Route path="users" element={
                            <RoleProtectedRoute requiredPermission="view_users">
                                <UsersPage />
                            </RoleProtectedRoute>
                        } />
                        <Route path="branches" element={
                            <RoleProtectedRoute requiredPermission="view_branches">
                                <BranchesPage />
                            </RoleProtectedRoute>
                        } />
                        <Route path="branches/:id" element={
                            <RoleProtectedRoute requiredPermission="view_branches">
                                <BranchDetailPage />
                            </RoleProtectedRoute>
                        } />
                        <Route path="branches/:id/analytics" element={
                            <RoleProtectedRoute requiredPermission="view_analytics">
                                <BranchAnalyticsPage />
                            </RoleProtectedRoute>
                        } />

                        {/* Customers & Suppliers */}
                        <Route path="customers" element={
                            <RoleProtectedRoute requiredPermission="view_customers">
                                <CustomersPage />
                            </RoleProtectedRoute>
                        } />
                        <Route path="customers/:id" element={
                            <RoleProtectedRoute requiredPermission="view_customers">
                                <CustomerDetailPage />
                            </RoleProtectedRoute>
                        } />
                        <Route path="suppliers" element={
                            <RoleProtectedRoute requiredPermission="view_suppliers">
                                <SuppliersPage />
                            </RoleProtectedRoute>
                        } />
                        <Route path="referrers" element={
                            <RoleProtectedRoute requiredPermission="view_referrers">
                                <ReferrersPage />
                            </RoleProtectedRoute>
                        } />

                        {/* Finance & Payments */}
                        <Route path="price-tiers" element={
                            <RoleProtectedRoute requiredPermission="view_price_tiers">
                                <PriceTiersPage />
                            </RoleProtectedRoute>
                        } />
                        <Route path="wholesale-orders" element={
                            <RoleProtectedRoute requiredPermission="view_wholesale_orders">
                                <WholesaleOrdersPage />
                            </RoleProtectedRoute>
                        } />
                        <Route path="expenses" element={
                            <RoleProtectedRoute requiredPermission="view_expenses">
                                <ExpensesPage />
                            </RoleProtectedRoute>
                        } />
                        <Route path="budgets" element={
                            <RoleProtectedRoute requiredPermission="view_budgets">
                                <BudgetsPage />
                            </RoleProtectedRoute>
                        } />
                        <Route path="payments" element={
                            <RoleProtectedRoute requiredPermission="view_payments">
                                <PaymentsPage />
                            </RoleProtectedRoute>
                        } />
                        <Route path="bank-channels" element={
                            <RoleProtectedRoute requiredPermission="view_banks">
                                <BankChannelsPage />
                            </RoleProtectedRoute>
                        } />
                        <Route path="cash-flow" element={
                            <RoleProtectedRoute requiredPermission="view_payments">
                                <CashFlowPage />
                            </RoleProtectedRoute>
                        } />

                        {/* Performance Tasks */}
                        <Route path="performance-tasks" element={
                            <RoleProtectedRoute requiredPermission="view_performance_tasks">
                                <PerformanceTasksPage />
                            </RoleProtectedRoute>
                        } />
                        <Route path="performance-tasks/:id" element={
                            <RoleProtectedRoute requiredPermission="view_performance_tasks">
                                <PerformanceTaskDetailPage />
                            </RoleProtectedRoute>
                        } />

                        {/* Quotations */}
                        <Route path="quotations" element={
                            <RoleProtectedRoute requiredPermission="view_quotations">
                                <QuotationsDashboard />
                            </RoleProtectedRoute>
                        } />
                        <Route path="quotations/:id" element={
                            <RoleProtectedRoute requiredPermission="view_quotations">
                                <QuotationDetailPage />
                            </RoleProtectedRoute>
                        } />

                        {/* Accounting / GL */}
                        <Route path="accounting/chart-of-accounts" element={
                            <RoleProtectedRoute requiredPermission="view_accounting">
                                <ChartOfAccountsPage />
                            </RoleProtectedRoute>
                        } />
                        <Route path="accounting/journal-entries" element={
                            <RoleProtectedRoute requiredPermission="view_accounting">
                                <JournalEntriesPage />
                            </RoleProtectedRoute>
                        } />
                        <Route path="accounting/bank-reconciliation" element={
                            <RoleProtectedRoute requiredPermission="view_accounting">
                                <BankReconciliationPage />
                            </RoleProtectedRoute>
                        } />
                        <Route path="accounting/cost-centers" element={
                            <RoleProtectedRoute requiredPermission="view_accounting">
                                <CostCentersPage />
                            </RoleProtectedRoute>
                        } />
                        <Route path="accounting/fixed-assets" element={
                            <RoleProtectedRoute requiredPermission="view_accounting">
                                <FixedAssetsPage />
                            </RoleProtectedRoute>
                        } />

                        {/* AP / AR */}
                        <Route path="vendors" element={
                            <RoleProtectedRoute requiredPermission="view_vendors">
                                <VendorsPage />
                            </RoleProtectedRoute>
                        } />
                        <Route path="bills" element={
                            <RoleProtectedRoute requiredPermission="view_bills">
                                <BillsPage />
                            </RoleProtectedRoute>
                        } />
                        <Route path="invoices" element={
                            <RoleProtectedRoute requiredPermission="view_invoices">
                                <InvoicesPage />
                            </RoleProtectedRoute>
                        } />

                        {/* Payroll */}
                        <Route path="payroll" element={
                            <RoleProtectedRoute requiredPermission="manage_payroll">
                                <PayrollDashboardPage />
                            </RoleProtectedRoute>
                        } />
                        <Route path="payroll/salaries" element={
                            <RoleProtectedRoute requiredPermission="manage_payroll">
                                <EmployeeSalariesPage />
                            </RoleProtectedRoute>
                        } />
                        <Route path="payroll/runs" element={
                            <RoleProtectedRoute requiredPermission="manage_payroll">
                                <PayrollRunsPage />
                            </RoleProtectedRoute>
                        } />
                        <Route path="payroll/payslips" element={
                            <RoleProtectedRoute requiredPermission="manage_payroll">
                                <PayslipsPage />
                            </RoleProtectedRoute>
                        } />
                        <Route path="payroll/loans" element={
                            <RoleProtectedRoute requiredPermission="manage_payroll">
                                <EmployeeLoansPage />
                            </RoleProtectedRoute>
                        } />

                        {/* Tasks */}
                        <Route path="tasks" element={
                            <RoleProtectedRoute requiredPermission="view_tasks">
                                <TasksPage />
                            </RoleProtectedRoute>
                        } />
                        <Route path="tasks/:id" element={
                            <RoleProtectedRoute requiredPermission="view_tasks">
                                <TaskDetailPage />
                            </RoleProtectedRoute>
                        } />

                        {/* Notifications — accessible to all authenticated users */}
                        <Route path="notifications" element={<NotificationsPage />} />

                        {/* Account — accessible to all authenticated users */}
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
                        <Route path="reports" element={
                            <RoleProtectedRoute requiredPermission="view_reports">
                                <FinancialReportsHub />
                            </RoleProtectedRoute>
                        } />
                        <Route path="reports/income-statement" element={
                            <RoleProtectedRoute requiredPermission="view_reports">
                                <IncomeStatementPage />
                            </RoleProtectedRoute>
                        } />
                        <Route path="reports/balance-sheet" element={
                            <RoleProtectedRoute requiredPermission="view_reports">
                                <BalanceSheetPage />
                            </RoleProtectedRoute>
                        } />
                        <Route path="reports/trial-balance" element={
                            <RoleProtectedRoute requiredPermission="view_reports">
                                <TrialBalancePage />
                            </RoleProtectedRoute>
                        } />
                        <Route path="reports/cash-flow" element={
                            <RoleProtectedRoute requiredPermission="view_reports">
                                <CashFlowReportPage />
                            </RoleProtectedRoute>
                        } />
                        <Route path="reports/ar-aging" element={
                            <RoleProtectedRoute requiredPermission="view_reports">
                                <ARAgingReportPage />
                            </RoleProtectedRoute>
                        } />
                        <Route path="reports/ap-aging" element={
                            <RoleProtectedRoute requiredPermission="view_reports">
                                <APAgingReportPage />
                            </RoleProtectedRoute>
                        } />
                        <Route path="reports/branch-pl" element={
                            <RoleProtectedRoute requiredPermission="view_reports">
                                <BranchPLReportPage />
                            </RoleProtectedRoute>
                        } />
                        <Route path="reports/consolidated-pl" element={
                            <RoleProtectedRoute requiredPermission="view_reports">
                                <ConsolidatedPLReportPage />
                            </RoleProtectedRoute>
                        } />
                        <Route path="reports/inventory-valuation" element={
                            <RoleProtectedRoute requiredPermission="view_reports">
                                <InventoryValuationReportPage />
                            </RoleProtectedRoute>
                        } />
                        <Route path="reports/sales-book" element={
                            <RoleProtectedRoute requiredPermission="view_reports">
                                <SalesBookPage />
                            </RoleProtectedRoute>
                        } />

                        {/* Administration (Admin) */}
                        <Route path="recycle-bin" element={
                            <RoleProtectedRoute requiredPermission="view_recycle_bin">
                                <RecycleBin />
                            </RoleProtectedRoute>
                        } />
                        <Route path="activity-logs" element={
                            <RoleProtectedRoute requiredPermission="view_audit_logs">
                                <ActivityLogsPage />
                            </RoleProtectedRoute>
                        } />
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
