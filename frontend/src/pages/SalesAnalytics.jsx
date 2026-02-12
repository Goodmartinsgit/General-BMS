import React, { useState, useEffect } from 'react';
import {
    DollarSign,
    TrendingUp,
    ShoppingCart,
    Users,
    Calendar,
    Download,
    RefreshCw,
    Filter
} from 'lucide-react';
import { Button, LoadingSpinner } from '../components/ui';
import {
    SalesChart,
    RevenueBarChart,
    PaymentBreakdownChart,
    TopProductsTable,
    TopCustomersTable,
    StatsSummaryCard,
    BranchComparisonChart
} from '../components/analytics';
import { analyticsAPI } from '../api/analytics';
import { branchesAPI } from '../api/branches';
import { toast } from 'react-toastify';

/**
 * SalesAnalytics Page
 * Comprehensive sales analytics dashboard
 */
const SalesAnalytics = () => {
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('month'); // today, week, month, quarter, year
    const [branchFilter, setBranchFilter] = useState('all');
    const [branches, setBranches] = useState([]);

    // Analytics data
    const [stats, setStats] = useState({
        total_revenue: 0,
        total_orders: 0,
        average_order_value: 0,
        total_customers: 0,
        revenue_growth: 0,
        orders_growth: 0
    });
    const [salesTrend, setSalesTrend] = useState([]);
    const [paymentBreakdown, setPaymentBreakdown] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [topCustomers, setTopCustomers] = useState([]);
    const [branchComparison, setBranchComparison] = useState([]);
    const [dailySales, setDailySales] = useState([]);

    useEffect(() => {
        fetchAnalytics();
    }, [dateRange, branchFilter]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const params = {
                period: dateRange,
                branch_id: branchFilter !== 'all' ? branchFilter : undefined
            };

            // Fetch all data in parallel
            const [
                branchesRes,
                statsRes,
                trendRes,
                paymentRes,
                productsRes,
                customersRes,
                branchCompRes
            ] = await Promise.all([
                branchesAPI.getBranches().catch(() => ({ branches: [] })),
                analyticsAPI.getSalesAnalytics(params).catch(() => ({})),
                analyticsAPI.getSalesTrend(params).catch(() => ({ trend: [] })),
                analyticsAPI.getSalesByPaymentMethod(params).catch(() => ({ breakdown: [] })),
                analyticsAPI.getTopProducts({ ...params, limit: 5 }).catch(() => ({ products: [] })),
                analyticsAPI.getTopCustomers({ ...params, limit: 5 }).catch(() => ({ customers: [] })),
                analyticsAPI.getBranchComparison(params).catch(() => ({ branches: [] }))
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

            setSalesTrend(trendRes.trend || trendRes.data || trendRes || []);

            // Format payment breakdown for chart
            const paymentData = paymentRes.breakdown || paymentRes.data || paymentRes || [];
            const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];
            setPaymentBreakdown(paymentData.map((item, index) => ({
                name: item.payment_method || item.name,
                value: item.total || item.value || 0,
                color: colors[index % colors.length]
            })));

            setTopProducts(productsRes.products || productsRes.data || productsRes || []);
            setTopCustomers(customersRes.customers || customersRes.data || customersRes || []);
            setBranchComparison(branchCompRes.branches || branchCompRes.data || branchCompRes || []);

            // Daily sales uses the trend data reformatted
            const dailyData = trendRes.daily || trendRes.trend?.slice(-7) || [];
            setDailySales(dailyData.map(item => ({
                name: item.day_name || new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
                revenue: item.revenue || item.sales || 0,
                cost: item.cost || 0
            })));

        } catch (error) {
            console.error('Error fetching analytics:', error);
            toast.error('Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const params = {
                period: dateRange,
                branch_id: branchFilter !== 'all' ? branchFilter : undefined
            };
            const blob = await analyticsAPI.generateSalesReport(params);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `sales-report-${dateRange}-${new Date().toISOString().split('T')[0]}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
            toast.success('Report exported successfully');
        } catch (error) {
            console.error('Error exporting report:', error);
            toast.error('Failed to export report');
        }
    };

    const dateRangeOptions = [
        { value: 'today', label: 'Today' },
        { value: 'week', label: 'This Week' },
        { value: 'month', label: 'This Month' },
        { value: 'quarter', label: 'This Quarter' },
        { value: 'year', label: 'This Year' }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Sales Analytics</h1>
                    <p className="text-gray-600 mt-1">Track sales performance and trends</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Date Range Selector */}
                    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1">
                        {dateRangeOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setDateRange(option.value)}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                    dateRange === option.value
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>

                    {/* Branch Filter */}
                    <select
                        value={branchFilter}
                        onChange={(e) => setBranchFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Branches</option>
                        {branches.map((branch) => (
                            <option key={branch.id} value={branch.id}>
                                {branch.branch_name}
                            </option>
                        ))}
                    </select>

                    <Button variant="outline" icon={RefreshCw} onClick={fetchAnalytics}>
                        Refresh
                    </Button>
                    <Button variant="outline" icon={Download} onClick={handleExport}>
                        Export
                    </Button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsSummaryCard
                    title="Total Revenue"
                    value={`$${stats.total_revenue.toLocaleString()}`}
                    trend={stats.revenue_growth}
                    trendLabel="vs last period"
                    icon={DollarSign}
                    color="blue"
                />
                <StatsSummaryCard
                    title="Total Orders"
                    value={stats.total_orders.toLocaleString()}
                    trend={stats.orders_growth}
                    trendLabel="vs last period"
                    icon={ShoppingCart}
                    color="green"
                />
                <StatsSummaryCard
                    title="Avg Order Value"
                    value={`$${stats.average_order_value.toFixed(2)}`}
                    subtitle="Per transaction"
                    icon={TrendingUp}
                    color="purple"
                />
                <StatsSummaryCard
                    title="Unique Customers"
                    value={stats.total_customers.toLocaleString()}
                    subtitle="Active buyers"
                    icon={Users}
                    color="orange"
                />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <SalesChart
                        data={salesTrend}
                        title="Sales Trend"
                        height={320}
                        dataKeys={[
                            { key: 'sales', color: '#3b82f6', name: 'Revenue' }
                        ]}
                    />
                </div>
                <PaymentBreakdownChart
                    data={paymentBreakdown}
                    title="Payment Methods"
                    height={280}
                />
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RevenueBarChart
                    data={dailySales}
                    title="Daily Revenue vs Cost"
                    height={280}
                    layout="horizontal"
                    dataKeys={[
                        { key: 'revenue', color: '#3b82f6', name: 'Revenue' },
                        { key: 'cost', color: '#ef4444', name: 'Cost' }
                    ]}
                    xAxisKey="name"
                />
                <BranchComparisonChart
                    data={branchComparison}
                    title="Branch Performance"
                    height={280}
                    metric="revenue"
                    showTarget={true}
                />
            </div>

            {/* Tables Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TopProductsTable
                    data={topProducts}
                    title="Top Selling Products"
                    limit={5}
                />
                <TopCustomersTable
                    data={topCustomers}
                    title="Top Customers"
                    limit={5}
                />
            </div>
        </div>
    );
};

export default SalesAnalytics;
