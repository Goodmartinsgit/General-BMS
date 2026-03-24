import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ShoppingBag, Search, Filter, Eye, Building2, CreditCard,
    ChevronLeft, ChevronRight, RefreshCw, Package, Clock, CheckCircle, TrendingUp, Printer
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { getOnlineOrders, getOrderStats } from '../api/onlineOrders';
import { useCurrency } from '../context/CurrencyContext';

const PAYMENT_STATUS_CONFIG = {
    AWAITING_CONFIRMATION: {
        label: 'Awaiting Confirmation',
        className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-700',
    },
    PAID: {
        label: 'Paid',
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-700',
    },
    FAILED: {
        label: 'Failed',
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-700',
    },
    PENDING: {
        label: 'Pending',
        className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700',
    },
};

const ORDER_STATUS_CONFIG = {
    PENDING: {
        label: 'Pending',
        className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700',
    },
    CONFIRMED: {
        label: 'Confirmed',
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-700',
    },
    PROCESSING: {
        label: 'Processing',
        className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700',
    },
    SHIPPED: {
        label: 'Shipped',
        className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-700',
    },
    DELIVERED: {
        label: 'Delivered',
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-700',
    },
    CANCELLED: {
        label: 'Cancelled',
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-700',
    },
};

const PAGE_SIZE = 20;

const PaymentStatusBadge = ({ status }) => {
    const config = PAYMENT_STATUS_CONFIG[status] || PAYMENT_STATUS_CONFIG.PENDING;
    return (
        <span className={`inline-flex items-center text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full ${config.className}`}>
            {config.label}
        </span>
    );
};

const OrderStatusBadge = ({ status }) => {
    const config = ORDER_STATUS_CONFIG[status] || ORDER_STATUS_CONFIG.PENDING;
    return (
        <span className={`inline-flex items-center text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full ${config.className}`}>
            {config.label}
        </span>
    );
};

