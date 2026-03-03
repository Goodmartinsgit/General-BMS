import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Target, Search, Plus, Edit, Trash2, X, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import PageHeader from '../components/common/PageHeader';

const CENTER_TYPES = ['cost', 'profit', 'investment'];

const emptyForm = {
    code: '',
    name: '',
    type: 'cost',
    manager_id: '',
    description: '',
};

const CostCentersPage = () => {
    const [centers, setCenters] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCenter, setSelectedCenter] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchCenters();
        fetchUsers();
    }, []);

    const fetchCenters = async () => {
        try {
            setLoading(true);
            const response = await api.get('/cost-centers');
            setCenters(response.data);
        } catch (error) {
            console.error('Error fetching cost centers:', error);
            toast.error('Failed to fetch cost centers');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleAdd = () => {
        setSelectedCenter(null);
        setFormData(emptyForm);
        setIsModalOpen(true);
    };

    const handleEdit = (center) => {
        setSelectedCenter(center);
        setFormData({
            code: center.code || '',
            name: center.name || '',
            type: center.type || 'cost',
            manager_id: center.manager_id || '',
            description: center.description || '',
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this cost center?')) return;
        try {
            await api.delete(`/cost-centers/${id}`);
            toast.success('Cost center deleted');
            fetchCenters();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete cost center');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = { ...formData, manager_id: formData.manager_id || null };
            if (selectedCenter) {
                await api.put(`/cost-centers/${selectedCenter.id}`, payload);
                toast.success('Cost center updated');
            } else {
                await api.post('/cost-centers', payload);
                toast.success('Cost center created');
            }
            setIsModalOpen(false);
            fetchCenters();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save cost center');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const getTypeBadge = (type) => {
        const styles = {
            cost: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
            profit: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
            investment: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
        };
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${styles[type] || styles.cost}`}>
                {type}
            </span>
        );
    };

    const filteredCenters = centers.filter(c =>
        c.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.manager_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const actions = (
        <button
            onClick={handleAdd}
            className="bg-accent-gold text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-accent-goldDark transition flex items-center gap-2"
        >
            <Plus className="w-4 h-4" /> Add Cost Center
        </button>
    );

    return (
        <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
            <PageHeader
                title="Cost Centers"
                subtitle="Manage cost, profit, and investment centers"
                badge={`${centers.length} Centers`}
                icon={Target}
                actions={actions}
            />

            {/* Search */}
            <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted w-4 h-4 pointer-events-none" />
                <input
                    type="text"
                    placeholder="Search by code, name, or manager..."
                    className="pl-10 pr-4 py-2.5 border border-theme rounded-lg w-full bg-theme-primary text-sm text-theme-primary focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all placeholder-theme-muted"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-theme-primary border-b border-theme">
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase tracking-wider">Code</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase tracking-wider">Manager</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-theme">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="5" className="px-6 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-4 bg-theme-tertiary rounded" />
                                                <div className="w-40 h-4 bg-theme-tertiary rounded" />
                                                <div className="w-20 h-5 bg-theme-tertiary rounded-full" />
                                                <div className="w-28 h-4 bg-theme-tertiary rounded" />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredCenters.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-theme-tertiary rounded-full flex items-center justify-center text-theme-muted">
                                                <Target size={32} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-theme-primary text-lg">No cost centers found</p>
                                                <p className="text-theme-muted text-sm mt-1">
                                                    {searchTerm ? 'Try a different search term' : 'Add a cost center to get started'}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredCenters.map((center) => (
                                    <tr key={center.id} className="hover:bg-theme-primary transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-sm font-medium text-theme-primary">{center.code}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-semibold text-theme-primary text-sm">{center.name}</div>
                                                {center.description && (
                                                    <div className="text-xs text-theme-muted mt-0.5 truncate max-w-[250px]">{center.description}</div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getTypeBadge(center.type)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-theme-secondary">{center.manager_name || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(center)}
                                                    className="p-2 text-theme-muted hover:text-accent-gold hover:bg-accent-gold/10 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(center.id)}
                                                    className="p-2 text-theme-muted hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    title="Delete"
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

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-10">
                    <div className="bg-theme-secondary rounded-lg border border-theme shadow-xl w-full max-w-lg mx-4">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-theme">
                            <h2 className="text-lg font-semibold text-theme-primary">
                                {selectedCenter ? 'Edit Cost Center' : 'Create Cost Center'}
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
                                        placeholder="e.g. CC-001"
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
                                        placeholder="Center name"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-theme-primary mb-1">Type</label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                >
                                    {CENTER_TYPES.map(t => (
                                        <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-theme-primary mb-1">Manager</label>
                                <select
                                    name="manager_id"
                                    value={formData.manager_id}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                >
                                    <option value="">No Manager</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.full_name}</option>
                                    ))}
                                </select>
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
                                    {selectedCenter ? 'Update Center' : 'Create Center'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CostCentersPage;
