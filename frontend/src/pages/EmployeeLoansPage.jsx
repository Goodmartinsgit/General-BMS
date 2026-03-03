import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
    CreditCard,
    Search,
    Plus,
    X,
    Ban,
    DollarSign,
    Calendar,
    User,
    CheckCircle,
    AlertCircle,
    Banknote
} from 'lucide-react';
import { format } from 'date-fns';
import PageHeader from '../components/common/PageHeader';
import { useCurrency } from '../context/CurrencyContext';

const EmployeeLoansPage = () => {
    const { formatCurrency } = useCurrency();
    const [loans, setLoans] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    const defaultForm = {
        user_id: '',
        loan_amount: '',
        monthly_deduction: '',
        start_date: '',
        reason: ''
    };

    const [form, setForm] = useState(defaultForm);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [loansRes, usersRes] = await Promise.all([
                api.get('/payroll/loans'),
                api.get('/users')
            ]);
            setLoans(loansRes.data || []);
            setUsers(usersRes.data || []);
        } catch (error) {
            console.error('Error fetching loan data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setForm(defaultForm);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...form,
                loan_amount: parseFloat(form.loan_amount) || 0,
                monthly_deduction: parseFloat(form.monthly_deduction) || 0
            };
            await api.post('/payroll/loans', payload);
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to create loan');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this loan?')) return;
        try {
            await api.post(`/payroll/loans/${id}/cancel`);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to cancel loan');
        }
    };

    const getStatusBadge = (status) => {
        const map = {
            active: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300',
            completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
            cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300'
        };
        return map[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300';
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'active': return <CheckCircle size={14} />;
            case 'completed': return <CheckCircle size={14} />;
            case 'cancelled': return <AlertCircle size={14} />;
            default: return <AlertCircle size={14} />;
        }
    };

    const filteredLoans = loans.filter(l =>
        l.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.reason?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeLoans = loans.filter(l => l.status === 'active');
    const totalOutstanding = activeLoans.reduce((sum, l) => {
        const balance = parseFloat(l.loan_amount || 0) - parseFloat(l.total_repaid || 0);
        return sum + Math.max(balance, 0);
    }, 0);
    const totalLoanAmount = loans.reduce((sum, l) => sum + parseFloat(l.loan_amount || 0), 0);

    const actions = (
        <button
            onClick={handleCreate}
            className="bg-accent-gold text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-accent-goldDark transition flex items-center gap-2"
        >
            <Plus className="w-4 h-4" /> New Loan
        </button>
    );

    return (
        <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
            <PageHeader
                title="Employee Loans"
                subtitle="Manage employee loans and deductions"
                badge={`${loans.length} Loans`}
                icon={CreditCard}
                actions={actions}
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-theme-secondary rounded-lg border border-theme p-6 shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-lg">
                        <Banknote size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-theme-muted font-medium">Active Loans</p>
                        <p className="text-2xl font-bold text-theme-primary mt-1">{activeLoans.length}</p>
                    </div>
                </div>
                <div className="bg-theme-secondary rounded-lg border border-theme p-6 shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-theme-muted font-medium">Total Loan Amount</p>
                        <p className="text-2xl font-bold text-theme-primary mt-1">{formatCurrency(totalLoanAmount)}</p>
                    </div>
                </div>
                <div className="bg-theme-secondary rounded-lg border border-theme p-6 shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 rounded-lg">
                        <CreditCard size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-theme-muted font-medium">Outstanding Balance</p>
                        <p className="text-2xl font-bold text-theme-primary mt-1">{formatCurrency(totalOutstanding)}</p>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-theme-secondary p-4 rounded-lg border border-theme shadow-theme-sm">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted w-5 h-5 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search by employee name, status, or reason..."
                        className="w-full pl-10 pr-4 py-2.5 bg-theme-primary border border-theme rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all text-sm text-theme-primary placeholder-theme-muted"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Loans Table */}
            <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-theme-primary border-b border-theme">
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Employee</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Loan Amount</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Monthly Deduction</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Repaid</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Balance</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Status</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-theme">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="7" className="px-6 py-8">
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
                            ) : filteredLoans.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-theme-tertiary rounded-full flex items-center justify-center text-theme-muted">
                                                <CreditCard size={32} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-theme-primary text-lg">No loans found</p>
                                                <p className="text-theme-muted text-sm mt-1">Create a new employee loan to get started.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredLoans.map((loan) => {
                                    const balance = Math.max(parseFloat(loan.loan_amount || 0) - parseFloat(loan.total_repaid || 0), 0);
                                    const repaidPercent = parseFloat(loan.loan_amount) > 0
                                        ? Math.min(100, (parseFloat(loan.total_repaid || 0) / parseFloat(loan.loan_amount)) * 100)
                                        : 0;

                                    return (
                                        <tr key={loan.id} className="hover:bg-theme-primary transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg flex items-center justify-center">
                                                        <User size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-theme-primary text-sm">
                                                            {loan.employee_name || loan.user_name || 'Unknown'}
                                                        </div>
                                                        <div className="text-xs text-theme-muted mt-0.5 flex items-center gap-1">
                                                            <Calendar size={12} />
                                                            {loan.start_date ? format(new Date(loan.start_date), 'dd MMM yyyy') : 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-semibold text-theme-primary">
                                                {formatCurrency(loan.loan_amount || 0)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-theme-secondary">
                                                {formatCurrency(loan.monthly_deduction || 0)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="text-sm font-medium text-theme-primary">
                                                        {formatCurrency(loan.total_repaid || 0)}
                                                    </div>
                                                    <div className="w-full bg-theme-tertiary rounded-full h-1.5 mt-1.5">
                                                        <div
                                                            className="bg-accent-gold h-1.5 rounded-full transition-all"
                                                            style={{ width: `${repaidPercent}%` }}
                                                        ></div>
                                                    </div>
                                                    <div className="text-xs text-theme-muted mt-0.5">
                                                        {new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(repaidPercent)}%
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-semibold text-amber-600 dark:text-amber-400">
                                                {formatCurrency(balance)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${getStatusBadge(loan.status)}`}>
                                                    {getStatusIcon(loan.status)}
                                                    {loan.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {loan.status === 'active' && (
                                                        <button
                                                            onClick={() => handleCancel(loan.id)}
                                                            className="p-2 text-theme-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                                            title="Cancel Loan"
                                                        >
                                                            <Ban size={16} />
                                                        </button>
                                                    )}
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

            {/* Create Loan Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-10">
                    <div className="bg-theme-secondary rounded-lg shadow-xl w-full max-w-3xl my-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-theme">
                            <h2 className="text-lg font-semibold text-theme-primary">Create Employee Loan</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 text-theme-muted hover:text-theme-primary hover:bg-theme-tertiary rounded-lg transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-theme-primary mb-1.5">Employee</label>
                                <select
                                    value={form.user_id}
                                    onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                                    className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                    required
                                >
                                    <option value="">Select Employee</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>
                                            {u.name || u.full_name || u.email}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-theme-primary mb-1.5">Loan Amount</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={form.loan_amount}
                                        onChange={(e) => setForm({ ...form, loan_amount: e.target.value })}
                                        className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-theme-primary mb-1.5">Monthly Deduction</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={form.monthly_deduction}
                                        onChange={(e) => setForm({ ...form, monthly_deduction: e.target.value })}
                                        className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Estimated duration hint */}
                            {form.loan_amount && form.monthly_deduction && parseFloat(form.monthly_deduction) > 0 && (
                                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-3 border border-blue-200 dark:border-blue-800/30">
                                    <p className="text-xs text-blue-700 dark:text-blue-300">
                                        <strong>Estimated Duration:</strong>{' '}
                                        {Math.ceil(parseFloat(form.loan_amount) / parseFloat(form.monthly_deduction))} months
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-theme-primary mb-1.5">Start Date</label>
                                <input
                                    type="date"
                                    value={form.start_date}
                                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                                    className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-theme-primary mb-1.5">Reason</label>
                                <textarea
                                    value={form.reason}
                                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none resize-none"
                                    placeholder="Reason for the loan..."
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-theme">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border border-theme text-theme-secondary rounded-lg font-medium text-sm hover:bg-theme-tertiary transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-accent-gold text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-accent-goldDark transition disabled:opacity-50"
                                >
                                    {saving ? 'Creating...' : 'Create Loan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeLoansPage;
