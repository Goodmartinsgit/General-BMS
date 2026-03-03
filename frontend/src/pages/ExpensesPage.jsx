import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { Receipt, Search, Plus, Calendar, Trash2, MapPin, Download, Edit, DollarSign, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import PageHeader from '../components/common/PageHeader';
import PeriodFilter from '../components/common/PeriodFilter';
import ExpenseFormModal from '../components/ExpenseFormModal';
import { useCurrency } from '../context/CurrencyContext';

const ExpensesPage = () => {
    const { formatCurrency } = useCurrency();
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState(null);

    useEffect(() => {
        fetchExpenses();
    }, [dateRange]);

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            const params = {};
            if (dateRange?.start_date) params.start_date = dateRange.start_date;
            if (dateRange?.end_date) params.end_date = dateRange.end_date;
            const response = await api.get('/expenses', { params });
            setExpenses(response.data);
        } catch (error) {
            console.error('Error fetching expenses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePeriodChange = useCallback((range) => {
        setDateRange(range);
    }, []);

    const handleAddExpense = () => {
        setSelectedExpense(null);
        setIsModalOpen(true);
    };

    const handleEditExpense = (expense) => {
        setSelectedExpense(expense);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this expense?')) {
            try {
                await api.delete(`/expenses/${id}`);
                fetchExpenses();
            } catch (error) {
                alert('Failed to delete expense');
            }
        }
    };

    const handleModalSubmit = async (formData) => {
        try {
            if (selectedExpense) {
                await api.put(`/expenses/${selectedExpense.id}`, formData);
            } else {
                await api.post('/expenses', formData);
            }
            setIsModalOpen(false);
            fetchExpenses();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to save expense');
        }
    };

    const calculateTotal = () => {
        return expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    };

    const pendingExpenses = expenses.filter(e => e.status === 'pending').length;
    const approvedExpenses = expenses.filter(e => e.status === 'approved').length;

    const filteredExpenses = expenses.filter(e =>
        e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.category_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.expense_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300';
            case 'rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300';
            case 'paid': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300';
            default: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300';
        }
    };

    const actions = (
        <>
            <button className="hidden sm:flex bg-theme-secondary border border-theme text-theme-secondary px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm hover:bg-theme-tertiary transition items-center gap-1.5 sm:gap-2">
                <Download size={14} className="sm:w-4 sm:h-4" /> Export
            </button>
            <button
                onClick={handleAddExpense}
                className="bg-accent-gold text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm hover:bg-accent-goldDark transition flex items-center justify-center gap-1.5 sm:gap-2 w-full sm:w-auto"
            >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Add Expense
            </button>
        </>
    );

    return (
        <div className="space-y-4 sm:space-y-6 max-w-[1700px] mx-auto pb-6 sm:pb-10">
            <PageHeader
                title="Expenses"
                subtitle="Track and manage business expenses"
                badge={`${expenses.length} Expenses`}
                icon={Receipt}
                actions={actions}
            />

            {/* Period Filter */}
            <div className="flex justify-end">
                <PeriodFilter storageKey="expenses" onChange={handlePeriodChange} />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                <div className="bg-theme-secondary p-4 sm:p-6 rounded-lg border border-theme shadow-theme-sm flex items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-lg">
                        <TrendingDown size={20} className="sm:w-6 sm:h-6" />
                    </div>
                    <div>
                        <div className="text-xs sm:text-sm text-theme-muted font-medium">Total Expenses</div>
                        <div className="text-lg sm:text-xl md:text-2xl font-semibold text-theme-primary">
                            {formatCurrency(calculateTotal())}
                        </div>
                    </div>
                </div>
                <div className="bg-theme-secondary p-4 sm:p-6 rounded-lg border border-theme shadow-theme-sm flex items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 rounded-lg">
                        <Receipt size={20} className="sm:w-6 sm:h-6" />
                    </div>
                    <div>
                        <div className="text-xs sm:text-sm text-theme-muted font-medium">Pending Approval</div>
                        <div className="text-lg sm:text-xl md:text-2xl font-semibold text-theme-primary">{pendingExpenses}</div>
                    </div>
                </div>
                <div className="bg-theme-secondary p-4 sm:p-6 rounded-lg border border-theme shadow-theme-sm flex items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-lg">
                        <DollarSign size={20} className="sm:w-6 sm:h-6" />
                    </div>
                    <div>
                        <div className="text-xs sm:text-sm text-theme-muted font-medium">Approved</div>
                        <div className="text-lg sm:text-xl md:text-2xl font-semibold text-theme-primary">{approvedExpenses}</div>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-theme-secondary p-3 sm:p-4 rounded-lg border border-theme shadow-theme-sm">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted w-4 h-4 sm:w-5 sm:h-5 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search expenses..."
                        className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-theme-primary border border-theme rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all text-xs sm:text-sm text-theme-primary placeholder-theme-muted"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Expenses Table */}
            <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-theme-primary border-b border-theme">
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Expense</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Branch</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Category</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Amount</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Status</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-theme">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="6" className="px-6 py-8">
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
                            ) : filteredExpenses.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-theme-tertiary rounded-full flex items-center justify-center text-theme-muted">
                                                <Receipt size={32} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-theme-primary text-lg">No expenses found</p>
                                                <p className="text-theme-muted text-sm mt-1">Try adjusting your search or add a new expense.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredExpenses.map((exp) => (
                                    <tr key={exp.id} className="hover:bg-theme-primary transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-lg flex items-center justify-center">
                                                    <Receipt size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-theme-primary text-sm">{exp.description || 'No description'}</div>
                                                    <div className="flex items-center gap-2 text-xs text-theme-muted mt-0.5">
                                                        <span className="font-mono">{exp.expense_number}</span>
                                                        <span>•</span>
                                                        <Calendar size={12} /> {format(new Date(exp.expense_date), 'dd MMM yyyy')}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-theme-secondary">
                                                <MapPin size={14} className="text-theme-muted" />
                                                {exp.branch_name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
                                                {exp.category_name || 'Uncategorized'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold text-red-600 dark:text-red-400">
                                                {formatCurrency(exp.amount)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(exp.status)}`}>
                                                {exp.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEditExpense(exp)}
                                                    className="p-2 text-theme-muted hover:text-accent-gold hover:bg-accent-gold/10 rounded-lg transition"
                                                    title="Edit Expense"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(exp.id)}
                                                    className="p-2 text-theme-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                                    title="Delete Expense"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ExpenseFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleModalSubmit}
                expense={selectedExpense}
            />
        </div>
    );
};

export default ExpensesPage;
