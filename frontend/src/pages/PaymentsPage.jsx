import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { CreditCard, Search, FileText, ArrowRight, CheckCircle2, AlertCircle, Download, DollarSign, ShoppingBag, Package } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import PeriodFilter from '../components/common/PeriodFilter';
import { useCurrency } from '../context/CurrencyContext';

const PaymentsPage = () => {
    const { formatCurrency } = useCurrency();
    const [allocations, setAllocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState(null);

    useEffect(() => {
        fetchAllocations();
    }, [dateRange]);

    const fetchAllocations = async () => {
        try {
            const params = {};
            if (dateRange?.start_date) params.start_date = dateRange.start_date;
            if (dateRange?.end_date) params.end_date = dateRange.end_date;
            const res = await api.get('/payments/allocations', { params });
            setAllocations(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handlePeriodChange = useCallback((range) => {
        setDateRange(range);
    }, []);

    const filteredAllocations = allocations.filter(alloc =>
        (alloc.sale_number?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (alloc.order_number?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const totalSalesAllocation = allocations.filter(a => a.sale_id).reduce((sum, a) => sum + parseFloat(a.amount), 0);
    const totalWholesaleAllocation = allocations.filter(a => a.wholesale_order_id).reduce((sum, a) => sum + parseFloat(a.amount), 0);
    const totalAllocated = totalSalesAllocation + totalWholesaleAllocation;

    const actions = (
        <div className="flex items-center gap-2">
            <PeriodFilter storageKey="payments" onChange={handlePeriodChange} />
            <button className="bg-theme-secondary border border-theme text-theme-secondary px-4 py-2 rounded-lg font-medium text-sm hover:bg-theme-tertiary transition flex items-center gap-2">
                <Download size={16} /> Export
            </button>
        </div>
    );

    return (
        <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
            <PageHeader
                title="Payment Allocations"
                subtitle="Track how payments are distributed across sales and orders"
                badge={`${allocations.length} Allocations`}
                icon={CreditCard}
                actions={actions}
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-lg">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-theme-muted font-medium">Total Allocated</div>
                        <div className="text-2xl font-semibold text-theme-primary">
                            {formatCurrency(totalAllocated)}
                        </div>
                    </div>
                </div>
                <div className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg">
                        <ShoppingBag size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-theme-muted font-medium">Retail Sales</div>
                        <div className="text-2xl font-semibold text-theme-primary">
                            {formatCurrency(totalSalesAllocation)}
                        </div>
                    </div>
                </div>
                <div className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 rounded-lg">
                        <Package size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-theme-muted font-medium">Wholesale Orders</div>
                        <div className="text-2xl font-semibold text-theme-primary">
                            {formatCurrency(totalWholesaleAllocation)}
                        </div>
                    </div>
                </div>
                <div className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 rounded-lg">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-theme-muted font-medium">Total Transactions</div>
                        <div className="text-2xl font-semibold text-theme-primary">{allocations.length}</div>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-theme-secondary p-4 rounded-lg border border-theme shadow-theme-sm">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted w-5 h-5 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search by sale number or order number..."
                        className="w-full pl-10 pr-4 py-2.5 bg-theme-primary border border-theme rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all text-sm text-theme-primary placeholder-theme-muted"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Allocations Table */}
            <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-theme-primary border-b border-theme">
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Reference</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Type</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Allocated Amount</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Date</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-theme">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="5" className="px-6 py-6">
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
                            ) : filteredAllocations.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-theme-tertiary rounded-full flex items-center justify-center text-theme-muted">
                                                <CreditCard size={32} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-theme-primary text-lg">No payment allocations found</p>
                                                <p className="text-theme-muted text-sm mt-1">Try adjusting your search or check back later.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredAllocations.map(alloc => (
                                    <tr key={alloc.id} className="hover:bg-theme-primary transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-accent-gold/10 text-accent-gold rounded-lg flex items-center justify-center border border-accent-gold/20">
                                                    <FileText size={18} />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-theme-primary text-sm">
                                                        {alloc.sale_number || alloc.order_number || 'N/A'}
                                                    </div>
                                                    <div className="text-xs text-theme-muted mt-0.5">
                                                        Payment #{alloc.id}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {alloc.sale_id ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                                                    Retail Sale
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
                                                    Wholesale Order
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                                                {formatCurrency(alloc.amount)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-theme-primary">{new Date(alloc.allocated_at).toLocaleDateString()}</div>
                                            <div className="text-xs text-theme-muted">{new Date(alloc.allocated_at).toLocaleTimeString()}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-theme-muted hover:text-accent-gold transition-colors p-1.5 rounded-lg hover:bg-theme-tertiary">
                                                <ArrowRight size={18} />
                                            </button>
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

export default PaymentsPage;
