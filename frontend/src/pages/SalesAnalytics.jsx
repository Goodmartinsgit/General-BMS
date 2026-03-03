import React, { useState, useEffect, useCallback } from 'react';
import {
    DollarSign,
    TrendingUp,
    ShoppingCart,
    Users,
    Download,
    RefreshCw,
    BarChart3,
    Target
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import PeriodFilter from '../components/common/PeriodFilter';
import KPICard from '../components/dashboard/KPICard';
import SalesTrendChart from '../components/dashboard/SalesTrendChart';
import { analyticsAPI } from '../api/analytics';
import { branchesAPI } from '../api/branches';
import { toast } from 'react-toastify';
import { useCurrency } from '../context/CurrencyContext';

const SalesAnalytics = () => {
    const { formatCurrency } = useCurrency();
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState(null);
    const [branchFilter, setBranchFilter] = useState('all');
    const [branches, setBranches] = useState([]);

    const [stats, setStats] = useState({
        total_revenue: 0,
        total_orders: 0,
        average_order_value: 0,
        total_customers: 0,
        revenue_growth: 0,
        orders_growth: 0
    });
    const [salesTrend, setSalesTrend] = useState([]);

    useEffect(() => {
        fetchAnalytics();
    }, [dateRange, branchFilter]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const params = {
                branch_id: branchFilter !== 'all' ? branchFilter : undefined
            };
            if (dateRange?.start_date) params.start_date = dateRange.start_date;
            if (dateRange?.end_date) params.end_date = dateRange.end_date;
            if (!params.start_date) params.period = 'month'; // fallback

            const [branchesRes, statsRes, trendRes] = await Promise.all([
                branchesAPI.getBranches().catch(() => ({ branches: [] })),
                analyticsAPI.getSalesAnalytics(params).catch(() => ({})),
                analyticsAPI.getSalesTrend(params).catch(() => ({ trend: [] }))
            ]);

            setBranches(branchesRes.branches || branchesRes.data || branchesRes || []);
            setStats({
                total_revenue: statsRes.total_revenue || 0,
                total_orders: statsRes.total_orders || 0,
                average_order_value: statsRes.average_order_value || 0,
                total_customers: statsRes.total_customers || 0,
                revenue_growth: statsRes.revenue_growth || 0,
                orders_growth: statsRes.orders_growth || 0
            });

            const trendData = trendRes.trend || trendRes.data || trendRes || [];
            setSalesTrend(trendData.map(item => ({
                date: item.date || item.day_name,
                amount: item.revenue || item.sales || 0
            })));

        } catch (error) {
            console.error('Error fetching analytics:', error);
            toast.error('Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    const handlePeriodChange = useCallback((range) => {
        setDateRange(range);
    }, []);

    const actions = (
        <div className="flex items-center gap-3">
            <PeriodFilter storageKey="sales-analytics" onChange={handlePeriodChange} />
            <button
                onClick={fetchAnalytics}
                className="bg-theme-secondary border border-theme text-theme-secondary px-4 py-2 rounded-lg font-medium text-sm hover:bg-theme-tertiary transition flex items-center gap-2"
            >
                <RefreshCw size={16} /> Refresh
            </button>
            <button className="bg-accent-gold text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-accent-goldDark transition flex items-center gap-2">
                <Download size={16} /> Export PDF
            </button>
        </div>
    );

    return (
        <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
            <PageHeader
                title="Sales Analytics"
                subtitle="Sales performance and trends"
                icon={BarChart3}
                actions={actions}
            />

            {/* Filter Bar */}
            <div className="bg-theme-secondary p-3 rounded-lg border border-theme shadow-theme-sm flex flex-col md:flex-row gap-3 items-center">
                <div className="relative w-full md:w-56">
                    <Target className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted w-4 h-4 pointer-events-none" />
                    <select
                        value={branchFilter}
                        onChange={(e) => setBranchFilter(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-theme-primary border border-theme rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all text-sm text-theme-primary appearance-none cursor-pointer"
                    >
                        <option value="all">All Branches</option>
                        {branches.map(b => (
                            <option key={b.id} value={b.id}>{b.branch_name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <KPICard
                    title="Total Revenue"
                    value={formatCurrency(stats.total_revenue)}
                    change={`${stats.revenue_growth}%`}
                    changeType={stats.revenue_growth >= 0 ? 'positive' : 'negative'}
                    icon={DollarSign}
                    iconColor="bg-emerald-500"
                    loading={loading}
                    label="Current period"
                />
                <KPICard
                    title="Total Orders"
                    value={stats.total_orders}
                    change={`${stats.orders_growth}%`}
                    changeType={stats.orders_growth >= 0 ? 'positive' : 'negative'}
                    icon={ShoppingCart}
                    iconColor="bg-blue-500"
                    loading={loading}
                />
                <KPICard
                    title="Avg. Order Value"
                    value={formatCurrency(stats.average_order_value)}
                    icon={TrendingUp}
                    iconColor="bg-purple-500"
                    loading={loading}
                    label="Per transaction"
                />
                <KPICard
                    title="Customers"
                    value={stats.total_customers}
                    icon={Users}
                    iconColor="bg-orange-500"
                    loading={loading}
                    label="Unique buyers"
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                <SalesTrendChart data={salesTrend} loading={loading} />

                <div className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm">
                    <h3 className="font-semibold text-theme-primary text-base mb-4">Growth Summary</h3>

                    {loading ? (
                        <div className="space-y-4 animate-pulse">
                            <div className="p-4 bg-theme-tertiary rounded-lg h-20"></div>
                            <div className="p-4 bg-theme-tertiary rounded-lg h-20"></div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="p-4 bg-theme-primary rounded-lg border border-theme">
                                <div className="text-xs text-theme-muted font-medium mb-1">Revenue Growth</div>
                                <div className={`text-2xl font-bold ${stats.revenue_growth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {stats.revenue_growth >= 0 ? '+' : ''}{stats.revenue_growth}%
                                </div>
                                <div className="text-xs text-theme-muted mt-1">vs previous period</div>
                            </div>
                            <div className="p-4 bg-theme-primary rounded-lg border border-theme">
                                <div className="text-xs text-theme-muted font-medium mb-1">Orders Growth</div>
                                <div className={`text-2xl font-bold ${stats.orders_growth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {stats.orders_growth >= 0 ? '+' : ''}{stats.orders_growth}%
                                </div>
                                <div className="text-xs text-theme-muted mt-1">vs previous period</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SalesAnalytics;
