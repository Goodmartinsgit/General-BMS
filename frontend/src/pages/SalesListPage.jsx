import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Plus, Search, RefreshCw, RotateCcw, ChevronLeft, ChevronRight,
    ShoppingBag, XCircle, Clock, AlertTriangle
} from 'lucide-react';
import { salesAPI } from '../api/sales';
import api from '../api/axios';
import { SaleDetailModal } from '../components/sales';
import PeriodFilter from '../components/common/PeriodFilter';
import { useAuth } from '../context/AuthContext';
import { useFiscalPeriod } from '../context/FiscalPeriodContext';
import { useCurrency } from '../context/CurrencyContext';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

// ─── constants ────────────────────────────────────────────────────────────────
const ADMIN_ROLES = ['super_admin', 'admin', 'manager'];

const PAYMENT_STATUS_CFG = {
    paid:      { label: 'Fully Paid',  cls: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    partial:   { label: 'Partial',     cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
    credit:    { label: 'Credit',      cls: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
    cancelled: { label: 'Cancelled',   cls: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
};

const METHOD_BADGE_CLS = {
    cash:     'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    transfer: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    pos:      'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    card:     'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    credit:   'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

const inputCls = 'w-full px-3 py-2 bg-theme-primary border border-theme rounded-lg text-sm text-theme-primary placeholder-theme-muted focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all';
const selectCls = `${inputCls} appearance-none cursor-pointer`;

// ─── Component ────────────────────────────────────────────────────────────────
const SalesListPage = ({ defaultTab = 'all' }) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { auth } = useAuth();
    const { periodRange } = useFiscalPeriod();
    const { symbol } = useCurrency();

    const isAdmin = ADMIN_ROLES.includes(auth?.user?.role);
    const cs = symbol || '₦';

    // ── tabs ──────────────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState(defaultTab);

    // ── data ──────────────────────────────────────────────────────────────────
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

    // ── filters ───────────────────────────────────────────────────────────────
    const [searchTerm, setSearchTerm]       = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [localPeriod, setLocalPeriod]     = useState(null);

    // ── modals ────────────────────────────────────────────────────────────────
    const [selectedSaleId, setSelectedSaleId] = useState(null);

    // Active date range: local override wins over global fiscal period
    const activeDateRange = useMemo(() => {
        if (localPeriod) return { start: localPeriod.start_date || '', end: localPeriod.end_date || '' };
        return { start: periodRange?.start_date || '', end: periodRange?.end_date || '' };
    }, [localPeriod, periodRange]);

    // Open sale from query param ?sale=<id>
    useEffect(() => {
        const id = searchParams.get('sale');
        if (id) setSelectedSaleId(parseInt(id, 10));
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Debounce search → reset to page 1
    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPagination(p => ({ ...p, page: 1 }));
        }, 400);
        return () => clearTimeout(t);
    }, [searchTerm]);

    // Reset page on filter/tab change
    useEffect(() => {
        setPagination(p => ({ ...p, page: 1 }));
    }, [activeTab, paymentStatus, paymentMethod, activeDateRange.start, activeDateRange.end]);

    // ── fetch ─────────────────────────────────────────────────────────────────
    const fetchSales = useCallback(async () => {
        setLoading(true);
        try {
            if (activeTab === 'pending') {
                const res = await api.get('/sales/pending-confirmations');
                const rows = res.data || [];
                setSales(rows);
                setPagination({ page: 1, limit: rows.length || 20, total: rows.length, totalPages: 1 });
            } else {
                const params = {
                    page: pagination.page,
                    limit: pagination.limit,
                    ...(activeTab === 'cancelled' ? { reversedOnly: 'true' } : {}),
                    ...(debouncedSearch ? { search: debouncedSearch } : {}),
                    ...(paymentStatus  ? { paymentStatus }  : {}),
                    ...(paymentMethod  ? { paymentMethod }  : {}),
                    ...(activeDateRange.start ? { startDate: activeDateRange.start } : {}),
                    ...(activeDateRange.end   ? { endDate:   activeDateRange.end }   : {}),
                };
                const data = await salesAPI.getSales(params);
                setSales(data.sales || []);
                setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to load sales');
        } finally {
            setLoading(false);
        }
    }, [activeTab, pagination.page, pagination.limit, debouncedSearch, paymentStatus, paymentMethod, activeDateRange.start, activeDateRange.end]);

    useEffect(() => { fetchSales(); }, [fetchSales]);

    // ── action handlers ───────────────────────────────────────────────────────
    const handleReverse = async (e, sale) => {
        e.stopPropagation();
        // eslint-disable-next-line no-alert
        const reason = window.prompt(`Reason for reversing ${sale.sale_number}?`);
        if (reason === null) return;
        if (!reason.trim()) { toast.error('Reversal reason is required'); return; }
        try {
            await salesAPI.reverseSale(sale.id, reason.trim());
            toast.success('Sale reversed successfully');
            fetchSales();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to reverse sale');
        }
    };

    const handleUnreverse = async (e, sale) => {
        e.stopPropagation();
        // eslint-disable-next-line no-alert
        if (!window.confirm(`Reactivate sale ${sale.sale_number}? This will deduct stock again.`)) return;
        try {
            await salesAPI.unreverseSale(sale.id);
            toast.success('Sale reactivated');
            fetchSales();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to reactivate sale');
        }
    };

    const clearFilters = () => {
        setSearchTerm('');
        setPaymentStatus('');
        setPaymentMethod('');
        setLocalPeriod(null);
        setPagination(p => ({ ...p, page: 1 }));
    };

    const switchTab = (tab) => {
        setActiveTab(tab);
        clearFilters();
    };

    // Pending tab status counts
    const pendingStats = useMemo(() => {
        if (activeTab !== 'pending') return null;
        return {
            reversed: sales.filter(s => s.is_reversed).length,
            onHold:   sales.filter(s => s.status === 'On Hold').length,
            pending:  sales.filter(s => !s.is_reversed && s.status !== 'On Hold').length,
        };
    }, [sales, activeTab]);

    // ─── render ───────────────────────────────────────────────────────────────
    return (
        <div className="space-y-5 max-w-[1700px] mx-auto pb-10">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-black text-theme-primary tracking-tight">Sales</h1>
                    <p className="text-xs text-theme-muted mt-0.5 uppercase font-bold tracking-widest">Transaction Management</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <PeriodFilter
                        storageKey="sales_page"
                        onChange={(range) => {
                            setLocalPeriod(range?.isGlobal ? null : range);
                            setPagination(p => ({ ...p, page: 1 }));
                        }}
                        compact
                    />
                    <button
                        onClick={() => navigate('/pos')}
                        className="flex items-center gap-2 px-4 py-2 bg-accent-gold text-white rounded-lg hover:bg-accent-goldDark transition text-sm font-semibold shadow-sm shadow-accent-gold/20"
                    >
                        <Plus className="w-4 h-4" />
                        New Sale
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-0 border-b border-theme overflow-x-auto">
                {[
                    { key: 'all',       label: 'All Sales' },
                    { key: 'pending',   label: 'Pending Confirmations', adminOnly: true },
                    { key: 'cancelled', label: 'Cancelled / Reversed' },
                ].filter(t => !t.adminOnly || isAdmin).map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => switchTab(tab.key)}
                        className={`pb-3 px-4 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px ${
                            activeTab === tab.key
                                ? 'border-accent-gold text-accent-gold'
                                : 'border-transparent text-theme-muted hover:text-theme-primary'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Pending summary cards */}
            {activeTab === 'pending' && !loading && pendingStats && (
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Reversed',      count: pendingStats.reversed, Icon: XCircle,       color: 'text-red-500',    bg: 'bg-red-50 dark:bg-red-900/20' },
                        { label: 'On Hold',        count: pendingStats.onHold,   Icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
                        { label: 'Pending Review', count: pendingStats.pending,  Icon: Clock,         color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20' },
                    ].map(({ label, count, Icon, color, bg }) => (
                        <div key={label} className="bg-theme-secondary rounded-xl border border-theme p-4 flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                                <Icon className={`w-5 h-5 ${color}`} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-theme-primary">{count}</p>
                                <p className="text-xs text-theme-muted">{label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Filters (All + Cancelled tabs) */}
            {activeTab !== 'pending' && (
                <div className="bg-theme-secondary rounded-xl border border-theme p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search receipt # or customer…"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className={`${inputCls} pl-9`}
                            />
                        </div>
                        <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)} className={selectCls}>
                            <option value="">All Statuses</option>
                            <option value="paid">Fully Paid</option>
                            <option value="partial">Partial Payment</option>
                            <option value="credit">Credit</option>
                        </select>
                        <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className={selectCls}>
                            <option value="">All Methods</option>
                            <option value="cash">Cash</option>
                            <option value="transfer">Transfer</option>
                            <option value="pos">POS</option>
                            <option value="card">Card</option>
                            <option value="credit">Credit</option>
                        </select>
                        <button
                            onClick={clearFilters}
                            className="px-4 py-2 text-sm font-medium bg-theme-primary border border-theme rounded-lg text-theme-muted hover:text-theme-primary hover:bg-theme-tertiary transition"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-10 h-10 border-4 border-theme border-t-accent-gold rounded-full animate-spin" />
                        <p className="text-sm text-theme-muted">Loading sales…</p>
                    </div>
                ) : sales.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <ShoppingBag className="w-12 h-12 text-theme-muted opacity-30" />
                        <div className="text-center">
                            <p className="font-bold text-theme-primary">No sales found</p>
                            <p className="text-sm text-theme-muted mt-1">
                                {activeTab === 'pending'   ? 'No sales require confirmation.' :
                                 activeTab === 'cancelled' ? 'No cancelled or reversed sales.' :
                                 'Try adjusting your filters or date range.'}
                            </p>
                        </div>
                        {activeTab === 'all' && (
                            <button
                                onClick={() => navigate('/pos')}
                                className="flex items-center gap-2 px-4 py-2 bg-accent-gold text-white rounded-lg hover:bg-accent-goldDark transition text-sm font-semibold mt-2"
                            >
                                <Plus className="w-4 h-4" /> Create First Sale
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[680px]">
                                <thead>
                                    <tr className="bg-theme-tertiary border-b border-theme">
                                        <th className="px-4 py-3 text-left text-[10px] font-bold text-theme-muted uppercase tracking-wider">Receipt #</th>
                                        <th className="px-4 py-3 text-left text-[10px] font-bold text-theme-muted uppercase tracking-wider">Date</th>
                                        <th className="px-4 py-3 text-left text-[10px] font-bold text-theme-muted uppercase tracking-wider">Customer</th>
                                        <th className="px-4 py-3 text-left text-[10px] font-bold text-theme-muted uppercase tracking-wider">Details</th>
                                        <th className="px-4 py-3 text-right text-[10px] font-bold text-theme-muted uppercase tracking-wider">Amount</th>
                                        <th className="px-4 py-3 text-center text-[10px] font-bold text-theme-muted uppercase tracking-wider">Payment</th>
                                        <th className="px-4 py-3 text-center text-[10px] font-bold text-theme-muted uppercase tracking-wider">Status</th>
                                        {isAdmin && <th className="px-4 py-3 text-center text-[10px] font-bold text-theme-muted uppercase tracking-wider">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-theme">
                                    {sales.map(sale => {
                                        const isReversed = !!sale.reversed_at;
                                        const ps = sale.payment_status ||
                                            (isReversed ? 'cancelled' :
                                             parseFloat(sale.amount_paid) >= parseFloat(sale.total_amount) ? 'paid' :
                                             parseFloat(sale.amount_paid) > 0 ? 'partial' : 'credit');
                                        const psCfg = PAYMENT_STATUS_CFG[ps] || PAYMENT_STATUS_CFG.credit;
                                        const method = (sale.payment_method || '').toLowerCase();
                                        const methodCls = METHOD_BADGE_CLS[method] || 'bg-theme-tertiary text-theme-muted';

                                        return (
                                            <tr
                                                key={sale.id}
                                                onClick={() => setSelectedSaleId(sale.id)}
                                                className="hover:bg-theme-tertiary/50 transition-colors cursor-pointer"
                                            >
                                                <td className="px-4 py-3">
                                                    <p className="font-mono text-sm font-semibold text-theme-primary">{sale.sale_number}</p>
                                                    {sale.branch_name && (
                                                        <p className="text-[10px] text-theme-muted mt-0.5">{sale.branch_name}</p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="text-sm text-theme-primary">
                                                        {format(new Date(sale.created_at), 'dd MMM yyyy')}
                                                    </p>
                                                    <p className="text-[10px] text-theme-muted">
                                                        {format(new Date(sale.created_at), 'HH:mm')}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="text-sm font-medium text-theme-primary">
                                                        {sale.customer_name || 'Walk-in'}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="text-sm text-theme-muted">
                                                        {sale.total_items != null ? sale.total_items : '—'}{' '}
                                                        {sale.total_items === 1 ? 'item' : 'items'}
                                                    </p>
                                                    {sale.salesperson && (
                                                        <p className="text-[10px] text-theme-muted">{sale.salesperson}</p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <p className="font-bold text-accent-gold">
                                                        {cs}{parseFloat(sale.total_amount || 0).toLocaleString()}
                                                    </p>
                                                    {parseFloat(sale.amount_paid) > 0 &&
                                                     parseFloat(sale.amount_paid) !== parseFloat(sale.total_amount) && (
                                                        <p className="text-[10px] text-theme-muted">
                                                            Paid: {cs}{parseFloat(sale.amount_paid).toLocaleString()}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${methodCls}`}>
                                                        {sale.payment_method || '—'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {activeTab === 'pending' ? (
                                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                            isReversed          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                            sale.status === 'On Hold' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                                                                  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                        }`}>
                                                            {isReversed ? 'Reversed' : sale.status === 'On Hold' ? 'On Hold' : 'Pending'}
                                                        </span>
                                                    ) : (
                                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${psCfg.cls}`}>
                                                            {psCfg.label}
                                                        </span>
                                                    )}
                                                </td>
                                                {isAdmin && (
                                                    <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                                                        {!isReversed ? (
                                                            <button
                                                                onClick={(e) => handleReverse(e, sale)}
                                                                title="Reverse sale"
                                                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                                                            >
                                                                <RotateCcw className="w-3 h-3" />
                                                                Reverse
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={(e) => handleUnreverse(e, sale)}
                                                                title="Reactivate sale"
                                                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition"
                                                            >
                                                                <RefreshCw className="w-3 h-3" />
                                                                Reactivate
                                                            </button>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="px-4 py-3 border-t border-theme flex flex-col sm:flex-row items-center justify-between gap-3 bg-theme-tertiary/30">
                                <p className="text-xs text-theme-muted">
                                    Showing {((pagination.page - 1) * pagination.limit) + 1}–
                                    {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} sales
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                        disabled={pagination.page === 1}
                                        className="p-1.5 rounded-lg border border-theme bg-theme-primary text-theme-muted hover:text-theme-primary hover:bg-theme-tertiary transition disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="text-xs text-theme-muted px-2">
                                        Page {pagination.page} of {pagination.totalPages}
                                    </span>
                                    <button
                                        onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                        disabled={pagination.page >= pagination.totalPages}
                                        className="p-1.5 rounded-lg border border-theme bg-theme-primary text-theme-muted hover:text-theme-primary hover:bg-theme-tertiary transition disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Sale Detail Modal */}
            {selectedSaleId && (
                <SaleDetailModal
                    saleId={selectedSaleId}
                    onClose={() => setSelectedSaleId(null)}
                    onReverse={fetchSales}
                />
            )}
        </div>
    );
};

export default SalesListPage;
