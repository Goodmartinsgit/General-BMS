import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { FileText, Search, Plus, Calendar, Edit, Trash2, Download, DollarSign, CreditCard, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import PageHeader from '../components/common/PageHeader';
import InvoiceFormModal from '../components/InvoiceFormModal';
import InvoicePaymentModal from '../components/InvoicePaymentModal';
import { useCurrency } from '../context/CurrencyContext';

const InvoicesPage = () => {
    const { formatCurrency } = useCurrency();
    const [invoices, setInvoices] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [customerFilter, setCustomerFilter] = useState('');
    const [paymentModal, setPaymentModal] = useState({ open: false, invoice: null });

    useEffect(() => {
        fetchInvoices();
        fetchCustomers();
    }, [statusFilter, customerFilter]);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const params = {};
            if (statusFilter) params.status = statusFilter;
            if (customerFilter) params.customer_id = customerFilter;
            const response = await api.get('/invoices', { params });
            setInvoices(response.data);
        } catch (error) {
            console.error('Error fetching invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomers = async () => {
        try {
            const response = await api.get('/customers');
            setCustomers(response.data);
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    };

    const handleAddInvoice = () => {
        setEditingInvoice(null);
        setIsModalOpen(true);
    };

    const handleEditInvoice = (invoice) => {
        setEditingInvoice(invoice);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this invoice?')) {
            try {
                await api.delete(`/invoices/${id}`);
                fetchInvoices();
            } catch (error) {
                alert(error.response?.data?.message || 'Failed to delete invoice');
            }
        }
    };

    const handleWriteOff = async (invoice) => {
        const balance = parseFloat(invoice.total_amount || 0) - parseFloat(invoice.amount_paid || 0);
        if (window.confirm(`Write off ${formatCurrency(balance)} for invoice ${invoice.invoice_number}?`)) {
            try {
                await api.post(`/invoices/${invoice.id}/write-off`);
                fetchInvoices();
            } catch (error) {
                alert(error.response?.data?.message || 'Failed to write off invoice');
            }
        }
    };

    const handleModalSubmit = async (formData) => {
        try {
            if (editingInvoice) {
                await api.put(`/invoices/${editingInvoice.id}`, formData);
            } else {
                await api.post('/invoices', formData);
            }
            setIsModalOpen(false);
            fetchInvoices();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to save invoice');
        }
    };

    const handlePaymentSubmit = async (paymentData) => {
        try {
            await api.post(`/invoices/${paymentModal.invoice.id}/payments`, paymentData);
            setPaymentModal({ open: false, invoice: null });
            fetchInvoices();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to record payment');
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'draft': return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300';
            case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300';
            case 'partially_paid': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300';
            case 'paid': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300';
            case 'overdue': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300';
            case 'cancelled': return 'bg-gray-100 text-gray-500 dark:bg-gray-900/20 dark:text-gray-400';
            case 'written_off': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300';
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300';
        }
    };

    const formatStatus = (status) => {
        if (!status) return 'Draft';
        return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    const filteredInvoices = invoices.filter(inv =>
        inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalOutstanding = invoices.reduce((sum, inv) => {
        const balance = parseFloat(inv.total_amount || 0) - parseFloat(inv.amount_paid || 0);
        return sum + (balance > 0 ? balance : 0);
    }, 0);

    const overdueCount = invoices.filter(inv => inv.status === 'overdue').length;
    const totalRevenue = invoices.reduce((sum, inv) => sum + parseFloat(inv.amount_paid || 0), 0);

    const actions = (
        <>
            <button className="bg-theme-secondary border border-theme text-theme-secondary px-4 py-2 rounded-lg font-medium text-sm hover:bg-theme-tertiary transition flex items-center gap-2">
                <Download size={16} /> Export
            </button>
            <button
                onClick={handleAddInvoice}
                className="bg-accent-gold text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-accent-goldDark transition flex items-center gap-2"
            >
                <Plus className="w-4 h-4" /> New Invoice
            </button>
        </>
    );

    return (
        <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
            <PageHeader
                title="Invoices"
                subtitle="Manage accounts receivable and customer invoices"
                badge={`${invoices.length} Invoices`}
                icon={FileText}
                actions={actions}
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-lg">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-theme-muted font-medium">Total Received</div>
                        <div className="text-2xl font-semibold text-green-600 dark:text-green-400">{formatCurrency(totalRevenue)}</div>
                    </div>
                </div>
                <div className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 rounded-lg">
                        <FileText size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-theme-muted font-medium">Outstanding</div>
                        <div className="text-2xl font-semibold text-theme-primary">{formatCurrency(totalOutstanding)}</div>
                    </div>
                </div>
                <div className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-lg">
                        <Calendar size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-theme-muted font-medium">Overdue</div>
                        <div className="text-2xl font-semibold text-red-600 dark:text-red-400">{overdueCount}</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-theme-secondary p-4 rounded-lg border border-theme shadow-theme-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted w-5 h-5 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search by invoice number or customer..."
                            className="w-full pl-10 pr-4 py-2.5 bg-theme-primary border border-theme rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all text-sm text-theme-primary placeholder-theme-muted"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2.5 bg-theme-primary border border-theme rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none text-sm text-theme-primary"
                    >
                        <option value="">All Statuses</option>
                        <option value="draft">Draft</option>
                        <option value="pending">Pending</option>
                        <option value="partially_paid">Partially Paid</option>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="written_off">Written Off</option>
                    </select>
                    <select
                        value={customerFilter}
                        onChange={(e) => setCustomerFilter(e.target.value)}
                        className="px-3 py-2.5 bg-theme-primary border border-theme rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none text-sm text-theme-primary"
                    >
                        <option value="">All Customers</option>
                        {customers.map(c => (
                            <option key={c.id} value={c.id}>{c.customer_name || c.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-theme-primary border-b border-theme">
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Invoice #</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Customer</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Date</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Due Date</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase text-right">Total</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase text-right">Paid</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase text-right">Balance</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Status</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-theme">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="9" className="px-6 py-8">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-theme-tertiary rounded-lg"></div>
                                                <div className="space-y-2 flex-1">
                                                    <div className="w-48 h-4 bg-theme-tertiary rounded"></div>
                                                    <div className="w-32 h-3 bg-theme-tertiary rounded"></div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-theme-tertiary rounded-full flex items-center justify-center text-theme-muted">
                                                <FileText size={32} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-theme-primary text-lg">No invoices found</p>
                                                <p className="text-theme-muted text-sm mt-1">Try adjusting your filters or create a new invoice.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map((invoice) => {
                                    const balance = parseFloat(invoice.total_amount || 0) - parseFloat(invoice.amount_paid || 0);
                                    return (
                                        <tr key={invoice.id} className="hover:bg-theme-primary transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-mono font-semibold text-accent-gold">{invoice.invoice_number}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-theme-primary">{invoice.customer_name || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-theme-secondary">
                                                    <Calendar size={14} className="text-theme-muted" />
                                                    {invoice.invoice_date ? format(new Date(invoice.invoice_date), 'dd MMM yyyy') : '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-theme-secondary">
                                                    {invoice.due_date ? format(new Date(invoice.due_date), 'dd MMM yyyy') : '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-sm font-semibold text-theme-primary">{formatCurrency(invoice.total_amount || 0)}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-sm text-green-600 dark:text-green-400">{formatCurrency(invoice.amount_paid || 0)}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`text-sm font-semibold ${balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                                    {formatCurrency(balance)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${getStatusBadge(invoice.status)}`}>
                                                    {formatStatus(invoice.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {balance > 0 && invoice.status !== 'cancelled' && invoice.status !== 'draft' && invoice.status !== 'written_off' && (
                                                        <>
                                                            <button
                                                                onClick={() => setPaymentModal({ open: true, invoice })}
                                                                className="p-2 text-theme-muted hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition"
                                                                title="Record Payment"
                                                            >
                                                                <CreditCard size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleWriteOff(invoice)}
                                                                className="p-2 text-theme-muted hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition"
                                                                title="Write Off"
                                                            >
                                                                <XCircle size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => handleEditInvoice(invoice)}
                                                        className="p-2 text-theme-muted hover:text-accent-gold hover:bg-accent-gold/10 rounded-lg transition"
                                                        title="Edit Invoice"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(invoice.id)}
                                                        className="p-2 text-theme-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                                        title="Delete Invoice"
                                                    >
                                                        <Trash2 size={16} />
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
            </div>

            {/* Invoice Form Modal */}
            <InvoiceFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleModalSubmit}
                invoice={editingInvoice}
            />

            {/* Payment Modal */}
            <InvoicePaymentModal
                isOpen={paymentModal.open}
                onClose={() => setPaymentModal({ open: false, invoice: null })}
                onSubmit={handlePaymentSubmit}
                invoice={paymentModal.invoice}
            />
        </div>
    );
};

export default InvoicesPage;
