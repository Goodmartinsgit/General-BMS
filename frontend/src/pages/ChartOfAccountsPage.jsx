import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { BookOpen, Search, Plus, Edit, Trash2, X, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import PageHeader from '../components/common/PageHeader';
import { useAuth } from '../context/AuthContext';

const ACCOUNT_TYPES = ['All', 'Asset', 'Liability', 'Equity', 'Revenue', 'Expense'];
const NORMAL_BALANCES = ['debit', 'credit'];

const emptyForm = {
    code: '',
    name: '',
    type: 'asset',
    category: '',
    parent_id: '',
    normal_balance: 'debit',
    is_header: false,
    description: '',
};

const ChartOfAccountsPage = () => {
    const { auth } = useAuth();
    const canManageAccounting = auth?.user?.permissions?.['admin'] === true || auth?.user?.permissions?.['manage_accounting'] === true;
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const response = await api.get('/gl/accounts');
            setAccounts(response.data);
        } catch (error) {
            console.error('Error fetching accounts:', error);
            toast.error('Failed to fetch accounts');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setSelectedAccount(null);
        setFormData(emptyForm);
        setIsModalOpen(true);
    };

    const handleEdit = (account) => {
        setSelectedAccount(account);
        setFormData({
            code: account.code || '',
            name: account.name || '',
            type: account.type || 'asset',
            category: account.category || '',
            parent_id: account.parent_id || '',
            normal_balance: account.normal_balance || 'debit',
            is_header: account.is_header || false,
            description: account.description || '',
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this account?')) return;
        try {
            await api.delete(`/gl/accounts/${id}`);
            toast.success('Account deleted successfully');
            fetchAccounts();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete account');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = { ...formData, parent_id: formData.parent_id || null };
            if (selectedAccount) {
                await api.put(`/gl/accounts/${selectedAccount.id}`, payload);
                toast.success('Account updated successfully');
            } else {
                await api.post('/gl/accounts', payload);
                toast.success('Account created successfully');
            }
            setIsModalOpen(false);
            fetchAccounts();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save account');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const filteredAccounts = accounts.filter(acc => {
        const matchesSearch =
            acc.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            acc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            acc.category?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = activeFilter === 'All' || acc.type?.toLowerCase() === activeFilter.toLowerCase();
        return matchesSearch && matchesType;
    });

    const parentAccounts = accounts.filter(a => a.is_header);

    const getStatusBadge = (account) => {
        if (account.is_header) {
            return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">Header</span>;
        }
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">Active</span>;
    };

    const getTypeBadge = (type) => {
        const colors = {
            asset: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
            liability: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
            equity: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
            revenue: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
            expense: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
        };
        return colors[type?.toLowerCase()] || 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
    };

    const actions = canManageAccounting ? (
        <button
            onClick={handleAdd}
            className="bg-accent-gold text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-accent-goldDark transition flex items-center gap-2"
        >
            <Plus className="w-4 h-4" /> Add Account
        </button>
    ) : null;

    return (
        <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
            <PageHeader
                title="Chart of Accounts"
                subtitle="Manage general ledger accounts"
                badge={`${accounts.length} Accounts`}
                icon={BookOpen}
                actions={actions}
            />

            {/* Search and Filters */}
            <div className="bg-theme-secondary p-4 rounded-lg border border-theme shadow-theme-sm space-y-4">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted w-5 h-5 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search by code, name, or category..."
                        className="w-full pl-10 pr-4 py-2.5 bg-theme-primary border border-theme rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all text-sm text-theme-primary placeholder-theme-muted"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    {ACCOUNT_TYPES.map((type) => (
                        <button
                            key={type}
                            onClick={() => setActiveFilter(type)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                                activeFilter === type
                                    ? 'bg-accent-gold text-white'
                                    : 'bg-theme-primary text-theme-secondary border border-theme hover:bg-theme-tertiary'
                            }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* Accounts Table */}
            <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-theme-primary border-b border-theme">
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase tracking-wider">Code</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase tracking-wider">Normal Balance</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-theme">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="7" className="px-6 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-4 bg-theme-tertiary rounded" />
                                                <div className="w-40 h-4 bg-theme-tertiary rounded" />
                                                <div className="w-20 h-5 bg-theme-tertiary rounded-full" />
                                                <div className="w-24 h-4 bg-theme-tertiary rounded" />
                                                <div className="w-16 h-4 bg-theme-tertiary rounded" />
                                                <div className="w-16 h-5 bg-theme-tertiary rounded-full" />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredAccounts.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-theme-tertiary rounded-full flex items-center justify-center text-theme-muted">
                                                <BookOpen size={32} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-theme-primary text-lg">No accounts found</p>
                                                <p className="text-theme-muted text-sm mt-1">
                                                    {searchTerm || activeFilter !== 'All' ? 'Try adjusting your filters' : 'Add an account to get started'}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredAccounts.map((acc) => (
                                    <tr key={acc.id} className="hover:bg-theme-primary transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className={`font-mono text-sm ${acc.is_header ? 'font-bold text-theme-primary' : 'text-theme-secondary'}`}>
                                                {acc.code}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-sm ${acc.is_header ? 'font-bold text-theme-primary' : 'text-theme-primary'}`}>
                                                {acc.name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeBadge(acc.type)}`}>
                                                {acc.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-theme-secondary">
                                            {acc.category || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-theme-secondary capitalize">{acc.normal_balance}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(acc)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {canManageAccounting && (
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(acc)}
                                                    className="p-2 text-theme-muted hover:text-accent-gold hover:bg-accent-gold/10 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(acc.id)}
                                                    className="p-2 text-theme-muted hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-10">
                    <div className="bg-theme-secondary rounded-lg border border-theme shadow-xl w-full max-w-lg mx-4">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-theme">
                            <h2 className="text-lg font-semibold text-theme-primary">
                                {selectedAccount ? 'Edit Account' : 'Create Account'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-1 text-theme-muted hover:text-theme-primary transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-theme-primary mb-1">Code</label>
                                    <input
                                        name="code"
                                        value={formData.code}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                        placeholder="e.g. 1000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-theme-primary mb-1">Name</label>
                                    <input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                        placeholder="Account name"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-theme-primary mb-1">Type</label>
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                    >
                                        {ACCOUNT_TYPES.filter(t => t !== 'All').map(t => (
                                            <option key={t} value={t.toLowerCase()}>{t}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-theme-primary mb-1">Category</label>
                                    <input
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                        placeholder="e.g. Current Assets"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-theme-primary mb-1">Parent Account</label>
                                <select
                                    name="parent_id"
                                    value={formData.parent_id}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                >
                                    <option value="">None (Top Level)</option>
                                    {parentAccounts.map(pa => (
                                        <option key={pa.id} value={pa.id}>{pa.code} - {pa.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-theme-primary mb-2">Normal Balance</label>
                                <div className="flex gap-4">
                                    {NORMAL_BALANCES.map(nb => (
                                        <label key={nb} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="normal_balance"
                                                value={nb}
                                                checked={formData.normal_balance === nb}
                                                onChange={handleChange}
                                                className="w-4 h-4 text-accent-gold focus:ring-accent-gold border-theme"
                                            />
                                            <span className="text-sm text-theme-primary capitalize">{nb}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_header"
                                    name="is_header"
                                    checked={formData.is_header}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-accent-gold focus:ring-accent-gold border-theme rounded"
                                />
                                <label htmlFor="is_header" className="text-sm text-theme-primary">
                                    Header account (grouping only, no transactions)
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-theme-primary mb-1">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none resize-none"
                                    placeholder="Optional description..."
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
                                    {selectedAccount ? 'Update Account' : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChartOfAccountsPage;
