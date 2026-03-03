import React, { useState, useEffect } from 'react';
import {
    Package,
    TrendingDown,
    AlertTriangle,
    DollarSign,
    RefreshCw,
    Download,
    BarChart3,
    Target,
    RotateCw
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import RevenueBarChart from '../components/analytics/RevenueBarChart';
import { analyticsAPI } from '../api/analytics';
import { branchesAPI } from '../api/branches';
import { toast } from 'react-toastify';
import { useCurrency } from '../context/CurrencyContext';

const InventoryAnalytics = () => {
    const { formatCurrency, symbol } = useCurrency();
    const [loading, setLoading] = useState(true);
    const [branchFilter, setBranchFilter] = useState('all');
    const [branches, setBranches] = useState([]);

    const [stats, setStats] = useState({
        total_products: 0,
        total_value: 0,
        low_stock_count: 0,
        out_of_stock_count: 0,
        avg_turnover_rate: 0
    });
    const [categoryStock, setCategoryStock] = useState([]);
    const [lowStockItems, setLowStockItems] = useState([]);
    const [stockMovement, setStockMovement] = useState([]);

    useEffect(() => {
        fetchAnalytics();
    }, [branchFilter]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const params = {
                branch_id: branchFilter !== 'all' ? branchFilter : undefined
            };

            const [
                branchesRes,
                inventoryValueRes,
                lowStockRes,
                movementRes,
                turnoverRes
            ] = await Promise.all([
                branchesAPI.getBranches().catch(() => ({ branches: [] })),
                analyticsAPI.getInventoryValue(params).catch(() => ({})),
                analyticsAPI.getLowStockItems(params).catch(() => ({ items: [] })),
                analyticsAPI.getStockMovementSummary(params).catch(() => ({ movements: [] })),
                analyticsAPI.getInventoryTurnover(params).catch(() => ({}))
            ]);

            setBranches(branchesRes.branches || branchesRes.data || branchesRes || []);

            setStats({
                total_products: inventoryValueRes.total_products || 0,
                total_value: inventoryValueRes.total_value || 0,
                low_stock_count: inventoryValueRes.low_stock_count || lowStockRes.items?.length || 0,
                out_of_stock_count: inventoryValueRes.out_of_stock_count || 0,
                avg_turnover_rate: turnoverRes.avg_turnover_rate || 0
            });

            const categories = inventoryValueRes.by_category || inventoryValueRes.categories || [];
            setCategoryStock(categories.map(cat => ({
                name: cat.category_name || cat.name,
                value: cat.total_value || cat.value || 0,
                quantity: cat.total_quantity || cat.quantity || 0
            })));

            const lowItems = lowStockRes.items || lowStockRes.data || lowStockRes || [];
            setLowStockItems(lowItems.map(item => ({
                id: item.id,
                name: item.product_name || item.name,
                sku: item.sku,
                current_stock: item.current_stock || item.quantity || 0,
                reorder_level: item.reorder_level || item.min_stock || 0,
                branch: item.branch_name || item.branch,
                status: item.current_stock <= 0 ? 'critical' :
                        item.current_stock <= (item.reorder_level / 2) ? 'critical' : 'low'
            })));

            const movements = movementRes.movements || movementRes.data || movementRes || [];
            setStockMovement(movements.map(m => ({
                name: m.period || m.week || m.name,
                inbound: m.inbound || m.stock_in || 0,
                outbound: m.outbound || m.stock_out || 0
            })));

        } catch (error) {
            console.error('Error fetching analytics:', error);
            toast.error('Failed to load inventory analytics');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const params = {
                branch_id: branchFilter !== 'all' ? branchFilter : undefined
            };
            const blob = await analyticsAPI.generateInventoryReport(params);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `inventory-report-${new Date().toISOString().split('T')[0]}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
            toast.success('Report exported successfully');
        } catch (error) {
            console.error('Error exporting report:', error);
            toast.error('Failed to export report');
        }
    };

    const actions = (
        <div className="flex items-center gap-3">
            <div className="relative">
                <Target className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted w-4 h-4 pointer-events-none" />
                <select
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-theme-primary border border-theme rounded-lg text-sm focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all text-theme-primary appearance-none cursor-pointer"
                >
                    <option value="all">All Branches</option>
                    {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>{branch.branch_name}</option>
                    ))}
                </select>
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

    const statsCards = [
        { title: 'Total Products', value: stats.total_products.toLocaleString(), icon: Package, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' },
        { title: 'Inventory Value', value: formatCurrency(stats.total_value), icon: DollarSign, color: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' },
        { title: 'Low Stock Items', value: stats.low_stock_count, icon: TrendingDown, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' },
        { title: 'Out of Stock', value: stats.out_of_stock_count, icon: AlertTriangle, color: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400' },
        { title: 'Turnover Rate', value: `${stats.avg_turnover_rate}x / yr`, icon: RotateCw, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' }
    ];

    return (
        <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
            <PageHeader
                title="Inventory Analytics"
                subtitle="Monitor stock levels and inventory health"
                icon={BarChart3}
                actions={actions}
            />

            {/* Stats Cards */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    {Array(5).fill(0).map((_, i) => (
                        <div key={i} className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm animate-pulse">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-theme-tertiary rounded-lg"></div>
                                <div className="space-y-2 flex-1">
                                    <div className="h-3 w-20 bg-theme-tertiary rounded"></div>
                                    <div className="h-6 w-16 bg-theme-tertiary rounded"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    {statsCards.map((card, i) => (
                        <div key={i} className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${card.color}`}>
                                <card.icon size={24} />
                            </div>
                            <div>
                                <div className="text-sm text-theme-muted font-medium">{card.title}</div>
                                <div className="text-2xl font-semibold text-theme-primary">{card.value}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RevenueBarChart
                    data={categoryStock}
                    title="Inventory Value by Category"
                    height={280}
                    layout="horizontal"
                    dataKeys={[
                        { key: 'value', color: '#d4a843', name: `Value (${symbol})` }
                    ]}
                    xAxisKey="name"
                    formatValue={(val) => `${symbol}${val.toLocaleString()}`}
                />
                <RevenueBarChart
                    data={stockMovement}
                    title="Stock Movement (Last 4 Weeks)"
                    height={280}
                    layout="horizontal"
                    dataKeys={[
                        { key: 'inbound', color: '#10b981', name: 'Inbound' },
                        { key: 'outbound', color: '#ef4444', name: 'Outbound' }
                    ]}
                    xAxisKey="name"
                    formatValue={(val) => `${val} units`}
                />
            </div>

            {/* Low Stock Items Table */}
            <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-theme">
                    <h3 className="text-lg font-semibold text-theme-primary">Low Stock Alerts</h3>
                    <span className="bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300 text-xs font-medium px-2.5 py-1 rounded-full">
                        {lowStockItems.length} items
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-theme-primary border-b border-theme">
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Product</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">SKU</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase text-center">Current Stock</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase text-center">Reorder Level</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Branch</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-theme">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="6" className="px-6 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-theme-tertiary rounded-lg"></div>
                                                <div className="space-y-2 flex-1">
                                                    <div className="w-48 h-4 bg-theme-tertiary rounded"></div>
                                                    <div className="w-32 h-3 bg-theme-tertiary rounded"></div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : lowStockItems.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-theme-tertiary rounded-full flex items-center justify-center text-theme-muted">
                                                <Package size={32} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-theme-primary text-lg">All stock levels healthy</p>
                                                <p className="text-theme-muted text-sm mt-1">No items are below their reorder level.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                lowStockItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-theme-primary transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-theme-primary text-sm">{item.name}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-theme-tertiary text-theme-secondary rounded text-xs font-mono">
                                                {item.sku}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`font-semibold text-sm ${
                                                item.status === 'critical'
                                                    ? 'text-red-600 dark:text-red-400'
                                                    : 'text-amber-600 dark:text-amber-400'
                                            }`}>
                                                {item.current_stock}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm text-theme-muted">
                                            {item.reorder_level}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-theme-secondary">
                                            {item.branch}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                                item.status === 'critical'
                                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
                                            }`}>
                                                {item.status === 'critical' ? 'Critical' : 'Low Stock'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default InventoryAnalytics;
