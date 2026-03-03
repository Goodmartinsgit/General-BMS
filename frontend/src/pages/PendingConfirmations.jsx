import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, ShieldCheck, XCircle, AlertTriangle, Clock, User, RotateCcw, Calendar, CreditCard } from 'lucide-react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import PageHeader from '../components/common/PageHeader';

const PendingConfirmations = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchPendingConfirmations();
    }, []);

    const fetchPendingConfirmations = async () => {
        setLoading(true);
        try {
            const response = await api.get('/sales/pending-confirmations');
            setSales(response.data);
        } catch (error) {
            console.error('Error fetching pending confirmations:', error);
            toast.error('Failed to load pending confirmations');
        } finally {
            setLoading(false);
        }
    };

    const filteredSales = sales.filter(sale =>
        sale.sale_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sale.customer_name && sale.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (sale.reversed_by_name && sale.reversed_by_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getStatusConfig = (sale) => {
        if (sale.is_reversed) return {
            label: 'Reversed',
            icon: XCircle,
            bg: 'bg-red-50 dark:bg-red-900/30',
            text: 'text-red-600 dark:text-red-400',
            border: 'border-red-100 dark:border-red-800'
        };
        if (sale.status === 'On Hold') return {
            label: 'On Hold',
            icon: AlertTriangle,
            bg: 'bg-orange-50 dark:bg-orange-900/30',
            text: 'text-orange-600 dark:text-orange-400',
            border: 'border-orange-100 dark:border-orange-800'
        };
        return {
            label: 'Pending',
            icon: Clock,
            bg: 'bg-blue-50 dark:bg-blue-900/30',
            text: 'text-blue-600 dark:text-blue-400',
            border: 'border-blue-100 dark:border-blue-800'
        };
    };

    const actions = (
        <button
            onClick={fetchPendingConfirmations}
            className="flex items-center gap-2 bg-accent-gold text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-accent-goldDark transition"
        >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
        </button>
    );

    return (
        <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
            <PageHeader
                title="Pending Confirmations"
                subtitle="Sales transactions requiring review and action"
                badge={`${sales.length} Pending`}
                icon={ShieldCheck}
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center border border-red-100 dark:border-red-800">
                            <XCircle className="w-6 h-6 text-red-500" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-theme-primary">{sales.filter(s => s.is_reversed).length}</div>
                            <div className="text-xs font-medium text-theme-muted">Reversed Sales</div>
                        </div>
                    </div>
                    <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center border border-orange-100 dark:border-orange-800">
                            <AlertTriangle className="w-6 h-6 text-orange-500" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-theme-primary">{sales.filter(s => s.status === 'On Hold').length}</div>
                            <div className="text-xs font-medium text-theme-muted">On Hold</div>
                        </div>
                    </div>
                    <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center border border-blue-100 dark:border-blue-800">
                            <Clock className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-theme-primary">
                                {sales.filter(s => !s.is_reversed && s.status !== 'On Hold').length}
                            </div>
                            <div className="text-xs font-medium text-theme-muted">Pending Review</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            {loading ? (
                <div className="bg-theme-secondary p-20 text-center rounded-lg shadow-theme-sm border border-theme">
                    <div className="w-12 h-12 border-4 border-theme-muted border-t-accent-gold rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-theme-muted text-sm">Loading confirmations...</p>
                </div>
            ) : filteredSales.length === 0 ? (
                <div className="bg-theme-secondary p-20 text-center rounded-lg shadow-theme-sm border-2 border-dashed border-theme">
                    <ShieldCheck className="mx-auto text-theme-muted mb-4" size={48} />
                    <p className="font-bold text-theme-primary text-lg">All Clear</p>
                    <p className="text-theme-muted text-sm mt-1">No sales require confirmation at this time</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSales.map(sale => {
                        const status = getStatusConfig(sale);
                        const StatusIcon = status.icon;

                        return (
                            <div
                                key={sale.id}
                                onClick={() => navigate(`/sales/${sale.id}`)}
                                className="bg-theme-secondary rounded-2xl shadow-theme-sm overflow-hidden border border-theme hover:shadow-theme-md transition-all group cursor-pointer"
                            >
                                <div className="p-6">
                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border ${status.bg} ${status.text} ${status.border}`}>
                                                {status.label}
                                            </span>
                                            <p className="text-xs font-mono text-theme-muted bg-theme-primary px-2 py-0.5 rounded-md inline-block mt-2 border border-theme">
                                                {sale.sale_number}
                                            </p>
                                        </div>
                                        <StatusIcon className={`w-5 h-5 ${status.text}`} />
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
                                    {sale.is_reversed && (
                                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
                                            <div className="flex items-center gap-2 mb-1">
                                                <RotateCcw className="w-3 h-3 text-red-500" />
                                                <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase">Transaction Reversed</span>
                                            </div>
                                            {sale.reversed_by_name && (
                                                <div className="text-xs text-red-500 dark:text-red-400 font-medium">
                                                    By {sale.reversed_by_name}
                                                    {sale.reversed_at && ` • ${format(new Date(sale.reversed_at), 'MMM dd, HH:mm')}`}
                                                </div>
                                            )}
                                            {sale.reversal_reason && (
                                                <div className="text-xs text-theme-muted mt-1 truncate">
                                                    Reason: {sale.reversal_reason}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Amount & Payment */}
                                    <div className="flex items-center justify-between pt-4 border-t border-theme">
                                        <div className="flex items-center gap-1.5 text-xs text-theme-muted">
                                            <CreditCard className="w-3 h-3" />
                                            <span className="uppercase font-medium">{sale.payment_method}</span>
                                        </div>
                                        <div className="text-lg font-bold text-accent-gold">
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
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default PendingConfirmations;
