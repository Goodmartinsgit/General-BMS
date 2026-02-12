import React, { useState, useEffect } from 'react';
import {
    Package,
    TrendingDown,
    AlertTriangle,
    DollarSign,
    RefreshCw,
    Download,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import { Button, LoadingSpinner, Badge } from '../components/ui';
import {
    RevenueBarChart,
    TopProductsTable,
    StatsSummaryCard
} from '../components/analytics';
import { analyticsAPI } from '../api/analytics';
import { branchesAPI } from '../api/branches';
import { toast } from 'react-toastify';

/**
 * InventoryAnalytics Page
 * Track inventory levels, turnover, and stock health
 */
const InventoryAnalytics = () => {
    const [loading, setLoading] = useState(true);
    const [branchFilter, setBranchFilter] = useState('all');
    const [branches, setBranches] = useState([]);

    // Analytics data
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

            // Category breakdown from inventory value response
            const categories = inventoryValueRes.by_category || inventoryValueRes.categories || [];
            setCategoryStock(categories.map(cat => ({
                name: cat.category_name || cat.name,
                value: cat.total_value || cat.value || 0,
                quantity: cat.total_quantity || cat.quantity || 0
            })));

            // Low stock items
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

            // Stock movement data
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

    const getStatusBadge = (status) => {
        switch (status) {
            case 'critical':
                return <Badge variant="danger">Critical</Badge>;
            case 'low':
                return <Badge variant="warning">Low Stock</Badge>;
            default:
                return <Badge variant="default">Normal</Badge>;
        }
    };

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
                    <h1 className="text-3xl font-bold text-gray-900">Inventory Analytics</h1>
                    <p className="text-gray-600 mt-1">Monitor stock levels and inventory health</p>
                </div>
                <div className="flex items-center gap-3">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatsSummaryCard
                    title="Total Products"
                    value={stats.total_products.toLocaleString()}
                    icon={Package}
                    color="blue"
                    size="small"
                />
                <StatsSummaryCard
                    title="Inventory Value"
                    value={`$${stats.total_value.toLocaleString()}`}
                    icon={DollarSign}
                    color="green"
                    size="small"
                />
                <StatsSummaryCard
                    title="Low Stock Items"
                    value={stats.low_stock_count}
                    icon={TrendingDown}
                    color="orange"
                    size="small"
                />
                <StatsSummaryCard
                    title="Out of Stock"
                    value={stats.out_of_stock_count}
                    icon={AlertTriangle}
                    color="red"
                    size="small"
                />
                <StatsSummaryCard
                    title="Turnover Rate"
                    value={`${stats.avg_turnover_rate}x`}
                    subtitle="Per year"
                    color="purple"
                    size="small"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RevenueBarChart
                    data={categoryStock}
                    title="Inventory Value by Category"
                    height={280}
                    layout="horizontal"
                    dataKeys={[
                        { key: 'value', color: '#3b82f6', name: 'Value ($)' }
                    ]}
                    xAxisKey="name"
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
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h3>
                    <Button variant="outline" size="sm">
                        View All
                    </Button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Product</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">SKU</th>
                                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Current Stock</th>
                                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Reorder Level</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Branch</th>
                                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {lowStockItems.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="py-3 px-4">
                                        <span className="font-medium text-gray-900">{item.name}</span>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-500">{item.sku}</td>
                                    <td className="py-3 px-4 text-center">
                                        <span className={`font-semibold ${item.status === 'critical' ? 'text-red-600' : 'text-orange-600'}`}>
                                            {item.current_stock}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-center text-gray-600">{item.reorder_level}</td>
                                    <td className="py-3 px-4 text-sm text-gray-600">{item.branch}</td>
                                    <td className="py-3 px-4 text-center">{getStatusBadge(item.status)}</td>
                                    <td className="py-3 px-4 text-right">
                                        <Button variant="outline" size="sm">
                                            Reorder
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default InventoryAnalytics;
