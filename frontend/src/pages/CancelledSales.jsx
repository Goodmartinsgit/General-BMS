import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, XCircle, RotateCcw, Calendar, User, CreditCard, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import PageHeader from '../components/common/PageHeader';

const CancelledSales = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchCancelledSales();
    }, []);

    const fetchCancelledSales = async () => {
        setLoading(true);
        try {
            const response = await api.get('/sales/cancelled');
            setSales(response.data);
        } catch (error) {
            console.error('Error fetching cancelled sales:', error);
            toast.error('Failed to load cancelled sales');
        } finally {
            setLoading(false);
        }
    };

    const filteredSales = sales.filter(sale =>
        sale.sale_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sale.customer_name && sale.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (sale.reversed_by_name && sale.reversed_by_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const totalAmount = filteredSales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0);

    const actions = (
        <button
            onClick={fetchCancelledSales}
            className="flex items-center gap-2 bg-accent-gold text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-accent-goldDark transition"
        >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
        </button>
    );

    return (
        <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
            <PageHeader
                title="Cancelled Sales"
                subtitle="Reversed and cancelled transactions"
                badge={`${sales.length} Cancelled`}
                icon={XCircle}
                actions={actions}
            />

            {/* Search Bar */}
            <div className="bg-theme-secondary p-4 rounded-lg border border-theme shadow-theme-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-grow w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted w-5 h-5 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search by sale number, customer, or staff name..."
                        className="w-full pl-10 pr-4 py-2.5 bg-theme-primary border border-theme rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all text-sm text-theme-primary placeholder-theme-muted"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Stats Summary */}
            {!loading && sales.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center border border-red-100 dark:border-red-800">
                            <XCircle className="w-6 h-6 text-red-500" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-theme-primary">{filteredSales.length}</div>
                            <div className="text-xs font-medium text-theme-muted">Total Cancelled</div>
                        </div>
                    </div>
                    <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center border border-orange-100 dark:border-orange-800">
                            <AlertCircle className="w-6 h-6 text-orange-500" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-theme-primary">&#8358;{totalAmount.toLocaleString()}</div>
                            <div className="text-xs font-medium text-theme-muted">Total Amount</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            {loading ? (
                <div className="bg-theme-secondary p-20 text-center rounded-lg shadow-theme-sm border border-theme">
                    <div className="w-12 h-12 border-4 border-theme-muted border-t-accent-gold rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-theme-muted text-sm">Loading cancelled sales...</p>
                </div>
            ) : filteredSales.length === 0 ? (
                <div className="bg-theme-secondary p-20 text-center rounded-lg shadow-theme-sm border-2 border-dashed border-theme">
                    <XCircle className="mx-auto text-theme-muted mb-4" size={48} />
                    <p className="font-bold text-theme-primary text-lg">No Cancelled Sales</p>
                    <p className="text-theme-muted text-sm mt-1">No transactions have been reversed</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSales.map(sale => (
                        <div
                            key={sale.id}
                            onClick={() => navigate(`/sales/${sale.id}`)}
                            className="bg-theme-secondary rounded-2xl shadow-theme-sm overflow-hidden border border-theme hover:shadow-theme-md transition-all group cursor-pointer"
                        >
                            <div className="p-6">
                                {/* Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800">
                                            Cancelled
                                        </span>
                                        <p className="text-xs font-mono text-theme-muted bg-theme-primary px-2 py-0.5 rounded-md inline-block mt-2 border border-theme">
                                            {sale.sale_number}
                                        </p>
                                    </div>
                                    <XCircle className="w-5 h-5 text-red-500" />
                                </div>

                                {/* Customer Info */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-lg bg-accent-gold/10 flex items-center justify-center text-accent-gold border border-accent-gold/20">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-semibold text-theme-primary text-sm truncate">
                                            {sale.customer_name || 'Walk-in Customer'}
                                        </div>
                                        <div className="text-xs text-theme-muted flex items-center gap-1.5 mt-0.5">
                                            <Calendar className="w-3 h-3" />
                                            {format(new Date(sale.created_at), 'MMM dd, yyyy • HH:mm')}
                                        </div>
                                    </div>
                                </div>

                                {/* Reversal Info */}
                                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
                                    <div className="flex items-center gap-2 mb-1">
                                        <RotateCcw className="w-3 h-3 text-red-500" />
                                        <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase">Reversed Transaction</span>
                                    </div>
                                    {sale.reversed_by_name && (
                                        <div className="text-xs text-red-500 dark:text-red-400 font-medium">
                                            By {sale.reversed_by_name}
                                            {sale.reversed_at && ` • ${format(new Date(sale.reversed_at), 'MMM dd, HH:mm')}`}
                                        </div>
                                    )}
                                    {sale.reversal_reason && (
                                        <div className="text-xs text-theme-muted mt-1 line-clamp-2">
                                            Reason: {sale.reversal_reason}
                                        </div>
                                    )}
                                </div>

                                {/* Amount & Payment */}
                                <div className="flex items-center justify-between pt-4 border-t border-theme">
                                    <div className="flex items-center gap-1.5 text-xs text-theme-muted">
                                        <CreditCard className="w-3 h-3" />
                                        <span className="uppercase font-medium">{sale.payment_method}</span>
                                    </div>
                                    <div className="text-lg font-bold text-red-500">
                                        &#8358;{parseFloat(sale.total_amount).toLocaleString()}
                                    </div>
                                </div>

                                {/* Salesperson */}
                                {sale.salesperson && (
                                    <div className="mt-3 pt-3 border-t border-theme flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-theme-primary flex items-center justify-center border border-theme">
                                            <User className="w-3 h-3 text-theme-muted" />
                                        </div>
                                        <span className="text-xs font-medium text-theme-secondary truncate">{sale.salesperson}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CancelledSales;