const PaymentMethodBadge = ({ method }) => {
    if (method === 'bank_transfer') {
        return (
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <Building2 size={10} /> Bank Transfer
            </span>
        );
    }
    if (method === 'paystack') {
        return (
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border border-teal-200 dark:border-teal-700">
                <CreditCard size={10} /> Paystack
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
            <CreditCard size={10} /> {method || 'N/A'}
        </span>
    );
};

const StatCard = ({ label, value, icon: Icon, className = '', highlight = false }) => (
    <div className={`bg-theme-secondary rounded-lg border p-4 sm:p-5 flex items-center gap-4 shadow-theme-sm ${highlight ? 'border-amber-400 dark:border-amber-600' : 'border-theme'}`}>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${className}`}>
            <Icon size={20} />
        </div>
        <div className="min-w-0">
            <div className="text-lg sm:text-2xl font-bold text-theme-primary">{value}</div>
            <div className="text-xs text-theme-muted mt-0.5">{label}</div>
        </div>
    </div>
);

const OnlineOrdersPage = () => {
    const navigate = useNavigate();
    const { formatCurrency } = useCurrency();

    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit: PAGE_SIZE };
            if (searchTerm) params.search = searchTerm;
            if (statusFilter) params.status = statusFilter;
            if (paymentStatusFilter) params.payment_status = paymentStatusFilter;
            const res = await getOnlineOrders(params);
            const data = res.data;
            setOrders(Array.isArray(data) ? data : data.orders || []);
            setTotalCount(data.total || (Array.isArray(data) ? data.length : 0));
        } catch (err) {
            console.error('Failed to fetch online orders', err);
        } finally {
            setLoading(false);
        }
    }, [page, searchTerm, statusFilter, paymentStatusFilter]);

    const fetchStats = async () => {
        setStatsLoading(true);
        try {
            const res = await getOrderStats();
            setStats(res.data);
        } catch (err) {
            console.error('Failed to fetch order stats', err);
        } finally {
            setStatsLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        setPage(1);
    }, [searchTerm, statusFilter, paymentStatusFilter]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

    const handleSearch = (e) => setSearchTerm(e.target.value);

    return (
        <div className="space-y-4 sm:space-y-6 max-w-[1700px] mx-auto pb-6 sm:pb-10">
            <PageHeader
                title="Online Orders"
                subtitle="Manage orders placed through the online store"
                badge={`${totalCount} Orders`}
                icon={ShoppingBag}
                actions={
                    <button
                        onClick={() => { fetchOrders(); fetchStats(); }}
                        className="bg-theme-secondary border border-theme text-theme-secondary px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm hover:bg-theme-tertiary transition flex items-center gap-1.5"
                    >
                        <RefreshCw size={14} /> Refresh
                    </button>
                }
            />

            {/* KPI Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard
                    label="Total Orders"
                    value={statsLoading ? '—' : (stats?.total_orders ?? 0)}
                    icon={ShoppingBag}
                    className="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                />
                <StatCard
                    label="Pending"
                    value={statsLoading ? '—' : (stats?.pending ?? 0)}
                    icon={Clock}
                    className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                />
                <StatCard
                    label="Awaiting Payment Confirmation"
                    value={statsLoading ? '—' : (stats?.awaiting_confirmation ?? 0)}
                    icon={TrendingUp}
                    className="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                    highlight
                />
                <StatCard
                    label="Delivered"
                    value={statsLoading ? '—' : (stats?.delivered ?? 0)}
                    icon={CheckCircle}
                    className="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                />
            </div>

            {/* Filter Bar */}
            <div className="bg-theme-secondary p-3 sm:p-4 rounded-lg border border-theme shadow-theme-sm flex flex-col md:flex-row gap-3 sm:gap-4 items-center">
                <div className="relative flex-grow w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted w-4 h-4 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search by order number or customer name..."
                        className="w-full pl-9 pr-4 py-2 sm:py-2.5 bg-theme-primary border border-theme rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all text-xs sm:text-sm text-theme-primary placeholder-theme-muted"
                        value={searchTerm}
                        onChange={handleSearch}
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-theme-primary border border-theme rounded-lg flex-1 md:flex-none">
                        <Filter className="w-3.5 h-3.5 text-theme-muted" />
                        <select
                            className="bg-transparent text-xs sm:text-sm font-medium text-theme-primary outline-none cursor-pointer"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="PROCESSING">Processing</option>
                            <option value="SHIPPED">Shipped</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-theme-primary border border-theme rounded-lg flex-1 md:flex-none">
                        <Filter className="w-3.5 h-3.5 text-theme-muted" />
                        <select
                            className="bg-transparent text-xs sm:text-sm font-medium text-theme-primary outline-none cursor-pointer"
                            value={paymentStatusFilter}
                            onChange={(e) => setPaymentStatusFilter(e.target.value)}
                        >
                            <option value="">All Payment Statuses</option>
                            <option value="AWAITING_CONFIRMATION">Awaiting Confirmation</option>
                            <option value="PAID">Paid</option>
                            <option value="FAILED">Failed</option>
                            <option value="PENDING">Pending</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-theme-primary border-b border-theme">
                                <th className="px-4 sm:px-6 py-3 text-[10px] sm:text-xs font-semibold text-theme-muted uppercase tracking-wider">Order #</th>
                                <th className="px-4 sm:px-6 py-3 text-[10px] sm:text-xs font-semibold text-theme-muted uppercase tracking-wider">Customer</th>
                                <th className="px-4 sm:px-6 py-3 text-[10px] sm:text-xs font-semibold text-theme-muted uppercase tracking-wider hidden md:table-cell">Items</th>
                                <th className="px-4 sm:px-6 py-3 text-[10px] sm:text-xs font-semibold text-theme-muted uppercase tracking-wider">Total</th>
                                <th className="px-4 sm:px-6 py-3 text-[10px] sm:text-xs font-semibold text-theme-muted uppercase tracking-wider hidden lg:table-cell">Payment Method</th>
                                <th className="px-4 sm:px-6 py-3 text-[10px] sm:text-xs font-semibold text-theme-muted uppercase tracking-wider">Payment Status</th>
                                <th className="px-4 sm:px-6 py-3 text-[10px] sm:text-xs font-semibold text-theme-muted uppercase tracking-wider hidden sm:table-cell">Order Status</th>
                                <th className="px-4 sm:px-6 py-3 text-[10px] sm:text-xs font-semibold text-theme-muted uppercase tracking-wider hidden xl:table-cell">Date</th>
                                <th className="px-4 sm:px-6 py-3 text-[10px] sm:text-xs font-semibold text-theme-muted uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-theme">
                            {loading ? (
                                Array(6).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        {Array(9).fill(0).map((__, j) => (
                                            <td key={j} className="px-4 sm:px-6 py-4">
                                                <div className="h-4 bg-theme-tertiary rounded w-full max-w-[120px]" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-theme-tertiary rounded-full flex items-center justify-center text-theme-muted">
                                                <Package size={28} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-theme-primary text-base">No orders found</p>
                                                <p className="text-theme-muted text-sm mt-1">Try adjusting your filters or search term.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => {
                                    const isAwaitingConfirmation = order.payment_status === 'AWAITING_CONFIRMATION';
                                    return (
                                        <tr
                                            key={order.id}
                                            className={`hover:bg-theme-primary transition-colors group ${isAwaitingConfirmation ? 'border-l-4 border-l-amber-400' : ''}`}
                                        >
                                            <td className="px-4 sm:px-6 py-3 sm:py-4">
                                                <span className="font-mono text-xs sm:text-sm font-semibold text-theme-primary">
                                                    #{order.order_number}
                                                </span>
                                            </td>
                                            <td className="px-4 sm:px-6 py-3 sm:py-4">
                                                <div className="text-xs sm:text-sm font-medium text-theme-primary">
                                                    {order.customer_name || order.customer?.name || 'Guest'}
                                                </div>
                                                {(order.customer_email || order.customer?.email) && (
                                                    <div className="text-[10px] sm:text-xs text-theme-muted mt-0.5 truncate max-w-[150px]">
                                                        {order.customer_email || order.customer?.email}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 sm:px-6 py-3 sm:py-4 hidden md:table-cell">
                                                <span className="text-xs sm:text-sm text-theme-secondary">
                                                    {order.item_count ?? order.items?.length ?? '—'} item{(order.item_count ?? order.items?.length) !== 1 ? 's' : ''}
                                                </span>
                                            </td>
                                            <td className="px-4 sm:px-6 py-3 sm:py-4">
                                                <span className="text-xs sm:text-sm font-semibold text-theme-primary">
                                                    {formatCurrency(order.total_amount ?? order.total ?? 0)}
                                                </span>
                                            </td>
                                            <td className="px-4 sm:px-6 py-3 sm:py-4 hidden lg:table-cell">
                                                <PaymentMethodBadge method={order.payment_method} />
                                            </td>
                                            <td className="px-4 sm:px-6 py-3 sm:py-4">
                                                <PaymentStatusBadge status={order.payment_status} />
                                            </td>
                                            <td className="px-4 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                                                <OrderStatusBadge status={order.status || order.order_status} />
                                            </td>
                                            <td className="px-4 sm:px-6 py-3 sm:py-4 hidden xl:table-cell">
                                                <span className="text-xs text-theme-muted">
                                                    {order.created_at
                                                        ? new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                                                        : '—'}
                                                </span>
                                            </td>
                                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {(order.status === 'DELIVERED' || order.order_status === 'DELIVERED') && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); navigate(`/online-orders/${order.id}?receipt=true`); }}
                                                            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white transition"
                                                            title="Print Receipt"
                                                        >
                                                            <Printer size={12} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => navigate(`/online-orders/${order.id}`)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-accent-gold/10 text-accent-gold hover:bg-accent-gold hover:text-white transition"
                                                    >
                                                        <Eye size={12} /> View
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-theme flex flex-col sm:flex-row items-center justify-between gap-2 bg-theme-primary">
                        <span className="text-xs text-theme-muted">
                            Page {page} of {totalPages} &mdash; {totalCount} total orders
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-1.5 rounded-lg border border-theme text-theme-muted hover:text-theme-primary hover:bg-theme-secondary transition disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let p;
                                if (totalPages <= 5) {
                                    p = i + 1;
                                } else if (page <= 3) {
                                    p = i + 1;
                                } else if (page >= totalPages - 2) {
                                    p = totalPages - 4 + i;
                                } else {
                                    p = page - 2 + i;
                                }
                                return (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`w-7 h-7 text-xs rounded-lg font-medium transition ${p === page ? 'bg-accent-gold text-white' : 'border border-theme text-theme-muted hover:bg-theme-secondary hover:text-theme-primary'}`}
                                    >
                                        {p}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-1.5 rounded-lg border border-theme text-theme-muted hover:text-theme-primary hover:bg-theme-secondary transition disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OnlineOrdersPage;
