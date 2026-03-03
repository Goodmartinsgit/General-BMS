import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import api from '../api/axios';
import PeriodFilter from '../components/common/PeriodFilter';
import {
  ShoppingCart, Package, Users, DollarSign, TrendingUp,
  AlertTriangle, Box, Wallet, RefreshCw
} from 'lucide-react';

// Dashboard Components
import KPICard from '../components/dashboard/KPICard';
import SalesTrendChart from '../components/dashboard/SalesTrendChart';
import RevenuePieChart from '../components/dashboard/RevenuePieChart';
import TopProductsChart from '../components/dashboard/TopProductsChart';
import QuickActions from '../components/dashboard/QuickActions';
import ActivityFeed from '../components/dashboard/ActivityFeed';

const formatNumber = (n) => {
  if (n == null) return '0';
  return Number(n).toLocaleString();
};

const formatPercentage = (n) => {
  if (n == null) return '0%';
  return `${Number(n).toFixed(1)}%`;
};

const Dashboard = () => {
  const { auth } = useAuth();
  const user = auth?.user;
  const { formatCurrency } = useCurrency();

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [dateRangeReady, setDateRangeReady] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (dateRange?.start_date) params.start_date = dateRange.start_date;
      if (dateRange?.end_date) params.end_date = dateRange.end_date;

      const response = await api.get('/dashboard/stats', { params });

      if (response.data?.success) {
        setDashboardData(response.data.data.dashboard || {});
      } else {
        setError('Failed to load dashboard data.');
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Failed to load dashboard data. Please refresh.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, dateRange?.start_date, dateRange?.end_date]);

  // Fetch when user is available and PeriodFilter has provided the initial range
  useEffect(() => {
    if (user?.id && dateRangeReady) {
      fetchDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchDashboardData, user?.id, dateRangeReady]);

  const handlePeriodChange = useCallback((range) => {
    setDateRange(range);
    setDateRangeReady(true);
  }, []);

  const roleName = (user?.role_name || user?.role || '').toLowerCase().replace(/\s+/g, '_');
  const isStaff = ['staff', 'branch_staff'].includes(roleName);

  const getRoleDisplay = (role) => {
    const map = {
      super_admin: 'Super Administrator',
      admin: 'Administrator',
      staff: 'Staff Member',
      branch_staff: 'Branch Staff',
      branch_admin: 'Branch Admin',
    };
    return map[role] || role;
  };

  const getRoleBadgeColor = (role) => {
    const map = {
      super_admin: 'bg-accent-gold text-black',
      admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      staff: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      branch_staff: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
      branch_admin: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    };
    return map[role] || 'bg-gray-100 text-gray-800';
  };

  // ─────────────────────────── ADMIN DASHBOARD ───────────────────────────
  const renderAdminDashboard = () => {
    const { overview, charts } = dashboardData || {};
    const { sales, customers, inventory, financial_health } = overview || {};

    return (
      <>
        {/* Primary KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
          <KPICard
            title="Total Revenue"
            value={formatCurrency(sales?.total_revenue || 0)}
            change={`Today: ${formatCurrency(sales?.today?.revenue || 0)}`}
            changeType="neutral"
            icon={DollarSign}
            iconColor="bg-accent-gold"
            loading={loading}
            error={error}
          />
          <KPICard
            title="Total Sales"
            value={formatNumber(sales?.total_sales_count || 0)}
            change={`Today: ${sales?.today?.sales_count || 0}`}
            changeType="neutral"
            icon={ShoppingCart}
            iconColor="bg-blue-500"
            loading={loading}
            error={error}
          />
          <KPICard
            title="Total Customers"
            value={formatNumber(customers?.total_customers || 0)}
            change={`New: ${customers?.new_customers_30_days || 0}`}
            changeType="positive"
            icon={Users}
            iconColor="bg-purple-500"
            loading={loading}
            error={error}
          />
          <KPICard
            title="Net Profit"
            value={formatCurrency(financial_health?.net_profit || 0)}
            change={formatPercentage(financial_health?.profit_margin || 0)}
            changeType={financial_health?.net_profit >= 0 ? 'positive' : 'negative'}
            valueColorType={financial_health?.net_profit >= 0 ? 'positive' : 'negative'}
            icon={TrendingUp}
            iconColor={financial_health?.net_profit >= 0 ? 'bg-green-500' : 'bg-red-500'}
            loading={loading}
            error={error}
          />
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
          <KPICard
            title="Inventory Value"
            value={formatCurrency(inventory?.total_inventory_value || 0)}
            change={`${inventory?.total_products || 0} Products`}
            changeType="neutral"
            icon={Box}
            iconColor="bg-indigo-500"
            loading={loading}
            error={error}
          />
          <KPICard
            title="Low Stock Items"
            value={formatNumber(inventory?.low_stock_count || 0)}
            change={inventory?.low_stock_count > 0 ? 'Action Required' : 'All stocked'}
            changeType={inventory?.low_stock_count > 0 ? 'negative' : 'neutral'}
            icon={AlertTriangle}
            iconColor={inventory?.low_stock_count > 0 ? 'bg-orange-500' : 'bg-gray-400'}
            loading={loading}
            error={error}
          />
          <KPICard
            title="Gross Profit"
            value={formatCurrency(financial_health?.gross_profit || 0)}
            change={`Margin: ${
              financial_health?.gross_profit && sales?.total_revenue
                ? ((financial_health.gross_profit / sales.total_revenue) * 100).toFixed(1)
                : 0
            }%`}
            changeType="neutral"
            icon={TrendingUp}
            iconColor="bg-emerald-500"
            loading={loading}
            error={error}
          />
          <KPICard
            title="Total Expenses"
            value={formatCurrency(financial_health?.total_expenses || 0)}
            change="Current month"
            changeType="negative"
            icon={Wallet}
            iconColor="bg-orange-500"
            loading={loading}
            error={error}
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
          <SalesTrendChart data={charts?.sales_trend || []} loading={loading} />
          <RevenuePieChart data={charts?.revenue_by_category || []} loading={loading} />
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
          <TopProductsChart data={charts?.top_products || []} loading={loading} />
          <ActivityFeed />
        </div>

        {/* Quick Actions */}
        <QuickActions />
      </>
    );
  };

  // ─────────────────────────── STAFF DASHBOARD ───────────────────────────
  const renderStaffDashboard = () => {
    const { personal_stats, recent_sales } = dashboardData || {};
    const salesList = Array.isArray(recent_sales) ? recent_sales : [];

    return (
      <>
        {/* Personal KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
          <KPICard
            title="My Total Sales"
            value={formatNumber(personal_stats?.my_sales_count || 0)}
            change={`Today: ${personal_stats?.today_sales || 0}`}
            changeType="neutral"
            icon={ShoppingCart}
            iconColor="bg-blue-500"
            loading={loading}
            error={error}
          />
          <KPICard
            title="Items Sold"
            value={formatNumber(personal_stats?.items_sold || 0)}
            change="Total units"
            changeType="neutral"
            icon={Package}
            iconColor="bg-purple-500"
            loading={loading}
            error={error}
          />
          <KPICard
            title="Customers Served"
            value={formatNumber(personal_stats?.customers_served || 0)}
            change="Unique customers"
            changeType="neutral"
            icon={Users}
            iconColor="bg-green-500"
            loading={loading}
            error={error}
          />
        </div>

        {/* Recent Sales Table */}
        <div className="bg-theme-secondary rounded-lg shadow-theme-md p-4 md:p-6 mb-6 border border-theme">
          <h3 className="text-base md:text-lg font-semibold text-theme-primary mb-4">My Recent Sales</h3>
          {salesList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-theme">
                <thead className="bg-theme-tertiary">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Receipt #</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Items</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Payment</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-theme-secondary divide-y divide-theme">
                  {salesList.map((sale) => (
                    <tr key={sale.id} className="hover:bg-theme-tertiary transition">
                      <td className="px-4 py-3 text-sm font-medium text-accent-gold">{sale.receipt_number}</td>
                      <td className="px-4 py-3 text-sm text-theme-secondary">
                        {new Date(sale.sale_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-theme-primary">{sale.customer_name || 'Walk-in'}</td>
                      <td className="px-4 py-3 text-sm text-theme-primary">{sale.item_count || '-'}</td>
                      <td className="px-4 py-3 text-sm text-theme-secondary capitalize">{sale.payment_method}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          sale.payment_status === 'paid'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : sale.payment_status === 'partial'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                          {sale.payment_status || 'Paid'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-theme-muted text-center py-8">No sales recorded yet</p>
          )}
        </div>

        {/* Activity + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
          <ActivityFeed />
          <QuickActions />
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-theme-secondary shadow-theme-sm mb-4 border-b border-theme">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-theme-primary">Dashboard</h1>
              <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-theme-secondary">
                Welcome back, {user?.full_name}!
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <PeriodFilter storageKey="dashboard" onChange={handlePeriodChange} />
              <button
                onClick={fetchDashboardData}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm text-theme-secondary bg-theme-tertiary border border-theme rounded-lg hover:bg-theme-secondary transition"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-8">
        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-400 dark:border-red-800 p-4 mb-6 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Render based on role */}
        {isStaff ? renderStaffDashboard() : renderAdminDashboard()}
      </div>
    </div>
  );
};

export default Dashboard;
