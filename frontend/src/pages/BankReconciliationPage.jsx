import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Landmark, Search, Plus, X, Loader2, CheckCircle, Clock, FileCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import PageHeader from '../components/common/PageHeader';
import { useCurrency } from '../context/CurrencyContext';

const emptyForm = {
    account_id: '',
    statement_date: new Date().toISOString().split('T')[0],
    statement_balance: '',
    book_balance: '',
    notes: '',
};

const BankReconciliationPage = () => {
    const { formatCurrency } = useCurrency();
    const [reconciliations, setReconciliations] = useState([]);
    const [bankAccounts, setBankAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchReconciliations();
        fetchBankAccounts();
    }, []);

    const fetchReconciliations = async () => {
        try {
            setLoading(true);
            const response = await api.get('/bank-reconciliations');
            setReconciliations(response.data);
        } catch (error) {
            console.error('Error fetching reconciliations:', error);
            toast.error('Failed to fetch reconciliations');
        } finally {
            setLoading(false);
        }
    };

    const fetchBankAccounts = async () => {
        try {
            const response = await api.get('/gl/accounts', { params: { type: 'asset' } });
            setBankAccounts(response.data);
        } catch (error) {
            console.error('Error fetching bank accounts:', error);
        }
    };

    const handleAdd = () => {
        setFormData(emptyForm);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.account_id) {
            toast.error('Please select a bank account');
            return;
        }
        setSaving(true);
        try {
            await api.post('/bank-reconciliations', {
                ...formData,
                statement_balance: parseFloat(formData.statement_balance) || 0,
                book_balance: parseFloat(formData.book_balance) || 0,
            });
            toast.success('Reconciliation created successfully');
            setIsModalOpen(false);
            fetchReconciliations();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create reconciliation');
        } finally {
            setSaving(false);
        }
    };

    const handleComplete = async (id) => {
        if (!window.confirm('Are you sure you want to mark this reconciliation as completed?')) return;
        try {
            await api.post(`/bank-reconciliations/${id}/complete`);
            toast.success('Reconciliation completed');
            fetchReconciliations();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to complete reconciliation');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const getStatusBadge = (status) => {
        const styles = {
            draft: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400',
            in_progress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
            completed: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
        };
        const icons = {
            draft: <Clock size={12} />,
            in_progress: <Loader2 size={12} />,
            completed: <CheckCircle size={12} />,
        };
        const labels = {
            draft: 'Draft',
            in_progress: 'In Progress',
            completed: 'Completed',
        };
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${styles[status] || styles.draft}`}>
                {icons[status]}
                {labels[status] || status}
            </span>
        );
    };

    const filteredReconciliations = reconciliations.filter(rec =>
        rec.account_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const draftCount = reconciliations.filter(r => r.status === 'draft').length;
    const inProgressCount = reconciliations.filter(r => r.status === 'in_progress').length;
    const completedCount = reconciliations.filter(r => r.status === 'completed').length;

    const actions = (
        <button
            onClick={handleAdd}
            className="bg-accent-gold text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-accent-goldDark transition flex items-center gap-2"
        >
            <Plus className="w-4 h-4" /> New Reconciliation
        </button>
    );

    return (
        <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
            <PageHeader
                title="Bank Reconciliation"
                subtitle="Reconcile bank statements with book records"
                badge={`${reconciliations.length} Records`}
                icon={Landmark}
                actions={actions}
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400 rounded-lg">
                        <Clock size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-theme-muted font-medium">Draft</div>
                        <div className="text-2xl font-semibold text-theme-primary">{draftCount}</div>
                    </div>
                </div>
                <div className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400 rounded-lg">
                        <Loader2 size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-theme-muted font-medium">In Progress</div>
                        <div className="text-2xl font-semibold text-theme-primary">{inProgressCount}</div>
                    </div>
                </div>
                <div className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-lg">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-theme-muted font-medium">Completed</div>
                        <div className="text-2xl font-semibold text-theme-primary">{completedCount}</div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted w-4 h-4 pointer-events-none" />
                <input
                    type="text"
                    placeholder="Search by account or notes..."
                    className="pl-10 pr-4 py-2.5 border border-theme rounded-lg w-full bg-theme-primary text-sm text-theme-primary focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all placeholder-theme-muted"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Reconciliation List */}
            <div className="space-y-4">
                {loading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm p-6 animate-pulse">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-theme-tertiary rounded-lg" />
                                <div className="space-y-2 flex-1">
                                    <div className="w-48 h-4 bg-theme-tertiary rounded" />
                                    <div className="w-32 h-3 bg-theme-tertiary rounded" />
                                </div>
                            </div>
                        </div>
                    ))
                ) : filteredReconciliations.length === 0 ? (
                    <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm p-16 text-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-theme-tertiary rounded-full flex items-center justify-center text-theme-muted">
                                <Landmark size={32} />
                            </div>
                            <div>
                                <p className="font-semibold text-theme-primary text-lg">No reconciliations found</p>
                                <p className="text-theme-muted text-sm mt-1">Create a new reconciliation to get started</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    filteredReconciliations.map((rec) => (
                        <div key={rec.id} className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm p-6 hover:border-accent-gold/30 transition-colors">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Landmark size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-theme-primary">{rec.account_name || 'Bank Account'}</h3>
                                        <p className="text-sm text-theme-muted mt-0.5">
                                            Statement Date: {rec.statement_date ? format(new Date(rec.statement_date), 'dd MMM yyyy') : '-'}
                                        </p>
                                        <div className="flex flex-wrap gap-4 mt-2 text-sm">
                                            <div>
                                                <span className="text-theme-muted">Statement Balance: </span>
                                                <span className="font-medium text-theme-primary">{formatCurrency(rec.statement_balance || 0)}</span>
                                            </div>
                                            <div>
                                                <span className="text-theme-muted">Book Balance: </span>
                                                <span className="font-medium text-theme-primary">{formatCurrency(rec.book_balance || 0)}</span>
                                            </div>
                                            <div>
                                                <span className="text-theme-muted">Difference: </span>
                                                <span className={`font-medium ${Math.abs((rec.statement_balance || 0) - (rec.book_balance || 0)) > 0.01 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                                    {formatCurrency(Math.abs((rec.statement_balance || 0) - (rec.book_balance || 0)))}
                                                </span>
                                            </div>
                                        </div>
                                        {rec.notes && (
                                            <p className="text-sm text-theme-muted mt-2 italic">{rec.notes}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                                    {getStatusBadge(rec.status)}
                                    {rec.status !== 'completed' && (
                                        <button
                                            onClick={() => handleComplete(rec.id)}
                                            className="bg-accent-gold text-white px-3 py-1.5 rounded-lg font-semibold text-xs hover:bg-accent-goldDark transition flex items-center gap-1"
                                        >
                                            <FileCheck size={14} /> Complete
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-10">
                    <div className="bg-theme-secondary rounded-lg border border-theme shadow-xl w-full max-w-lg mx-4">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-theme">
                            <h2 className="text-lg font-semibold text-theme-primary">New Reconciliation</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-1 text-theme-muted hover:text-theme-primary transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-theme-primary mb-1">Bank Account</label>
                                <select
                                    name="account_id"
                                    value={formData.account_id}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                >
                                    <option value="">Select bank account</option>
                                    {bankAccounts.map(a => (
                                        <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-theme-primary mb-1">Statement Date</label>
                                <input
                                    type="date"
                                    name="statement_date"
                                    value={formData.statement_date}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-theme-primary mb-1">Statement Balance</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="statement_balance"
                                        value={formData.statement_balance}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-theme-primary mb-1">Book Balance</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="book_balance"
                                        value={formData.book_balance}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            {formData.statement_balance && formData.book_balance && (
                                <div className="bg-theme-primary rounded-lg border border-theme p-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-theme-muted">Difference:</span>
                                        <span className={`font-semibold ${Math.abs(parseFloat(formData.statement_balance) - parseFloat(formData.book_balance)) > 0.01 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                            {Math.abs(parseFloat(formData.statement_balance || 0) - parseFloat(formData.book_balance || 0)).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-theme-primary mb-1">Notes</label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none resize-none"
                                    placeholder="Optional notes..."
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border border-theme text-theme-secondary rounded-lg text-sm font-medium hover:bg-theme-tertiary transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-accent-gold text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-accent-goldDark transition flex items-center gap-2 disabled:opacity-70"
                                >
                                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Create Reconciliation
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BankReconciliationPage;
