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
    Filter,
    Clock,
    XCircle
} from 'lucide-react';
import { Button, SearchBar, LoadingSpinner, EmptyState, ConfirmDialog, Badge, Tabs } from '../components/ui';
import { toast } from 'react-toastify';
import { recyclebinAPI } from '../api/recyclebin';

/**
 * RecycleBin Page
 * Manage and recover deleted items
 */
const RecycleBin = () => {
    const [loading, setLoading] = useState(true);
    const [deletedItems, setDeletedItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState('all');
    const [selectedItems, setSelectedItems] = useState([]);
    const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
    const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
    const [itemToRestore, setItemToRestore] = useState(null);
    const [itemToPurge, setItemToPurge] = useState(null);

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
            // Remove undefined values
            Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

            const response = await recyclebinAPI.getDeletedItems(params);
            const items = response.items || response.data || response || [];

            // Map response to expected format
            setDeletedItems(items.map(item => ({
                id: item.id,
                type: item.type || item.item_type,
                name: item.name || item.item_name,
                deleted_at: item.deleted_at,
                deleted_by: item.deleted_by || item.deleted_by_name || 'Unknown',
                reason: item.reason || item.deletion_reason || '',
                can_restore: item.can_restore ?? true,
                expires_at: item.expires_at || item.expiry_date
            })));
        } catch (error) {
            console.error('Error fetching deleted items:', error);
            toast.error('Failed to load deleted items');
        } finally {
            setLoading(false);
        }
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
        setShowRestoreConfirm(false);
        setItemToRestore(null);
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
        setShowPurgeConfirm(false);
        setItemToPurge(null);
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
                return <Package className="w-5 h-5 text-blue-500" />;
            case 'customer':
                return <Users className="w-5 h-5 text-green-500" />;
            case 'sale':
                return <ShoppingCart className="w-5 h-5 text-purple-500" />;
            case 'purchase_order':
                return <FileText className="w-5 h-5 text-orange-500" />;
            default:
                return <Trash2 className="w-5 h-5 text-gray-500" />;
        }
    };

    const getTypeBadge = (type) => {
        const typeLabels = {
            product: { label: 'Product', variant: 'info' },
            customer: { label: 'Customer', variant: 'success' },
            sale: { label: 'Sale', variant: 'primary' },
            purchase_order: { label: 'Purchase Order', variant: 'warning' }
        };
        const config = typeLabels[type] || { label: type, variant: 'default' };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getDaysUntilExpiry = (expiryDate) => {
        const now = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const typeFilters = [
        { value: 'all', label: 'All Items' },
        { value: 'product', label: 'Products' },
        { value: 'customer', label: 'Customers' },
        { value: 'sale', label: 'Sales' },
        { value: 'purchase_order', label: 'Purchase Orders' }
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-100 rounded-xl">
                        <Trash2 className="w-8 h-8 text-red-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Recycle Bin</h1>
                        <p className="text-gray-600">Restore or permanently delete items</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {selectedItems.length > 0 && (
                        <Button variant="outline" icon={RotateCcw} onClick={handleBulkRestore}>
                            Restore Selected ({selectedItems.length})
                        </Button>
                    )}
                    <Button variant="danger" icon={Trash2} onClick={() => setShowPurgeConfirm(true)}>
                        Empty Bin
                    </Button>
                </div>
            </div>

            {/* Warning Banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="font-medium text-amber-800">Items are automatically deleted after 30 days</p>
                    <p className="text-sm text-amber-700 mt-1">
                        Restore items before they expire to recover your data. Permanently deleted items cannot be recovered.
                    </p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <SearchBar
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Search deleted items..."
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        {typeFilters.map((filter) => (
                            <button
                                key={filter.value}
                                onClick={() => setSelectedType(filter.value)}
                                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                    selectedType === filter.value
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                <div className="flex items-center justify-center py-20">
                    <LoadingSpinner size="lg" />
                </div>
            ) : deletedItems.length === 0 ? (
                <EmptyState
                    icon={Trash2}
                    title="Recycle bin is empty"
                    description="No deleted items to display"
                />
            ) : (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="w-12 py-3 px-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedItems.length === deletedItems.length}
                                        onChange={toggleSelectAll}
                                        className="rounded border-gray-300"
                                    />
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Item</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Type</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Deleted By</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Reason</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Expires In</th>
                                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {deletedItems.map((item) => {
                                const daysUntilExpiry = getDaysUntilExpiry(item.expires_at);
                                return (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="py-3 px-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedItems.includes(item.id)}
                                                onChange={() => toggleItemSelection(item.id)}
                                                className="rounded border-gray-300"
                                            />
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                {getTypeIcon(item.type)}
                                                <div>
                                                    <p className="font-medium text-gray-900">{item.name}</p>
                                                    <p className="text-xs text-gray-500">{formatDate(item.deleted_at)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">{getTypeBadge(item.type)}</td>
                                        <td className="py-3 px-4 text-sm text-gray-600">{item.deleted_by}</td>
                                        <td className="py-3 px-4 text-sm text-gray-600">{item.reason}</td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center gap-1 text-sm font-medium ${
                                                daysUntilExpiry <= 7 ? 'text-red-600' : 'text-gray-600'
                                            }`}>
                                                <Clock className="w-4 h-4" />
                                                {daysUntilExpiry} days
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {item.can_restore && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        icon={RotateCcw}
                                                        onClick={() => {
                                                            setItemToRestore(item);
                                                            setShowRestoreConfirm(true);
                                                        }}
                                                    >
                                                        Restore
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    icon={XCircle}
                                                    className="text-red-600 hover:bg-red-50"
                                                    onClick={() => {
                                                        setItemToPurge(item);
                                                        setShowPurgeConfirm(true);
                                                    }}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Restore Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showRestoreConfirm}
                onClose={() => {
                    setShowRestoreConfirm(false);
                    setItemToRestore(null);
                }}
                onConfirm={() => handleRestore(itemToRestore)}
                title="Restore Item"
                message={`Are you sure you want to restore "${itemToRestore?.name}"? This will make the item available again in the system.`}
                confirmText="Restore"
                variant="primary"
            />

            {/* Purge Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showPurgeConfirm && itemToPurge}
                onClose={() => {
                    setShowPurgeConfirm(false);
                    setItemToPurge(null);
                }}
                onConfirm={() => handlePurge(itemToPurge)}
                title="Permanently Delete"
                message={`Are you sure you want to permanently delete "${itemToPurge?.name}"? This action cannot be undone.`}
                confirmText="Delete Forever"
                variant="danger"
            />

            {/* Empty Bin Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showPurgeConfirm && !itemToPurge}
                onClose={() => setShowPurgeConfirm(false)}
                onConfirm={handleEmptyBin}
                title="Empty Recycle Bin"
                message="Are you sure you want to permanently delete all items in the recycle bin? This action cannot be undone."
                confirmText="Empty Bin"
                variant="danger"
            />
        </div>
    );
};

export default RecycleBin;
