import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import PageHeader from '../components/common/PageHeader';
import {
  Trash2,
  AlertTriangle,
  Search,
  Filter,
  Package,
  Users,
  UserX,
  ShoppingCart,
  FileText,
  Truck,
  Building2,
  XCircle,
  X,
  Loader2,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const PurgeManagementPage = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedItems, setSelectedItems] = useState([]);
  const [confirmModal, setConfirmModal] = useState(null);
  const [purging, setPurging] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchItems();
    setCurrentPage(1);
    setSelectedItems([]);
  }, [typeFilter, searchTerm]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const params = { limit: 500 };
      if (typeFilter !== 'all') params.entity_type = typeFilter;
      if (searchTerm) params.search = searchTerm;

      const response = await api.get('/recycle-bin', { params });
      const data = response.data;
      const rawItems = data.items || data.data || data || [];

      setItems(rawItems.map(item => ({
        id: item.id,
        type: item.type || item.item_type || item.entity_type || 'unknown',
        name: item.name || item.item_name || getEntityName(item),
        deleted_at: item.deleted_at,
        deleted_by: item.deleted_by || item.deleted_by_name || 'System'
      })));
    } catch (error) {
      console.error('Error fetching recycle bin items:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEntityName = (item) => {
    if (item.entity_data) {
      const data = typeof item.entity_data === 'string' ? JSON.parse(item.entity_data) : item.entity_data;
      return data.name || data.product_name || data.full_name || data.company_name || `${item.entity_type || 'Item'} #${item.entity_id || item.id}`;
    }
    return `${item.entity_type || 'Item'} #${item.entity_id || item.id}`;
  };

  const handlePurgeSingle = async (item) => {
    try {
      setPurging(true);
      await api.delete(`/recycle-bin/${item.id}/purge`);
      setItems(prev => prev.filter(i => i.id !== item.id));
      setSelectedItems(prev => prev.filter(id => id !== item.id));
    } catch (error) {
      console.error('Error purging item:', error);
      alert(error.response?.data?.message || 'Failed to permanently delete item');
    } finally {
      setPurging(false);
      setConfirmModal(null);
    }
  };

  const handleBulkPurge = async () => {
    try {
      setPurging(true);
      const itemsToPurge = items
        .filter(item => selectedItems.includes(item.id))
        .map(item => ({ type: item.type, id: item.id }));

      await api.post('/recycle-bin/purge-bulk', { items: itemsToPurge });
      setItems(prev => prev.filter(i => !selectedItems.includes(i.id)));
      setSelectedItems([]);
    } catch (error) {
      console.error('Error bulk purging:', error);
      alert(error.response?.data?.message || 'Failed to permanently delete selected items');
    } finally {
      setPurging(false);
      setConfirmModal(null);
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
    const pageIds = paginatedItems.map(item => item.id);
    const allPageSelected = pageIds.every(id => selectedItems.includes(id));
    if (allPageSelected) {
      setSelectedItems(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedItems(prev => [...new Set([...prev, ...pageIds])]);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'product': return <Package className="w-4 h-4" />;
      case 'user': return <UserX className="w-4 h-4" />;
      case 'customer': return <Users className="w-4 h-4" />;
      case 'sale': return <ShoppingCart className="w-4 h-4" />;
      case 'supplier': return <Truck className="w-4 h-4" />;
      case 'branch': return <Building2 className="w-4 h-4" />;
      case 'purchase_order': return <FileText className="w-4 h-4" />;
      default: return <Trash2 className="w-4 h-4" />;
    }
  };

  const getTypeBadgeStyle = (type) => {
    switch (type) {
      case 'product': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'user': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400';
      case 'customer': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'sale': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
      case 'supplier': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400';
      case 'branch': return 'bg-teal-100 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400';
      case 'purchase_order': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      product: 'Product',
      user: 'User',
      customer: 'Customer',
      sale: 'Sale',
      supplier: 'Supplier',
      branch: 'Branch',
      purchase_order: 'Purchase Order'
    };
    return labels[type] || (type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Unknown');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFilteredItems = () => {
    return items.filter(item => {
      const matchesSearch = !searchTerm ||
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || item.type === typeFilter;
      return matchesSearch && matchesType;
    });
  };

  const filteredItems = getFilteredItems();

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const typeFilters = [
    { value: 'all', label: 'All Items' },
    { value: 'product', label: 'Products' },
    { value: 'user', label: 'Users' },
    { value: 'customer', label: 'Customers' },
    { value: 'branch', label: 'Branches' },
    { value: 'sale', label: 'Sales' },
    { value: 'supplier', label: 'Suppliers' },
    { value: 'purchase_order', label: 'Orders' }
  ];

  const actions = (
    <div className="flex items-center gap-3">
      {selectedItems.length > 0 && (
        <button
          onClick={() => setConfirmModal({ type: 'bulk' })}
          disabled={purging}
          className="px-4 py-2.5 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Trash2 size={16} />
          Purge Selected ({selectedItems.length})
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
      <PageHeader
        title="Purge Management"
        subtitle="Permanently delete items from the recycle bin"
        icon={Trash2}
        badge={!loading && items.length > 0 ? `${items.length} items` : undefined}
        actions={actions}
      />

      {/* Warning Banner */}
      <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <p className="font-semibold text-sm text-red-800 dark:text-red-300">Permanent Deletion Warning</p>
          <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">
            Items purged from this page are permanently destroyed and cannot be recovered. Double-check before proceeding with any purge action.
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-theme-secondary rounded-xl border border-theme p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted w-4 h-4 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search items to purge..."
              className="pl-10 pr-4 py-2.5 border border-theme rounded-lg w-full bg-theme-primary text-sm text-theme-primary focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all placeholder-theme-muted"
            />
          </div>
          <div className="flex items-center gap-1.5 bg-theme-tertiary rounded-lg p-1">
            {typeFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setTypeFilter(filter.value)}
                className={`px-3 py-2 text-xs font-medium rounded-md transition-all ${
                  typeFilter === filter.value
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

      {/* Items Table */}
      {loading ? (
        <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-theme-primary border-b border-theme">
                  <th className="w-12 py-3 px-5"></th>
                  <th className="px-5 py-3 text-xs font-semibold text-theme-muted uppercase">Item</th>
                  <th className="px-5 py-3 text-xs font-semibold text-theme-muted uppercase">Type</th>
                  <th className="px-5 py-3 text-xs font-semibold text-theme-muted uppercase">Deleted By</th>
                  <th className="px-5 py-3 text-xs font-semibold text-theme-muted uppercase">Deleted At</th>
                  <th className="px-5 py-3 text-xs font-semibold text-theme-muted uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme">
                {Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-5"><div className="w-4 h-4 bg-theme-tertiary rounded"></div></td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-theme-tertiary rounded-lg"></div>
                        <div className="h-4 w-32 bg-theme-tertiary rounded"></div>
                      </div>
                    </td>
                    <td className="py-4 px-5"><div className="h-5 w-16 bg-theme-tertiary rounded-full"></div></td>
                    <td className="py-4 px-5"><div className="h-4 w-20 bg-theme-tertiary rounded"></div></td>
                    <td className="py-4 px-5"><div className="h-4 w-28 bg-theme-tertiary rounded"></div></td>
                    <td className="py-4 px-5"><div className="h-8 w-20 bg-theme-tertiary rounded ml-auto"></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-theme-tertiary rounded-full flex items-center justify-center text-theme-muted">
              <Trash2 size={32} />
            </div>
            <div className="text-center">
              <p className="font-semibold text-theme-primary text-lg">No items to purge</p>
              <p className="text-theme-muted text-sm mt-1">
                {searchTerm || typeFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'The recycle bin is empty.'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-theme-primary border-b border-theme">
                  <th className="w-12 py-3 px-5">
                    <input
                      type="checkbox"
                      checked={paginatedItems.length > 0 && paginatedItems.every(item => selectedItems.includes(item.id))}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-theme text-red-600 focus:ring-red-500/20"
                    />
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold text-theme-muted uppercase">Item</th>
                  <th className="px-5 py-3 text-xs font-semibold text-theme-muted uppercase">Type</th>
                  <th className="px-5 py-3 text-xs font-semibold text-theme-muted uppercase">Deleted By</th>
                  <th className="px-5 py-3 text-xs font-semibold text-theme-muted uppercase">Deleted At</th>
                  <th className="px-5 py-3 text-xs font-semibold text-theme-muted uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme">
                {paginatedItems.map((item) => (
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
                        <p className="font-semibold text-sm text-theme-primary">{item.name}</p>
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getTypeBadgeStyle(item.type)}`}>
                        {getTypeLabel(item.type)}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-sm text-theme-secondary">{item.deleted_by}</td>
                    <td className="py-3 px-5 text-sm text-theme-muted">{formatDate(item.deleted_at)}</td>
                    <td className="py-3 px-5 text-right">
                      <button
                        onClick={() => setConfirmModal({ type: 'single', item })}
                        disabled={purging}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 dark:bg-red-900/10 dark:hover:bg-red-600 border border-red-200 dark:border-red-800/30 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <XCircle size={14} />
                        Purge
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredItems.length > 0 && (
        <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-sm text-theme-muted">
            <span>Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-theme-tertiary border border-theme rounded-lg px-2 py-1.5 text-sm text-theme-primary focus:outline-none focus:ring-2 focus:ring-red-500/20"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>per page</span>
            <span className="mx-2 text-theme-muted">|</span>
            <span>
              {Math.min((currentPage - 1) * itemsPerPage + 1, filteredItems.length)}–{Math.min(currentPage * itemsPerPage, filteredItems.length)} of {filteredItems.length} items
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-theme-tertiary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let page;
              if (totalPages <= 7) {
                page = i + 1;
              } else if (currentPage <= 4) {
                page = i + 1;
              } else if (currentPage >= totalPages - 3) {
                page = totalPages - 6 + i;
              } else {
                page = currentPage - 3 + i;
              }
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-red-600 text-white'
                      : 'text-theme-muted hover:text-theme-primary hover:bg-theme-tertiary'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-theme-tertiary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setConfirmModal(null)}>
          <div className="bg-theme-secondary rounded-xl shadow-theme-lg border border-theme w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-theme">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-lg font-semibold text-theme-primary">
                  {confirmModal.type === 'single' ? 'Permanently Delete Item' : 'Bulk Permanent Delete'}
                </h2>
              </div>
              <button onClick={() => setConfirmModal(null)} className="text-theme-muted hover:text-theme-primary transition-colors p-1 rounded-lg hover:bg-theme-tertiary">
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-theme-secondary">
                {confirmModal.type === 'single'
                  ? `Are you sure you want to permanently delete "${confirmModal.item?.name}"? This action cannot be undone.`
                  : `Are you sure you want to permanently delete ${selectedItems.length} selected item${selectedItems.length !== 1 ? 's' : ''}? This action cannot be undone.`
                }
              </p>
              <div className="mt-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 dark:text-red-400">This is a destructive action and cannot be reversed. All data associated with the selected item(s) will be lost forever.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 pt-0">
              <button
                onClick={() => setConfirmModal(null)}
                disabled={purging}
                className="px-4 py-2.5 text-sm font-medium text-theme-secondary bg-theme-tertiary hover:bg-theme-primary border border-theme rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmModal.type === 'single') {
                    handlePurgeSingle(confirmModal.item);
                  } else {
                    handleBulkPurge();
                  }
                }}
                disabled={purging}
                className="px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {purging && <Loader2 size={14} className="animate-spin" />}
                {purging ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurgeManagementPage;
