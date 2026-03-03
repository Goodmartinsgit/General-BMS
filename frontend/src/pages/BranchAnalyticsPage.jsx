import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { branchesAPI } from '../api/branches';
import { useCurrency } from '../context/CurrencyContext';
import { toast } from 'react-toastify';
import {
  ArrowLeft, TrendingUp, TrendingDown, Package, Users,
  DollarSign, ShoppingCart, AlertTriangle, RefreshCw,
  Calendar, Loader2, BarChart3, Percent, Hash
} from 'lucide-react';

const BranchAnalyticsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();

  const [branchName, setBranchName] = useState('');
  const [dashboard, setDashboard] = useState(null);
  const [salesReport, setSalesReport] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Date range
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [groupBy, setGroupBy] = useState('day');

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const params = { startDate, endDate };

      const [branchData, dashboardData, salesData, lowStockData] = await Promise.all([
        branchesAPI.getBranch(id),
        branchesAPI.getBranchDashboard(id, params),
        branchesAPI.getBranchSalesReport(id, { ...params, groupBy }),
        branchesAPI.getBranchLowStock(id).catch(() => [])
      ]);

      setBranchName(branchData.branch_name);
      setDashboard(dashboardData);
      setSalesReport(Array.isArray(salesData) ? salesData : []);
      setLowStock(Array.isArray(lowStockData) ? lowStockData : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, startDate, endDate, groupBy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const setQuickRange = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6 animate-pulse">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            <div className="h-4 w-24 bg-theme-tertiary rounded" />
            <div className="h-7 w-64 bg-theme-tertiary rounded" />
          </div>
          <div className="h-9 w-24 bg-theme-tertiary rounded-xl" />
        </div>
        {/* Date filter skeleton */}
        <div className="h-14 bg-theme-secondary border border-theme rounded-2xl" />
        {/* KPI grid skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-theme-secondary border border-theme rounded-2xl p-4 space-y-3">
              <div className="h-3 w-20 bg-theme-tertiary rounded" />
              <div className="h-6 w-16 bg-theme-tertiary rounded" />
            </div>
          ))}
        </div>
        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array(2).fill(0).map((_, i) => (
            <div key={i} className="bg-theme-secondary border border-theme rounded-2xl p-5 h-64" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array(2).fill(0).map((_, i) => (
            <div key={i} className="bg-theme-secondary border border-theme rounded-2xl p-5 h-48" />
          ))}
        </div>
      </div>
    );
  }

  const sales = dashboard?.sales_summary || {};
  const inv = dashboard?.inventory_summary || {};

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <button
            onClick={() => navigate(`/branches/${id}`)}
            className="flex items-center gap-2 text-sm text-secondary hover:text-accent transition mb-2"
          >
            <ArrowLeft size={16} />
            Back to Branch
          </button>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-3">
            <BarChart3 size={24} className="text-accent" />
            {branchName} — Analytics
          </h1>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-default text-primary hover:bg-hover transition disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="bg-card border border-default rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Calendar size={16} className="text-secondary" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 bg-default border border-default rounded-xl text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
          <span className="text-secondary text-sm">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 bg-default border border-default rounded-xl text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
          <div className="flex gap-1 ml-2">
            {[
              { label: '7D', days: 7 },
              { label: '30D', days: 30 },
              { label: '90D', days: 90 },
              { label: '1Y', days: 365 },
            ].map(({ label, days }) => (
              <button
                key={label}
                onClick={() => setQuickRange(days)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-default text-secondary hover:bg-accent hover:text-white transition"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          icon={ShoppingCart}
          label="Total Sales"
          value={sales.total_sales || 0}
          color="blue"
        />
        <KPICard
          icon={DollarSign}
          label="Revenue"
          value={formatCurrency(sales.total_revenue || 0)}
          color="green"
        />
        <KPICard
          icon={TrendingUp}
          label="Profit"
          value={formatCurrency(sales.total_profit || 0)}
          color="emerald"
        />
        <KPICard
          icon={Percent}
          label="Margin"
          value={`${sales.profit_margin || 0}%`}
          color="amber"
        />
        <KPICard
          icon={Package}
          label="Inventory Value"
          value={formatCurrency(inv.inventory_value || 0)}
          color="purple"
        />
        <KPICard
          icon={Users}
          label="Customers"
          value={dashboard?.unique_customers || 0}
          color="rose"
        />
      </div>

      {/* Sales Trend + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <div className="bg-card border border-default rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-primary">Sales Trend</h3>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="text-xs px-2 py-1 bg-default border border-default rounded-lg text-primary focus:outline-none"
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
            </select>
          </div>
          {salesReport.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <BarChart3 size={32} className="text-secondary/30 mb-2" />
              <p className="text-sm text-secondary">No sales data for this period</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {salesReport.map((row, i) => {
                const maxRevenue = Math.max(...salesReport.map(r => parseFloat(r.total_revenue || 0)));
                const pct = maxRevenue > 0 ? (parseFloat(row.total_revenue) / maxRevenue) * 100 : 0;
                return (
                  <div key={i} className="group">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-secondary">
                        {new Date(row.period).toLocaleDateString(undefined, {
                          month: 'short', day: 'numeric', year: groupBy === 'month' ? 'numeric' : undefined
                        })}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-secondary">{row.sales_count} sales</span>
                        <span className="font-semibold text-primary">{formatCurrency(row.total_revenue)}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-default rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-accent to-blue-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-card border border-default rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-primary mb-4">Top Selling Products</h3>
          {!dashboard?.top_products?.length ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Package size={32} className="text-secondary/30 mb-2" />
              <p className="text-sm text-secondary">No product data</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {dashboard.top_products.map((p, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-default last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-primary">{p.product_name}</p>
                      <p className="text-xs text-secondary font-mono">{p.product_code}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-primary">{formatCurrency(p.revenue)}</p>
                    <p className="text-xs text-secondary">{p.quantity_sold} sold</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Staff Performance + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Staff Performance */}
        <div className="bg-card border border-default rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-primary mb-4">Staff Performance</h3>
          {!dashboard?.staff_performance?.length ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users size={32} className="text-secondary/30 mb-2" />
              <p className="text-sm text-secondary">No staff sales data</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {dashboard.staff_performance.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-default last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/10 text-accent font-bold text-xs flex items-center justify-center">
                      {(s.full_name || '?').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-primary">{s.full_name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-primary">{formatCurrency(s.total_sales)}</p>
                    <p className="text-xs text-secondary">{s.sales_count} sales</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-card border border-default rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-primary mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            Low Stock Alerts
          </h3>
          {lowStock.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Package size={32} className="text-emerald-500/30 mb-2" />
              <p className="text-sm text-emerald-600 dark:text-emerald-400">All stock levels healthy</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {lowStock.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-default last:border-0">
                  <div>
                    <p className="text-sm font-medium text-primary">{item.product_name}</p>
                    <p className="text-xs text-secondary font-mono">{item.product_code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-600 dark:text-red-400">{item.quantity_on_hand}</p>
                    <p className="text-xs text-secondary">Reorder: {item.reorder_level}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── KPI Card ────────────────────────────────────────────
const KPICard = ({ icon: Icon, label, value, color }) => {
  const colorMap = {
    blue: 'from-blue-500/10 to-blue-600/5 text-blue-600 border-blue-200/30',
    green: 'from-emerald-500/10 to-emerald-600/5 text-emerald-600 border-emerald-200/30',
    emerald: 'from-teal-500/10 to-teal-600/5 text-teal-600 border-teal-200/30',
    amber: 'from-amber-500/10 to-amber-600/5 text-amber-600 border-amber-200/30',
    purple: 'from-purple-500/10 to-purple-600/5 text-purple-600 border-purple-200/30',
    rose: 'from-rose-500/10 to-rose-600/5 text-rose-600 border-rose-200/30',
  };

  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-2xl p-4 transition hover:shadow-md`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} />
        <span className="text-xs font-medium opacity-80">{label}</span>
      </div>
      <p className="text-xl font-bold truncate">{value}</p>
    </div>
  );
};

export default BranchAnalyticsPage;
