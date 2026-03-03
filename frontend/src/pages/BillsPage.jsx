import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { FileText, Search, Plus, Calendar, Edit, Trash2, Download, DollarSign, CreditCard, Eye } from 'lucide-react';
import { format } from 'date-fns';
import PageHeader from '../components/common/PageHeader';
import BillFormModal from '../components/BillFormModal';
import { useCurrency } from '../context/CurrencyContext';

const BillsPage = () => {
    const { formatCurrency } = useCurrency();
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBill, setEditingBill] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [paymentModal, setPaymentModal] = useState({ open: false, bill: null });
    const [paymentData, setPaymentData] = useState({ amount: '', payment_date: '', payment_method: 'bank_transfer', reference: '', notes: '' });

    useEffect(() => {
        fetchBills();
    }, [statusFilter, dateFrom, dateTo]);

    const fetchBills = async () => {
        try {
            setLoading(true);
            const params = {};
            if (statusFilter) params.status = statusFilter;
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo) params.date_to = dateTo;
            const response = await api.get('/bills', { params });
            setBills(response.data);
        } catch (error) {
            console.error('Error fetching bills:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddBill = () => {
        setEditingBill(null);
        setIsModalOpen(true);
    };

    const handleEditBill = (bill) => {
        setEditingBill(bill);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this bill?')) {
            try {
                await api.delete(`/bills/${id}`);
                fetchBills();
            } catch (error) {
                alert(error.response?.data?.message || 'Failed to delete bill');
            }
        }
    };

    const handleModalSubmit = async (formData) => {
        try {
            if (editingBill) {
                await api.put(`/bills/${editingBill.id}`, formData);
            } else {
                await api.post('/bills', formData);
            }
            setIsModalOpen(false);
            fetchBills();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to save bill');
        }
    };

    const openPaymentModal = (bill) => {
        const balanceDue = parseFloat(bill.total_amount || 0) - parseFloat(bill.amount_paid || 0);
        setPaymentData({
            amount: balanceDue.toFixed(2),
            payment_date: format(new Date(), 'yyyy-MM-dd'),
            payment_method: 'bank_transfer',
            reference: '',
            notes: ''
        });
        setPaymentModal({ open: true, bill });
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/bills/${paymentModal.bill.id}/payments`, {
                ...paymentData,
                amount: parseFloat(paymentData.amount)
            });
            setPaymentModal({ open: false, bill: null });
            fetchBills();
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
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300';
        }
    };

    const formatStatus = (status) => {
        if (!status) return 'Draft';
        return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    const filteredBills = bills.filter(b =>
        b.bill_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalOutstanding = bills.reduce((sum, b) => {
        const balance = parseFloat(b.total_amount || 0) - parseFloat(b.amount_paid || 0);
        return sum + (balance > 0 ? balance : 0);
    }, 0);

    const overdueCount = bills.filter(b => b.status === 'overdue').length;

    const actions = (
        <>
            <button className="bg-theme-secondary border border-theme text-theme-secondary px-4 py-2 rounded-lg font-medium text-sm hover:bg-theme-tertiary transition flex items-center gap-2">
                <Download size={16} /> Export
            </button>
            <button
                onClick={handleAddBill}
                className="bg-accent-gold text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-accent-goldDark transition flex items-center gap-2"
            >
                <Plus className="w-4 h-4" /> New Bill
            </button>
        </>
    );

    return (
        <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
            <PageHeader
                title="Bills"
                subtitle="Manage accounts payable and vendor bills"
                badge={`${bills.length} Bills`}
                icon={FileText}
                actions={actions}
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg">
                        <FileText size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-theme-muted font-medium">Total Bills</div>
                        <div className="text-2xl font-semibold text-theme-primary">{bills.length}</div>
                    </div>
                </div>
                <div className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 rounded-lg">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-theme-muted font-medium">Outstanding Balance</div>
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
                            placeholder="Search by bill number or vendor..."
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
                    </select>
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="px-3 py-2.5 bg-theme-primary border border-theme rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none text-sm text-theme-primary"
                        placeholder="From"
                    />
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="px-3 py-2.5 bg-theme-primary border border-theme rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none text-sm text-theme-primary"
                        placeholder="To"
                    />
                </div>
            </div>

            {/* Bills Table */}
            <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-theme-primary border-b border-theme">
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Bill #</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Vendor</th>
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
                            ) : filteredBills.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-theme-tertiary rounded-full flex items-center justify-center text-theme-muted">
                                                <FileText size={32} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-theme-primary text-lg">No bills found</p>
                                                <p className="text-theme-muted text-sm mt-1">Try adjusting your filters or create a new bill.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredBills.map((bill) => {
                                    const balance = parseFloat(bill.total_amount || 0) - parseFloat(bill.amount_paid || 0);
                                    return (
                                        <tr key={bill.id} className="hover:bg-theme-primary transition-colors group cursor-pointer">
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-mono font-semibold text-accent-gold">{bill.bill_number}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-theme-primary">{bill.vendor_name || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-theme-secondary">
                                                    <Calendar size={14} className="text-theme-muted" />
                                                    {bill.bill_date ? format(new Date(bill.bill_date), 'dd MMM yyyy') : '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-theme-secondary">
                                                    {bill.due_date ? format(new Date(bill.due_date), 'dd MMM yyyy') : '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-sm font-semibold text-theme-primary">{formatCurrency(bill.total_amount || 0)}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-sm text-green-600 dark:text-green-400">{formatCurrency(bill.amount_paid || 0)}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`text-sm font-semibold ${balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                                    {formatCurrency(balance)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${getStatusBadge(bill.status)}`}>
                                                    {formatStatus(bill.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {balance > 0 && bill.status !== 'cancelled' && bill.status !== 'draft' && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); openPaymentModal(bill); }}
                                                            className="p-2 text-theme-muted hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition"
                                                            title="Record Payment"
                                                        >
                                                            <CreditCard size={16} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleEditBill(bill); }}
                                                        className="p-2 text-theme-muted hover:text-accent-gold hover:bg-accent-gold/10 rounded-lg transition"
                                                        title="Edit Bill"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(bill.id); }}
                                                        className="p-2 text-theme-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                                        title="Delete Bill"
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

            {/* Bill Form Modal */}
            <BillFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleModalSubmit}
                bill={editingBill}
            />

            {/* Payment Modal */}
            {paymentModal.open && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-10">
                    <div className="bg-theme-secondary rounded-lg shadow-xl w-full max-w-md my-auto">
                        <div className="flex justify-between items-center p-4 border-b border-theme">
                            <h2 className="text-xl font-semibold text-theme-primary">Record Payment</h2>
                            <button onClick={() => setPaymentModal({ open: false, bill: null })} className="text-theme-muted hover:text-theme-primary transition">
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>
                        <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
                            <div className="bg-theme-primary p-4 rounded-lg border border-theme">
                                <div className="text-sm text-theme-muted">Bill: <span className="font-mono font-semibold text-theme-primary">{paymentModal.bill?.bill_number}</span></div>
                                <div className="text-sm text-theme-muted mt-1">Balance Due: <span className="font-semibold text-red-600 dark:text-red-400">{formatCurrency(parseFloat(paymentModal.bill?.total_amount || 0) - parseFloat(paymentModal.bill?.amount_paid || 0))}</span></div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-theme-secondary mb-1">Amount *</label>
                                <input
                                    type="number"
                                    value={paymentData.amount}
                                    onChange={(e) => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
                                    max={parseFloat(paymentModal.bill?.total_amount || 0) - parseFloat(paymentModal.bill?.amount_paid || 0)}
                                    step="0.01"
                                    min="0.01"
                                    required
                                    className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-theme-secondary mb-1">Payment Date *</label>
                                <input
                                    type="date"
                                    value={paymentData.payment_date}
                                    onChange={(e) => setPaymentData(prev => ({ ...prev, payment_date: e.target.value }))}
                                    required
                                    className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-theme-secondary mb-1">Payment Method</label>
                                <select
                                    value={paymentData.payment_method}
                                    onChange={(e) => setPaymentData(prev => ({ ...prev, payment_method: e.target.value }))}
                                    className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                >
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="cash">Cash</option>
                                    <option value="cheque">Cheque</option>
                                    <option value="mobile_money">Mobile Money</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-theme-secondary mb-1">Reference</label>
                                <input
                                    type="text"
                                    value={paymentData.reference}
                                    onChange={(e) => setPaymentData(prev => ({ ...prev, reference: e.target.value }))}
                                    placeholder="Payment reference or cheque number"
                                    className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-theme-secondary mb-1">Notes</label>
                                <textarea
                                    value={paymentData.notes}
                                    onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                                    rows="2"
                                    className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                ></textarea>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-theme font-semibold">
                                <button
                                    type="button"
                                    onClick={() => setPaymentModal({ open: false, bill: null })}
                                    className="px-6 py-2 text-theme-secondary bg-theme-primary hover:bg-theme-tertiary border border-theme rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-2 bg-accent-gold text-white rounded-lg hover:bg-accent-goldDark shadow-md transition"
                                >
                                    Record Payment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BillsPage;
