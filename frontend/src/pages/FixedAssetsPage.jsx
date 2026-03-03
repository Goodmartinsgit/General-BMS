import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Package, Search, Plus, Edit, Trash2, X, Loader2, DollarSign, TrendingDown, BarChart3, Play } from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import PageHeader from '../components/common/PageHeader';
import { useCurrency } from '../context/CurrencyContext';

const ASSET_CATEGORIES = ['Land', 'Buildings', 'Vehicles', 'Equipment', 'Furniture', 'IT Equipment', 'Machinery', 'Other'];
const DEPRECIATION_METHODS = ['straight_line', 'declining_balance', 'units_of_production'];

const emptyForm = {
    code: '',
    name: '',
    category: '',
    description: '',
    purchase_date: new Date().toISOString().split('T')[0],
    purchase_price: '',
    salvage_value: '',
    useful_life_years: '',
    depreciation_method: 'straight_line',
    location: '',
    serial_number: '',
    supplier: '',
    warranty_expiry: '',
    notes: '',
};

const FixedAssetsPage = () => {
    const { formatCurrency } = useCurrency();
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [runningDepreciation, setRunningDepreciation] = useState(false);

    useEffect(() => {
        fetchAssets();
    }, []);

    const fetchAssets = async () => {
        try {
            setLoading(true);
            const response = await api.get('/fixed-assets');
            setAssets(response.data);
        } catch (error) {
            console.error('Error fetching fixed assets:', error);
            toast.error('Failed to fetch fixed assets');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setSelectedAsset(null);
        setFormData(emptyForm);
        setIsModalOpen(true);
    };

    const handleEdit = (asset) => {
        setSelectedAsset(asset);
        setFormData({
            code: asset.code || '',
            name: asset.name || '',
            category: asset.category || '',
            description: asset.description || '',
            purchase_date: asset.purchase_date?.split('T')[0] || '',
            purchase_price: asset.purchase_price || '',
            salvage_value: asset.salvage_value || '',
            useful_life_years: asset.useful_life_years || '',
            depreciation_method: asset.depreciation_method || 'straight_line',
            location: asset.location || '',
            serial_number: asset.serial_number || '',
            supplier: asset.supplier || '',
            warranty_expiry: asset.warranty_expiry?.split('T')[0] || '',
            notes: asset.notes || '',
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this asset?')) return;
        try {
            await api.delete(`/fixed-assets/${id}`);
            toast.success('Asset deleted');
            fetchAssets();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete asset');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...formData,
                purchase_price: parseFloat(formData.purchase_price) || 0,
                salvage_value: parseFloat(formData.salvage_value) || 0,
                useful_life_years: parseInt(formData.useful_life_years) || 0,
                warranty_expiry: formData.warranty_expiry || null,
            };
            if (selectedAsset) {
                await api.put(`/fixed-assets/${selectedAsset.id}`, payload);
                toast.success('Asset updated');
            } else {
                await api.post('/fixed-assets', payload);
                toast.success('Asset created');
            }
            setIsModalOpen(false);
            fetchAssets();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save asset');
        } finally {
            setSaving(false);
        }
    };

    const handleRunDepreciation = async () => {
        if (!window.confirm('Run depreciation calculation for all active assets? This action will create depreciation entries.')) return;
        setRunningDepreciation(true);
        try {
            const response = await api.post('/fixed-assets/depreciation/run');
            toast.success(response.data?.message || 'Depreciation run completed');
            fetchAssets();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to run depreciation');
        } finally {
            setRunningDepreciation(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const getStatusBadge = (status) => {
        const styles = {
            active: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
            disposed: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
            fully_depreciated: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400',
            under_maintenance: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
        };
        const labels = {
            active: 'Active',
            disposed: 'Disposed',
            fully_depreciated: 'Fully Depreciated',
            under_maintenance: 'Under Maintenance',
        };
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || styles.active}`}>
                {labels[status] || status}
            </span>
        );
    };

    const filteredAssets = assets.filter(a =>
        a.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalAssets = assets.length;
    const totalValue = assets.reduce((s, a) => s + (parseFloat(a.purchase_price) || 0), 0);
    const totalDepreciation = assets.reduce((s, a) => s + (parseFloat(a.accumulated_depreciation) || 0), 0);

    const actions = (
        <>
            <button
                onClick={handleRunDepreciation}
                disabled={runningDepreciation}
                className="bg-theme-secondary border border-theme text-theme-secondary px-4 py-2 rounded-lg font-medium text-sm hover:bg-theme-tertiary transition flex items-center gap-2 disabled:opacity-70"
            >
                {runningDepreciation ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                Run Depreciation
            </button>
            <button
                onClick={handleAdd}
                className="bg-accent-gold text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-accent-goldDark transition flex items-center gap-2"
            >
                <Plus className="w-4 h-4" /> Add Asset
            </button>
        </>
    );

    return (
        <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
            <PageHeader
                title="Fixed Assets"
                subtitle="Manage and track fixed asset inventory"
                badge={`${totalAssets} Assets`}
                icon={Package}
                actions={actions}
            />

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg">
                        <Package size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-theme-muted font-medium">Total Assets</div>
                        <div className="text-2xl font-semibold text-theme-primary">{totalAssets}</div>
                    </div>
                </div>
                <div className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-lg">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-theme-muted font-medium">Total Value</div>
                        <div className="text-2xl font-semibold text-theme-primary">{formatCurrency(totalValue)}</div>
                    </div>
                </div>
                <div className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-lg">
                        <TrendingDown size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-theme-muted font-medium">Total Depreciation</div>
                        <div className="text-2xl font-semibold text-theme-primary">{formatCurrency(totalDepreciation)}</div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted w-4 h-4 pointer-events-none" />
                <input
                    type="text"
                    placeholder="Search by code, name, or category..."
                    className="pl-10 pr-4 py-2.5 border border-theme rounded-lg w-full bg-theme-primary text-sm text-theme-primary focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all placeholder-theme-muted"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Assets Table */}
            <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-theme-primary border-b border-theme">
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase tracking-wider">Code</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase tracking-wider text-right">Purchase Price</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase tracking-wider text-right">Current Value</th>
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
                                                <div className="w-24 h-5 bg-theme-tertiary rounded-full" />
                                                <div className="w-20 h-4 bg-theme-tertiary rounded" />
                                                <div className="w-20 h-4 bg-theme-tertiary rounded" />
                                                <div className="w-16 h-5 bg-theme-tertiary rounded-full" />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredAssets.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-theme-tertiary rounded-full flex items-center justify-center text-theme-muted">
                                                <Package size={32} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-theme-primary text-lg">No fixed assets found</p>
                                                <p className="text-theme-muted text-sm mt-1">
                                                    {searchTerm ? 'Try a different search term' : 'Add a fixed asset to get started'}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredAssets.map((asset) => {
                                    const currentValue = (parseFloat(asset.purchase_price) || 0) - (parseFloat(asset.accumulated_depreciation) || 0);
                                    return (
                                        <tr key={asset.id} className="hover:bg-theme-primary transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-sm font-medium text-theme-primary">{asset.code}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="font-semibold text-theme-primary text-sm">{asset.name}</div>
                                                    {asset.purchase_date && (
                                                        <div className="text-xs text-theme-muted mt-0.5">
                                                            Purchased: {format(new Date(asset.purchase_date), 'dd MMM yyyy')}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
                                                    {asset.category || 'Uncategorized'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-sm font-medium text-theme-primary">
                                                    {formatCurrency(asset.purchase_price || 0)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-sm font-medium text-theme-primary">
                                                    {formatCurrency(currentValue > 0 ? currentValue : 0)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(asset.status)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEdit(asset)}
                                                        className="p-2 text-theme-muted hover:text-accent-gold hover:bg-accent-gold/10 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(asset.id)}
                                                        className="p-2 text-theme-muted hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        title="Delete"
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

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-10">
                    <div className="bg-theme-secondary rounded-lg border border-theme shadow-xl w-full max-w-2xl mx-4">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-theme">
                            <h2 className="text-lg font-semibold text-theme-primary">
                                {selectedAsset ? 'Edit Fixed Asset' : 'Add Fixed Asset'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-1 text-theme-muted hover:text-theme-primary transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-theme-primary mb-1">Asset Code</label>
                                    <input
                                        name="code"
                                        value={formData.code}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                        placeholder="e.g. FA-001"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-theme-primary mb-1">Asset Name</label>
                                    <input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                        placeholder="Asset name"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-theme-primary mb-1">Category</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                    >
                                        <option value="">Select category</option>
                                        {ASSET_CATEGORIES.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-theme-primary mb-1">Purchase Date</label>
                                    <input
                                        type="date"
                                        name="purchase_date"
                                        value={formData.purchase_date}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                    />
                                </div>
                            </div>

                            {/* Financial */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-theme-primary mb-1">Purchase Price</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        name="purchase_price"
                                        value={formData.purchase_price}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-theme-primary mb-1">Salvage Value</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        name="salvage_value"
                                        value={formData.salvage_value}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-theme-primary mb-1">Useful Life (Years)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        name="useful_life_years"
                                        value={formData.useful_life_years}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                        placeholder="e.g. 5"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-theme-primary mb-1">Depreciation Method</label>
                                <select
                                    name="depreciation_method"
                                    value={formData.depreciation_method}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                >
                                    <option value="straight_line">Straight Line</option>
                                    <option value="declining_balance">Declining Balance</option>
                                    <option value="units_of_production">Units of Production</option>
                                </select>
                            </div>

                            {/* Additional Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-theme-primary mb-1">Location</label>
                                    <input
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                        placeholder="e.g. Main Office"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-theme-primary mb-1">Serial Number</label>
                                    <input
                                        name="serial_number"
                                        value={formData.serial_number}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                        placeholder="Optional"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-theme-primary mb-1">Supplier</label>
                                    <input
                                        name="supplier"
                                        value={formData.supplier}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                        placeholder="Supplier name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-theme-primary mb-1">Warranty Expiry</label>
                                    <input
                                        type="date"
                                        name="warranty_expiry"
                                        value={formData.warranty_expiry}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-theme-primary mb-1">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none resize-none"
                                    placeholder="Asset description..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-theme-primary mb-1">Notes</label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none resize-none"
                                    placeholder="Additional notes..."
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2 sticky bottom-0 bg-theme-secondary pb-1">
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
                                    {selectedAsset ? 'Update Asset' : 'Create Asset'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FixedAssetsPage;
