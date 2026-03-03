import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { FileText, Plus, Search, RefreshCw, Calendar, User, DollarSign, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import QuotationForm from '../components/quotations/QuotationForm';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import { toast } from 'react-toastify';

const QuotationsDashboard = () => {
    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchQuotations();
    }, []);

    const fetchQuotations = async () => {
        setLoading(true);
        try {
            const res = await api.get('/quotations');
            setQuotations(res.data);
        } catch (error) {
            console.error('Error fetching quotations:', error);
            toast.error('Failed to load quotations');
        } finally {
            setLoading(false);
        }
    };

    const filteredQuotations = quotations.filter(q =>
        q.quotation_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusConfig = (status) => {
        switch (status) {
            case 'Pending':
                return {
                    bg: 'bg-blue-50 dark:bg-blue-900/30',
                    text: 'text-blue-600 dark:text-blue-400',
                    border: 'border-blue-100 dark:border-blue-800'
                };
            case 'Converted':
                return {
                    bg: 'bg-emerald-50 dark:bg-emerald-900/30',
                    text: 'text-emerald-600 dark:text-emerald-400',
                    border: 'border-emerald-100 dark:border-emerald-800'
                };
            case 'Expired':
                return {
                    bg: 'bg-red-50 dark:bg-red-900/30',
                    text: 'text-red-600 dark:text-red-400',
                    border: 'border-red-100 dark:border-red-800'
                };
            case 'Cancelled':
                return {
                    bg: 'bg-gray-50 dark:bg-gray-900/30',
                    text: 'text-gray-600 dark:text-gray-400',
                    border: 'border-gray-100 dark:border-gray-800'
                };
            default:
                return {
                    bg: 'bg-gray-50 dark:bg-gray-900/30',
                    text: 'text-gray-600 dark:text-gray-400',
                    border: 'border-gray-100 dark:border-gray-800'
                };
        }
    };

    const actions = (
        <>
            <button
                onClick={fetchQuotations}
                className="bg-theme-secondary border border-theme text-theme-secondary px-4 py-2 rounded-lg font-medium text-sm hover:bg-theme-tertiary transition flex items-center gap-2"
            >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button
                onClick={() => setIsModalOpen(true)}
                className="bg-accent-gold text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-accent-goldDark transition flex items-center gap-2"
            >
                <Plus className="w-4 h-4" /> Create Quote
            </button>
        </>
    );

    return (
        <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
            <PageHeader
                title="Quotations"
                subtitle="Generate quotes and convert them into sales"
                badge={`${quotations.length} Total`}
                icon={FileText}
                actions={actions}
            />

            {/* Search Bar */}
            <div className="bg-theme-secondary p-4 rounded-lg border border-theme shadow-theme-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-grow w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted w-5 h-5 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search by quote number or customer name..."
                        className="w-full pl-10 pr-4 py-2.5 bg-theme-primary border border-theme rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all text-sm text-theme-primary placeholder-theme-muted"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="bg-theme-secondary p-20 text-center rounded-lg shadow-theme-sm border border-theme">
                    <div className="w-12 h-12 border-4 border-theme-muted border-t-accent-gold rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-theme-muted text-sm">Loading quotations...</p>
                </div>
            ) : filteredQuotations.length === 0 ? (
                <div className="bg-theme-secondary p-20 text-center rounded-lg shadow-theme-sm border-2 border-dashed border-theme">
                    <FileText className="mx-auto text-theme-muted mb-4" size={48} />
                    <p className="font-bold text-theme-primary text-lg">No Quotations Found</p>
                    <p className="text-theme-muted text-sm mt-1">Create your first quotation to get started</p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="mt-4 bg-accent-gold text-white px-6 py-2 rounded-lg font-semibold text-sm hover:bg-accent-goldDark transition inline-flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Create Quote
                    </button>
                </div>
            ) : (
                <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-theme-primary border-b border-theme">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-theme-muted uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-theme-muted uppercase tracking-wider">Quote Number</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-theme-muted uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-theme-muted uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-theme-muted uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-theme-muted uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-theme">
                                {filteredQuotations.map(q => {
                                    const statusConfig = getStatusConfig(q.status);
                                    return (
                                        <tr key={q.id} className="hover:bg-theme-primary transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-theme-secondary">
                                                    <Calendar className="w-4 h-4 text-theme-muted" />
                                                    {format(new Date(q.created_at), 'dd MMM yyyy')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-mono font-semibold text-accent-gold">
                                                    {q.quotation_number}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-accent-gold/10 flex items-center justify-center text-accent-gold border border-accent-gold/20">
                                                        <User className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-sm font-medium text-theme-primary">{q.customer_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-sm font-semibold text-theme-primary">
                                                    <DollarSign className="w-4 h-4 text-theme-muted" />
                                                    &#8358;{parseFloat(q.total_amount).toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                                                    {q.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => navigate(`/quotations/${q.id}`)}
                                                    className="flex items-center gap-1 text-accent-gold font-semibold text-xs hover:underline"
                                                >
                                                    View <ArrowRight className="w-3 h-3" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <QuotationForm
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchQuotations}
            />
        </div>
    );
};

export default QuotationsDashboard;
