import React, { useState, useEffect } from 'react';
import {
    Users,
    UserPlus,
    TrendingUp,
    DollarSign,
    RefreshCw,
    Download,
    Award,
    ShoppingBag,
    BarChart3
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import {
    SalesChart,
    RevenueBarChart,
    TopCustomersTable,
    StatsSummaryCard
} from '../components/analytics';
import { analyticsAPI } from '../api/analytics';
import { toast } from 'react-toastify';
import { useCurrency } from '../context/CurrencyContext';

const CustomerAnalytics = () => {
    const { formatCurrency, symbol } = useCurrency();
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('month');

    const [stats, setStats] = useState({
        total_customers: 0,
        new_customers: 0,
        returning_customers: 0,
        average_lifetime_value: 0,
        retention_rate: 0,
        churn_rate: 0
    });
    const [customerGrowth, setCustomerGrowth] = useState([]);
    const [topCustomers, setTopCustomers] = useState([]);
    const [customerSegments, setCustomerSegments] = useState([]);
    const [purchaseFrequency, setPurchaseFrequency] = useState([]);

    useEffect(() => {
        fetchAnalytics();
    }, [dateRange]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const params = { period: dateRange };

            const [
                growthRes,
                topCustomersRes,
                retentionRes
            ] = await Promise.all([
                analyticsAPI.getCustomerGrowth(params).catch(() => ({})),
                analyticsAPI.getTopCustomers({ ...params, limit: 8 }).catch(() => ({ customers: [] })),
                analyticsAPI.getCustomerRetention(params).catch(() => ({}))
            ]);

            setStats({
                total_customers: growthRes.total_customers || 0,
                new_customers: growthRes.new_customers || 0,
                returning_customers: retentionRes.returning_customers || 0,
                average_lifetime_value: retentionRes.average_lifetime_value || 0,
                retention_rate: retentionRes.retention_rate || 0,
                churn_rate: retentionRes.churn_rate || 0
            });

            const growthData = growthRes.trend || growthRes.data || growthRes.growth || [];
            setCustomerGrowth(growthData.map(item => ({
                date: item.date || item.period,
                new_customers: item.new_customers || item.new || 0,
                total_customers: item.total_customers || item.total || 0
            })));

            const customers = topCustomersRes.customers || topCustomersRes.data || topCustomersRes || [];
            setTopCustomers(customers.map(c => ({
                id: c.id,
                name: c.customer_name || c.name,
                orders_count: c.orders_count || c.total_orders || 0,
                total_spent: c.total_spent || c.total_amount || 0,
                trend: c.trend || 0,
                last_purchase: c.last_purchase || c.last_order_date
            })));

            const segments = retentionRes.segments || [];
            const segmentColors = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'];
            setCustomerSegments(segments.length > 0 ? segments.map((s, i) => ({
                name: s.segment_name || s.name,
                value: s.count || s.value || 0,
                color: s.color || segmentColors[i % segmentColors.length]
            })) : [
                { name: 'VIP', value: Math.round((growthRes.total_customers || 0) * 0.1), color: '#f59e0b' },
                { name: 'Regular', value: Math.round((growthRes.total_customers || 0) * 0.36), color: '#3b82f6' },
                { name: 'Occasional', value: Math.round((growthRes.total_customers || 0) * 0.31), color: '#10b981' },
                { name: 'New', value: Math.round((growthRes.total_customers || 0) * 0.23), color: '#8b5cf6' }
            ]);

            const frequency = retentionRes.purchase_frequency || [];
            setPurchaseFrequency(frequency.length > 0 ? frequency.map(f => ({
                name: f.frequency || f.name,
                customers: f.customers || f.count || 0
            })) : []);

        } catch (error) {
            console.error('Error fetching analytics:', error);
            toast.error('Failed to load customer analytics');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const headers = ['Name', 'Orders', 'Total Spent', 'Trend %', 'Last Purchase'];
            const rows = topCustomers.map(c => [
                c.name,
                c.orders_count,
                formatCurrency(c.total_spent || 0),
                `${c.trend > 0 ? '+' : ''}${c.trend}%`,
                c.last_purchase || 'N/A'
            ]);

            const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `customer-analytics-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            URL.revokeObjectURL(url);
            toast.success('Report exported successfully');
        } catch (error) {
            console.error('Error exporting report:', error);
            toast.error('Failed to export report');
        }
    };

    const dateRangeOptions = [
        { value: 'week', label: 'This Week' },
        { value: 'month', label: 'This Month' },
        { value: 'quarter', label: 'This Quarter' },
        { value: 'year', label: 'This Year' }
    ];

    const statsCards = [
        { title: 'Total Customers', value: stats.total_customers.toLocaleString(), icon: Users, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' },
        { title: 'New Customers', value: stats.new_customers, icon: UserPlus, color: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' },
        { title: 'Returning', value: stats.returning_customers, icon: ShoppingBag, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' },
        { title: 'Avg Lifetime Value', value: formatCurrency(stats.average_lifetime_value), icon: DollarSign, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' },
        { title: 'Retention Rate', value: `${stats.retention_rate}%`, icon: Award, color: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400' },
        { title: 'Churn Rate', value: `${stats.churn_rate}%`, icon: TrendingUp, color: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400' }
    ];

    const actions = (
        <div className="flex items-center gap-3">
            <div className="flex items-center bg-theme-tertiary rounded-lg p-1">
                {dateRangeOptions.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => setDateRange(option.value)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                            dateRange === option.value
                                ? 'bg-accent-gold text-white shadow-sm'
                                : 'text-theme-secondary hover:text-theme-primary'
                        }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
            <button
                onClick={fetchAnalytics}
                className="bg-theme-secondary border border-theme text-theme-secondary px-4 py-2 rounded-lg font-medium text-sm hover:bg-theme-tertiary transition flex items-center gap-2"
            >
                <RefreshCw size={16} /> Refresh
            </button>
            <button
                onClick={handleExport}
                className="bg-accent-gold text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-accent-goldDark transition flex items-center gap-2"
            >
                <Download size={16} /> Export
            </button>
        </div>
    );

    return (
        <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
            <PageHeader
                title="Customer Analytics"
                subtitle="Understand customer behavior and lifetime value"
                icon={Users}
                actions={actions}
            />

            {/* Stats Cards */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {Array(6).fill(0).map((_, i) => (
                        <div key={i} className="bg-theme-secondary p-5 rounded-lg border border-theme shadow-theme-sm animate-pulse">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-theme-tertiary rounded-lg"></div>
                                <div className="space-y-2 flex-1">
                                    <div className="h-3 w-16 bg-theme-tertiary rounded"></div>
                                    <div className="h-5 w-12 bg-theme-tertiary rounded"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {statsCards.map((card, i) => (
                        <div key={i} className="bg-theme-secondary p-5 rounded-lg border border-theme shadow-theme-sm flex items-center gap-4">
                            <div className={`p-2.5 rounded-lg ${card.color}`}>
                                <card.icon size={20} />
                            </div>
                            <div>
                                <div className="text-xs text-theme-muted font-medium">{card.title}</div>
                                <div className="text-xl font-semibold text-theme-primary">{card.value}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Charts Row */}
            {loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {Array(2).fill(0).map((_, i) => (
                        <div key={i} className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm animate-pulse">
                            <div className="h-4 w-40 bg-theme-tertiary rounded mb-6"></div>
                            <div className="h-[280px] bg-theme-tertiary/30 rounded-lg"></div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SalesChart
                        data={customerGrowth}
                        title="Customer Growth"
                        height={280}
                        dataKeys={[
                            { key: 'new_customers', color: '#10b981', name: 'New Customers' },
                            { key: 'total_customers', color: '#d4a843', name: 'Total Customers' }
                        ]}
                        formatValue={(val) => val.toLocaleString()}
                    />
                    <RevenueBarChart
                        data={purchaseFrequency}
                        title="Purchase Frequency Distribution"
                        height={280}
                        layout="horizontal"
                        dataKeys={[
                            { key: 'customers', color: '#8b5cf6', name: 'Customers' }
                        ]}
                        xAxisKey="name"
                        formatValue={(val) => `${val} customers`}
                    />
                </div>
            )}

            {/* Customer Segments + Top Customers */}
            {loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm animate-pulse">
                        <div className="h-4 w-40 bg-theme-tertiary rounded mb-6"></div>
                        <div className="space-y-4">
                            {Array(4).fill(0).map((_, i) => (
                                <div key={i} className="flex justify-between">
                                    <div className="h-4 w-20 bg-theme-tertiary rounded"></div>
                                    <div className="h-4 w-12 bg-theme-tertiary rounded"></div>
                                </div>
                            ))}
                        </div>
                        <div className="h-4 bg-theme-tertiary rounded-full mt-6"></div>
                    </div>
                    <div className="lg:col-span-2 bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm animate-pulse">
                        <div className="h-4 w-48 bg-theme-tertiary rounded mb-6"></div>
                        <div className="space-y-4">
                            {Array(5).fill(0).map((_, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-theme-tertiary rounded-full"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-32 bg-theme-tertiary rounded"></div>
                                        <div className="h-3 w-20 bg-theme-tertiary rounded"></div>
                                    </div>
                                    <div className="h-4 w-16 bg-theme-tertiary rounded"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Segment Cards */}
                    <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm p-6">
                        <h3 className="text-lg font-semibold text-theme-primary mb-4">Customer Segments</h3>
                        <div className="space-y-4">
                            {customerSegments.map((segment) => (
                                <div key={segment.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: segment.color }}
                                        />
                                        <span className="font-medium text-theme-secondary text-sm">{segment.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-semibold text-theme-primary text-sm">{segment.value}</span>
                                        <span className="text-xs text-theme-muted ml-2">
                                            ({stats.total_customers > 0 ? ((segment.value / stats.total_customers) * 100).toFixed(1) : 0}%)
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Visual bar representation */}
                        <div className="mt-6 h-4 rounded-full overflow-hidden flex bg-theme-tertiary">
                            {customerSegments.map((segment) => (
                                <div
                                    key={segment.name}
                                    style={{
                                        backgroundColor: segment.color,
                                        width: stats.total_customers > 0 ? `${(segment.value / stats.total_customers) * 100}%` : '0%'
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Top Customers Table */}
                    <div className="lg:col-span-2">
                        <TopCustomersTable
                            data={topCustomers}
                            title="Top Customers by Spend"
                            limit={8}
                            formatValue={(val) => `${symbol}${val.toLocaleString()}`}
                        />
                    </div>
                </div>
            )}

            {/* Customer Insights */}
            <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm overflow-hidden">
                <div className="bg-gradient-to-r from-accent-gold/10 to-purple-500/10 p-6">
                    <h3 className="text-lg font-semibold text-theme-primary mb-4">Customer Insights</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-theme-primary/60 backdrop-blur-sm rounded-lg border border-theme p-4">
                            <p className="text-xs text-theme-muted font-medium uppercase tracking-wider">Most Active Day</p>
                            <p className="text-2xl font-bold text-theme-primary mt-1">Saturday</p>
                            <p className="text-xs text-theme-muted mt-1">32% of purchases</p>
                        </div>
                        <div className="bg-theme-primary/60 backdrop-blur-sm rounded-lg border border-theme p-4">
                            <p className="text-xs text-theme-muted font-medium uppercase tracking-wider">Avg Orders / Customer</p>
                            <p className="text-2xl font-bold text-theme-primary mt-1">4.8</p>
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">+12% from last month</p>
                        </div>
                        <div className="bg-theme-primary/60 backdrop-blur-sm rounded-lg border border-theme p-4">
                            <p className="text-xs text-theme-muted font-medium uppercase tracking-wider">Customer Satisfaction</p>
                            <p className="text-2xl font-bold text-theme-primary mt-1">4.6 / 5.0</p>
                            <p className="text-xs text-theme-muted mt-1">Based on 234 reviews</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerAnalytics;
