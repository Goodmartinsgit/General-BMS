import React, { useState, useEffect } from 'react';
import {
    Trash2,
    RotateCcw,
    AlertTriangle,
    Package,
    Users,
    ShoppingCart,
    FileText,
    Search,
    Clock,
    XCircle,
    X,
    Truck
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import { toast } from 'react-toastify';
import { recyclebinAPI } from '../api/recyclebin';

const RecycleBin = () => {
    const [loading, setLoading] = useState(true);
    const [deletedItems, setDeletedItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState('all');
    const [selectedItems, setSelectedItems] = useState([]);
    const [confirmModal, setConfirmModal] = useState(null); // { type: 'restore'|'purge'|'empty', item?: obj }

    useEffect(() => {
        fetchDeletedItems();
    }, [selectedType, searchQuery]);

    const fetchDeletedItems = async () => {
        setLoading(true);
        try {
            const params = {
                type: selectedType !== 'all' ? selectedType : undefined,
                search: searchQuery || undefined
            };
            Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

            const response = await recyclebinAPI.getDeletedItems(params);
            const items = response.items || response.data || response || [];

            setDeletedItems(items.map(item => ({
                id: item.id,
                type: item.type || item.item_type || item.entity_type,
                name: item.name || item.item_name || getEntityName(item),
                deleted_at: item.deleted_at,
                deleted_by: item.deleted_by || item.deleted_by_name || 'System',
                reason: item.reason || item.deletion_reason || '',
                can_restore: item.can_restore ?? true,
                expires_at: item.expires_at || item.expiry_date || item.restore_deadline
            })));
        } catch (error) {
            console.error('Error fetching deleted items:', error);
            toast.error('Failed to load deleted items');
        } finally {
            setLoading(false);
        }
    };

    const getEntityName = (item) => {
        if (item.entity_data) {
            const data = typeof item.entity_data === 'string' ? JSON.parse(item.entity_data) : item.entity_data;
            return data.name || data.product_name || data.full_name || data.company_name || `${item.entity_type} #${item.entity_id}`;
        }
        return `${item.entity_type || 'Item'} #${item.entity_id || item.id}`;
    };

    const handleRestore = async (item) => {
        try {
            await recyclebinAPI.restoreItem(item.type, item.id);
            toast.success(`${item.name} has been restored`);
            fetchDeletedItems();
        } catch (error) {
            console.error('Error restoring item:', error);
            toast.error(error.response?.data?.message || 'Failed to restore item');
        }
        setConfirmModal(null);
    };

    const handlePurge = async (item) => {
        try {
            await recyclebinAPI.purgeItem(item.type, item.id);
            toast.success(`${item.name} has been permanently deleted`);
            fetchDeletedItems();
        } catch (error) {
            console.error('Error purging item:', error);
            toast.error(error.response?.data?.message || 'Failed to delete item');
        }
        setConfirmModal(null);
    };

    const handleBulkRestore = async () => {
        try {
            const itemsToRestore = deletedItems
                .filter(item => selectedItems.includes(item.id))
                .map(item => ({ type: item.type, id: item.id }));
            await recyclebinAPI.restoreItems(itemsToRestore);
            toast.success(`${selectedItems.length} items have been restored`);
            setSelectedItems([]);
            fetchDeletedItems();
        } catch (error) {
            console.error('Error restoring items:', error);
            toast.error(error.response?.data?.message || 'Failed to restore items');
        }
    };

    const handleEmptyBin = async () => {
        try {
            await recyclebinAPI.emptyBin();
            toast.success('Recycle bin has been emptied');
            fetchDeletedItems();
        } catch (error) {
            console.error('Error emptying bin:', error);
            toast.error(error.response?.data?.message || 'Failed to empty recycle bin');
        }
        setConfirmModal(null);
    };

    const toggleItemSelection = (itemId) => {
        setSelectedItems(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedItems.length === deletedItems.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(deletedItems.map(item => item.id));
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'product':
                return <Package className="w-4 h-4" />;
            case 'customer':
                return <Users className="w-4 h-4" />;
            case 'sale':
                return <ShoppingCart className="w-4 h-4" />;
            case 'supplier':
                return <Truck className="w-4 h-4" />;
            case 'purchase_order':
                return <FileText className="w-4 h-4" />;
            default:
                return <Trash2 className="w-4 h-4" />;
        }
    };

    const getTypeBadgeStyle = (type) => {
        switch (type) {
            case 'product':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
            case 'customer':
                return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
            case 'sale':
                return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
            case 'supplier':
                return 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400';
            case 'purchase_order':
                return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
        }
    };

    const getTypeLabel = (type) => {
        const labels = {
            product: 'Product',
            customer: 'Customer',
            sale: 'Sale',
            supplier: 'Supplier',
            purchase_order: 'Purchase Order'
        };
        return labels[type] || type;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getDaysUntilExpiry = (expiryDate) => {
        if (!expiryDate) return null;
        const now = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry - now;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const typeFilters = [
        { value: 'all', label: 'All Items' },
        { value: 'product', label: 'Products' },
        { value: 'customer', label: 'Customers' },
        { value: 'sale', label: 'Sales' },
        { value: 'supplier', label: 'Suppliers' },
        { value: 'purchase_order', label: 'Orders' }
    ];

    const actions = (
        <div className="flex items-center gap-3">
            {selectedItems.length > 0 && (
                <button
                    onClick={handleBulkRestore}
                    className="px-4 py-2.5 text-sm font-medium text-theme-secondary bg-theme-tertiary hover:bg-theme-primary border border-theme rounded-lg transition-colors flex items-center gap-2"
                >
                    <RotateCcw size={16} /> Restore Selected ({selectedItems.length})
                </button>
            )}
            {deletedItems.length > 0 && (
                <button
                    onClick={() => setConfirmModal({ type: 'empty' })}
                    className="px-4 py-2.5 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                    <Trash2 size={16} /> Empty Bin
                </button>
            )}
        </div>
    );

    return (
        <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
            <PageHeader
                title="Recycle Bin"
                subtitle="Restore or permanently delete items"
                icon={Trash2}
                badge={!loading && deletedItems.length > 0 ? `${deletedItems.length} items` : undefined}
                actions={actions}
            />

            {/* Warning Banner */}
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                    <p className="font-semibold text-sm text-red-800 dark:text-red-300">Items are automatically deleted after 30 days</p>
                    <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">
                        Restore items before they expire to recover your data. Permanently deleted items cannot be recovered.
                    </p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-theme-secondary rounded-xl border border-theme p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted w-4 h-4 pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search deleted items..."
                            className="pl-10 pr-4 py-2.5 border border-theme rounded-lg w-full bg-theme-primary text-sm text-theme-primary focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all placeholder-theme-muted"
                        />
                    </div>
                    <div className="flex items-center gap-1.5 bg-theme-tertiary rounded-lg p-1">
                        {typeFilters.map((filter) => (
                            <button
                                key={filter.value}
                                onClick={() => setSelectedType(filter.value)}
                                className={`px-3 py-2 text-xs font-medium rounded-md transition-all ${
                                    selectedType === filter.value
                                        ? 'bg-accent-gold text-white shadow-sm'
                                        : 'text-theme-secondary hover:text-theme-primary hover:bg-theme-primary'
                                }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-theme-primary border-b border-theme">
                                    <th className="w-12 py-3 px-5"></th>
                                    <th className="px-5 py-3 text-xs font-semibold text-theme-muted uppercase tracking-wider">Item</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-theme-muted uppercase tracking-wider">Type</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-theme-muted uppercase tracking-wider">Deleted</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-theme-muted uppercase tracking-wider">Reason</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-theme-muted uppercase tracking-wider">Expires</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-theme-muted uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-theme">
                                {Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="py-4 px-5"><div className="w-4 h-4 bg-theme-tertiary rounded"></div></td>
                                        <td className="py-4 px-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-theme-tertiary rounded-lg"></div>
                                                <div className="space-y-1.5">
                                                    <div className="h-4 w-32 bg-theme-tertiary rounded"></div>
                                                    <div className="h-3 w-24 bg-theme-tertiary rounded"></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-5"><div className="h-5 w-16 bg-theme-tertiary rounded-full"></div></td>
                                        <td className="py-4 px-5"><div className="h-4 w-28 bg-theme-tertiary rounded"></div></td>
                                        <td className="py-4 px-5"><div className="h-4 w-20 bg-theme-tertiary rounded"></div></td>
                                        <td className="py-4 px-5"><div className="h-4 w-16 bg-theme-tertiary rounded"></div></td>
                                        <td className="py-4 px-5"><div className="h-8 w-24 bg-theme-tertiary rounded ml-auto"></div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : deletedItems.length === 0 ? (
                <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm py-20">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-theme-tertiary rounded-full flex items-center justify-center text-theme-muted">
                            <Trash2 size={32} />
                        </div>
                        <div className="text-center">
                            <p className="font-semibold text-theme-primary text-lg">Recycle bin is empty</p>
                            <p className="text-theme-muted text-sm mt-1">No deleted items to display</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-theme-primary border-b border-theme">
                                    <th className="w-12 py-3 px-5">
                                        <input
                                            type="checkbox"
                                            checked={selectedItems.length === deletedItems.length && deletedItems.length > 0}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 rounded border-theme text-red-600 focus:ring-red-500/20"
                                        />
                                    </th>
                                    <th className="px-5 py-3 text-xs font-semibold text-theme-muted uppercase tracking-wider">Item</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-theme-muted uppercase tracking-wider">Type</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-theme-muted uppercase tracking-wider">Deleted</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-theme-muted uppercase tracking-wider">Reason</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-theme-muted uppercase tracking-wider">Expires</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-theme-muted uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-theme">
                                {deletedItems.map((item) => {
                                    const daysUntilExpiry = getDaysUntilExpiry(item.expires_at);
                                    return (
                                        <tr key={item.id} className="hover:bg-theme-primary transition-colors">
                                            <td className="py-3 px-5">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedItems.includes(item.id)}
                                                    onChange={() => toggleItemSelection(item.id)}
                                                    className="w-4 h-4 rounded border-theme text-red-600 focus:ring-red-500/20"
                                                />
                                            </td>
                                            <td className="py-3 px-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                                                        <span className="text-red-600 dark:text-red-400">
                                                            {getTypeIcon(item.type)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-sm text-theme-primary">{item.name}</p>
                                                        <p className="text-xs text-theme-muted">{formatDate(item.deleted_at)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-5">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getTypeBadgeStyle(item.type)}`}>
                                                    {getTypeLabel(item.type)}
                                                </span>
                                            </td>
                                            <td className="py-3 px-5 text-sm text-theme-secondary">{item.deleted_by}</td>
                                            <td className="py-3 px-5 text-sm text-theme-muted">{item.reason || '—'}</td>
                                            <td className="py-3 px-5">
                                                {daysUntilExpiry !== null ? (
                                                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                                                        daysUntilExpiry <= 7
                                                            ? 'text-red-600 dark:text-red-400'
                                                            : 'text-theme-muted'
                                                    }`}>
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {daysUntilExpiry > 0 ? `${daysUntilExpiry} days` : 'Expired'}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-theme-muted">—</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-5 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {item.can_restore && (
                                                        <button
                                                            onClick={() => setConfirmModal({ type: 'restore', item })}
                                                            className="p-2 text-theme-muted hover:text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                                            title="Restore"
                                                        >
                                                            <RotateCcw size={16} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => setConfirmModal({ type: 'purge', item })}
                                                        className="p-2 text-theme-muted hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        title="Delete permanently"
                                                    >
                                                        <XCircle size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {confirmModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setConfirmModal(null)}>
                    <div className="bg-theme-secondary rounded-xl shadow-theme-lg border border-theme w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-5 border-b border-theme">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                    confirmModal.type === 'restore'
                                        ? 'bg-green-100 dark:bg-green-900/20'
                                        : 'bg-red-100 dark:bg-red-900/20'
                                }`}>
                                    {confirmModal.type === 'restore' ? (
                                        <RotateCcw className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    ) : (
                                        <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                                    )}
                                </div>
                                <h2 className="text-lg font-semibold text-theme-primary">
                                    {confirmModal.type === 'restore' ? 'Restore Item' :
                                     confirmModal.type === 'purge' ? 'Permanently Delete' : 'Empty Recycle Bin'}
                                </h2>
                            </div>
                            <button onClick={() => setConfirmModal(null)} className="text-theme-muted hover:text-theme-primary transition-colors p-1 rounded-lg hover:bg-theme-tertiary">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-5">
                            <p className="text-sm text-theme-secondary">
                                {confirmModal.type === 'restore'
                                    ? `Are you sure you want to restore "${confirmModal.item?.name}"? This will make the item available again in the system.`
                                    : confirmModal.type === 'purge'
                                    ? `Are you sure you want to permanently delete "${confirmModal.item?.name}"? This action cannot be undone.`
                                    : 'Are you sure you want to permanently delete all items in the recycle bin? This action cannot be undone.'}
                            </p>

                            {confirmModal.type !== 'restore' && (
                                <div className="mt-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-lg p-3 flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-red-700 dark:text-red-400">This is a destructive action and cannot be reversed.</p>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end gap-3 p-5 pt-0">
                            <button
                                onClick={() => setConfirmModal(null)}
                                className="px-4 py-2.5 text-sm font-medium text-theme-secondary bg-theme-tertiary hover:bg-theme-primary border border-theme rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (confirmModal.type === 'restore') handleRestore(confirmModal.item);
                                    else if (confirmModal.type === 'purge') handlePurge(confirmModal.item);
                                    else handleEmptyBin();
                                }}
                                className={`px-4 py-2.5 text-sm font-semibold text-white rounded-lg transition-colors ${
                                    confirmModal.type === 'restore'
                                        ? 'bg-green-600 hover:bg-green-700'
                                        : 'bg-red-600 hover:bg-red-700'
                                }`}
                            >
                                {confirmModal.type === 'restore' ? 'Restore' :
                                 confirmModal.type === 'purge' ? 'Delete Forever' : 'Empty Bin'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecycleBin;
