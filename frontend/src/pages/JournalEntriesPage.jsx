import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { BookOpen, Search, Plus, Edit, Trash2, X, Loader2, CheckCircle, Clock, Send, RotateCcw, Eye } from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import PageHeader from '../components/common/PageHeader';
import { useCurrency } from '../context/CurrencyContext';

const STATUS_OPTIONS = ['all', 'draft', 'pending_approval', 'approved', 'posted', 'reversed'];
const ENTRY_TYPES = ['standard', 'adjusting', 'closing', 'reversing'];

const emptyLine = { account_id: '', debit: '', credit: '', description: '' };

const emptyForm = {
    entry_date: new Date().toISOString().split('T')[0],
    type: 'standard',
    description: '',
    lines: [{ ...emptyLine }, { ...emptyLine }],
};

const JournalEntriesPage = () => {
    const { formatCurrency } = useCurrency();
    const [entries, setEntries] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewMode, setIsViewMode] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchEntries();
        fetchAccounts();
    }, []);

    const fetchEntries = async () => {
        try {
            setLoading(true);
            const response = await api.get('/gl/journal-entries');
            setEntries(response.data);
        } catch (error) {
            console.error('Error fetching journal entries:', error);
            toast.error('Failed to fetch journal entries');
        } finally {
            setLoading(false);
        }
    };

    const fetchAccounts = async () => {
        try {
            const response = await api.get('/gl/accounts');
            setAccounts(response.data.filter(a => !a.is_header));
        } catch (error) {
            console.error('Error fetching accounts:', error);
        }
    };

    const handleAdd = () => {
        setSelectedEntry(null);
        setIsViewMode(false);
        setFormData(emptyForm);
        setIsModalOpen(true);
    };

    const handleView = (entry) => {
        setSelectedEntry(entry);
        setIsViewMode(true);
        setFormData({
            entry_date: entry.entry_date?.split('T')[0] || '',
            type: entry.type || 'standard',
            description: entry.description || '',
            lines: entry.lines?.length > 0 ? entry.lines : [{ ...emptyLine }, { ...emptyLine }],
        });
        setIsModalOpen(true);
    };

    const handleEdit = (entry) => {
        setSelectedEntry(entry);
        setIsViewMode(false);
        setFormData({
            entry_date: entry.entry_date?.split('T')[0] || '',
            type: entry.type || 'standard',
            description: entry.description || '',
            lines: entry.lines?.length > 0 ? entry.lines : [{ ...emptyLine }, { ...emptyLine }],
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this journal entry?')) return;
        try {
            await api.delete(`/gl/journal-entries/${id}`);
            toast.success('Journal entry deleted');
            fetchEntries();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete entry');
        }
    };

    const handleAction = async (id, action) => {
        try {
            await api.post(`/gl/journal-entries/${id}/${action}`);
            toast.success(`Entry ${action}ed successfully`);
            fetchEntries();
        } catch (error) {
            toast.error(error.response?.data?.message || `Failed to ${action} entry`);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const totalDebit = formData.lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
        const totalCredit = formData.lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            toast.error('Debit and credit totals must be equal');
            return;
        }

        const validLines = formData.lines.filter(l => l.account_id && (parseFloat(l.debit) || parseFloat(l.credit)));
        if (validLines.length < 2) {
            toast.error('At least two line items are required');
            return;
        }

        setSaving(true);
        try {
            const payload = { ...formData, lines: validLines };
            if (selectedEntry) {
                await api.put(`/gl/journal-entries/${selectedEntry.id}`, payload);
                toast.success('Journal entry updated');
            } else {
                await api.post('/gl/journal-entries', payload);
                toast.success('Journal entry created');
            }
            setIsModalOpen(false);
            fetchEntries();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save journal entry');
        } finally {
            setSaving(false);
        }
    };

    const handleLineChange = (index, field, value) => {
        setFormData(prev => {
            const newLines = [...prev.lines];
            newLines[index] = { ...newLines[index], [field]: value };
            // Clear opposite field if one is entered
            if (field === 'debit' && value) newLines[index].credit = '';
            if (field === 'credit' && value) newLines[index].debit = '';
            return { ...prev, lines: newLines };
        });
    };

    const addLine = () => {
        setFormData(prev => ({ ...prev, lines: [...prev.lines, { ...emptyLine }] }));
    };

    const removeLine = (index) => {
        if (formData.lines.length <= 2) return;
        setFormData(prev => ({ ...prev, lines: prev.lines.filter((_, i) => i !== index) }));
    };

    const totalDebit = formData.lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
    const totalCredit = formData.lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

    const getStatusBadge = (status) => {
        const styles = {
            draft: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400',
            pending_approval: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
            approved: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
            posted: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
            reversed: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
        };
        const labels = {
            draft: 'Draft',
            pending_approval: 'Pending Approval',
            approved: 'Approved',
            posted: 'Posted',
            reversed: 'Reversed',
        };
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || styles.draft}`}>
                {labels[status] || status}
            </span>
        );
    };

    const filteredEntries = entries.filter(entry => {
        const matchesSearch =
            entry.entry_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const actions = (
        <button
            onClick={handleAdd}
            className="bg-accent-gold text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-accent-goldDark transition flex items-center gap-2"
        >
            <Plus className="w-4 h-4" /> New Entry
        </button>
    );

    return (
        <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
            <PageHeader
                title="Journal Entries"
                subtitle="Manage general ledger journal entries"
                badge={`${entries.length} Entries`}
                icon={BookOpen}
                actions={actions}
            />

            {/* Search and Filter */}
            <div className="bg-theme-secondary p-4 rounded-lg border border-theme shadow-theme-sm">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted w-5 h-5 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search by entry number or description..."
                            className="w-full pl-10 pr-4 py-2.5 bg-theme-primary border border-theme rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all text-sm text-theme-primary placeholder-theme-muted"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2.5 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none text-sm"
                    >
                        <option value="all">All Statuses</option>
                        <option value="draft">Draft</option>
                        <option value="pending_approval">Pending Approval</option>
                        <option value="approved">Approved</option>
                        <option value="posted">Posted</option>
                        <option value="reversed">Reversed</option>
                    </select>
                </div>
            </div>

            {/* Entries Table */}
            <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-theme-primary border-b border-theme">
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase tracking-wider">Entry #</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase tracking-wider text-right">Debit Total</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase tracking-wider text-right">Credit Total</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-theme">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="8" className="px-6 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-20 h-4 bg-theme-tertiary rounded" />
                                                <div className="w-24 h-4 bg-theme-tertiary rounded" />
                                                <div className="w-16 h-4 bg-theme-tertiary rounded" />
                                                <div className="w-40 h-4 bg-theme-tertiary rounded" />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredEntries.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-theme-tertiary rounded-full flex items-center justify-center text-theme-muted">
                                                <BookOpen size={32} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-theme-primary text-lg">No journal entries found</p>
                                                <p className="text-theme-muted text-sm mt-1">Create a new entry to get started</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredEntries.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-theme-primary transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-sm font-medium text-theme-primary">{entry.entry_number}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-theme-secondary">
                                            {entry.entry_date ? format(new Date(entry.entry_date), 'dd MMM yyyy') : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-theme-secondary capitalize">{entry.type}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-theme-primary truncate block max-w-[200px]">{entry.description || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm font-medium text-theme-primary">
                                                {formatCurrency(entry.total_debit || 0)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm font-medium text-theme-primary">
                                                {formatCurrency(entry.total_credit || 0)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(entry.status)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleView(entry)}
                                                    className="p-2 text-theme-muted hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                    title="View"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                {(entry.status === 'draft' || entry.status === 'pending_approval') && (
                                                    <button
                                                        onClick={() => handleEdit(entry)}
                                                        className="p-2 text-theme-muted hover:text-accent-gold hover:bg-accent-gold/10 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                )}
                                                {entry.status === 'draft' && (
                                                    <button
                                                        onClick={() => handleAction(entry.id, 'approve')}
                                                        className="p-2 text-theme-muted hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle size={16} />
                                                    </button>
                                                )}
                                                {entry.status === 'approved' && (
                                                    <button
                                                        onClick={() => handleAction(entry.id, 'post')}
                                                        className="p-2 text-theme-muted hover:text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                                        title="Post"
                                                    >
                                                        <Send size={16} />
                                                    </button>
                                                )}
                                                {entry.status === 'posted' && (
                                                    <button
                                                        onClick={() => handleAction(entry.id, 'reverse')}
                                                        className="p-2 text-theme-muted hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        title="Reverse"
                                                    >
                                                        <RotateCcw size={16} />
                                                    </button>
                                                )}
                                                {entry.status === 'draft' && (
                                                    <button
                                                        onClick={() => handleDelete(entry.id)}
                                                        className="p-2 text-theme-muted hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit/View Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-10">
                    <div className="bg-theme-secondary rounded-lg border border-theme shadow-xl w-full max-w-3xl mx-4">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-theme">
                            <h2 className="text-lg font-semibold text-theme-primary">
                                {isViewMode ? 'View Journal Entry' : selectedEntry ? 'Edit Journal Entry' : 'New Journal Entry'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-1 text-theme-muted hover:text-theme-primary transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Header Fields */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-theme-primary mb-1">Date</label>
                                    <input
                                        type="date"
                                        value={formData.entry_date}
                                        onChange={(e) => setFormData(p => ({ ...p, entry_date: e.target.value }))}
                                        disabled={isViewMode}
                                        required
                                        className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none disabled:opacity-60"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-theme-primary mb-1">Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData(p => ({ ...p, type: e.target.value }))}
                                        disabled={isViewMode}
                                        className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none disabled:opacity-60"
                                    >
                                        {ENTRY_TYPES.map(t => (
                                            <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-theme-primary mb-1">Description</label>
                                    <input
                                        type="text"
                                        value={formData.description}
                                        onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                                        disabled={isViewMode}
                                        className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none disabled:opacity-60"
                                        placeholder="Entry description"
                                    />
                                </div>
                            </div>

                            {/* Line Items */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-semibold text-theme-primary">Line Items</label>
                                    {!isViewMode && (
                                        <button
                                            type="button"
                                            onClick={addLine}
                                            className="text-accent-gold hover:text-accent-goldDark text-sm font-medium flex items-center gap-1 transition"
                                        >
                                            <Plus size={14} /> Add Line
                                        </button>
                                    )}
                                </div>

                                <div className="border border-theme rounded-lg overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-theme-primary border-b border-theme">
                                                <th className="px-3 py-2 text-xs font-semibold text-theme-muted uppercase">Account</th>
                                                <th className="px-3 py-2 text-xs font-semibold text-theme-muted uppercase w-28 text-right">Debit</th>
                                                <th className="px-3 py-2 text-xs font-semibold text-theme-muted uppercase w-28 text-right">Credit</th>
                                                <th className="px-3 py-2 text-xs font-semibold text-theme-muted uppercase">Description</th>
                                                {!isViewMode && <th className="px-3 py-2 w-10"></th>}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-theme">
                                            {formData.lines.map((line, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-3 py-2">
                                                        <select
                                                            value={line.account_id}
                                                            onChange={(e) => handleLineChange(idx, 'account_id', e.target.value)}
                                                            disabled={isViewMode}
                                                            className="w-full px-2 py-1.5 border border-theme bg-theme-primary text-theme-primary rounded text-sm focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none disabled:opacity-60"
                                                        >
                                                            <option value="">Select account</option>
                                                            {accounts.map(a => (
                                                                <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={line.debit}
                                                            onChange={(e) => handleLineChange(idx, 'debit', e.target.value)}
                                                            disabled={isViewMode}
                                                            className="w-full px-2 py-1.5 border border-theme bg-theme-primary text-theme-primary rounded text-sm text-right focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none disabled:opacity-60"
                                                            placeholder="0.00"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={line.credit}
                                                            onChange={(e) => handleLineChange(idx, 'credit', e.target.value)}
                                                            disabled={isViewMode}
                                                            className="w-full px-2 py-1.5 border border-theme bg-theme-primary text-theme-primary rounded text-sm text-right focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none disabled:opacity-60"
                                                            placeholder="0.00"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="text"
                                                            value={line.description || ''}
                                                            onChange={(e) => handleLineChange(idx, 'description', e.target.value)}
                                                            disabled={isViewMode}
                                                            className="w-full px-2 py-1.5 border border-theme bg-theme-primary text-theme-primary rounded text-sm focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none disabled:opacity-60"
                                                            placeholder="Line note"
                                                        />
                                                    </td>
                                                    {!isViewMode && (
                                                        <td className="px-3 py-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => removeLine(idx)}
                                                                disabled={formData.lines.length <= 2}
                                                                className="p-1 text-theme-muted hover:text-red-600 transition-colors disabled:opacity-30"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-theme-primary border-t border-theme">
                                                <td className="px-3 py-2 text-sm font-semibold text-theme-primary text-right">Totals:</td>
                                                <td className="px-3 py-2 text-sm font-semibold text-right text-theme-primary">
                                                    {totalDebit.toFixed(2)}
                                                </td>
                                                <td className="px-3 py-2 text-sm font-semibold text-right text-theme-primary">
                                                    {totalCredit.toFixed(2)}
                                                </td>
                                                <td className="px-3 py-2" colSpan={isViewMode ? 1 : 2}>
                                                    {!isBalanced && totalDebit + totalCredit > 0 && (
                                                        <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                                                            Difference: {Math.abs(totalDebit - totalCredit).toFixed(2)}
                                                        </span>
                                                    )}
                                                    {isBalanced && totalDebit > 0 && (
                                                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">Balanced</span>
                                                    )}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border border-theme text-theme-secondary rounded-lg text-sm font-medium hover:bg-theme-tertiary transition"
                                >
                                    {isViewMode ? 'Close' : 'Cancel'}
                                </button>
                                {!isViewMode && (
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="bg-accent-gold text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-accent-goldDark transition flex items-center gap-2 disabled:opacity-70"
                                    >
                                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                        {selectedEntry ? 'Update Entry' : 'Create Entry'}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JournalEntriesPage;
