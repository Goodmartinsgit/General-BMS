import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import {
  Package, Search, Filter, RefreshCw, AlertTriangle,
  History, LayoutGrid, List, Warehouse,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import InventoryUpdateModal from '../components/InventoryUpdateModal';
import PageHeader from '../components/common/PageHeader';
import { useBranch } from '../context/BranchContext';

const LOW_STOCK_THRESHOLD = 10;

const InventoryPage = () => {
  const { singleBranchMode, branches, currentBranchId } = useBranch();
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // In single-branch mode, auto-set the branch filter to current branch
  useEffect(() => {
    if (singleBranchMode && currentBranchId) {
      setBranchFilter(String(currentBranchId));
    } else if (!singleBranchMode) {
      setBranchFilter('');
    }
  }, [singleBranchMode, currentBranchId]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [invRes, prodRes] = await Promise.all([
        api.get('/inventory'),
        api.get('/products'),
      ]);
      setInventory(invRes.data || []);
      setProducts(prodRes.data?.products || []);
    } catch (err) {
      toast.error('Failed to load inventory');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateStock = async (formData) => {
    try {
      setSubmitLoading(true);
      await api.post('/inventory/update', formData);
      setIsModalOpen(false);
      toast.success('Stock updated successfully');
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update stock');
    } finally {
      setSubmitLoading(false);
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch =
      item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product_code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBranch = branchFilter ? String(item.branch_id) === branchFilter : true;
    const isLow = item.quantity_on_hand <= LOW_STOCK_THRESHOLD;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'low' && isLow) ||
      (statusFilter === 'ok' && !isLow);
    return matchesSearch && matchesBranch && matchesStatus;
  });

  // Stats
  const totalItems = inventory.length;
  const lowStockItems = inventory.filter(i => i.quantity_on_hand <= LOW_STOCK_THRESHOLD).length;
  const totalUnits = inventory.reduce((s, i) => s + (i.quantity_on_hand || 0), 0);

  const stats = [
    {
      label: 'Total Items',
      value: totalItems,
      icon: Package,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Total Units',
      value: totalUnits.toLocaleString(),
      icon: Warehouse,
      color: 'text-accent-gold',
      bg: 'bg-accent-gold/10',
    },
    {
      label: 'Low Stock',
      value: lowStockItems,
      icon: AlertTriangle,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Inventory"
        subtitle={singleBranchMode ? 'Track stock levels' : 'Track stock levels across all branches'}
        icon={Package}
        badge={totalItems > 0 ? `${totalItems} items` : null}
        actions={
          <>
            <Link
              to="/inventory/movements"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-theme-secondary bg-theme-secondary border border-theme rounded-lg hover:bg-theme-tertiary transition-colors"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Audit Trail</span>
            </Link>
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-theme-secondary bg-theme-secondary border border-theme rounded-lg hover:bg-theme-tertiary transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-accent-gold rounded-lg hover:bg-accent-goldDark transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Update Stock
            </button>
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-theme-secondary border border-theme rounded-xl p-3 sm:p-4 flex items-center gap-3"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl font-bold text-theme-primary leading-tight">{value}</p>
              <p className="text-[10px] sm:text-xs text-theme-muted">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-theme-secondary border border-theme rounded-xl p-3 sm:p-4 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-theme-primary border border-theme text-theme-primary text-sm rounded-lg placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 transition-all"
          />
        </div>

        {/* Branch filter — hidden in single-branch mode */}
        {!singleBranchMode && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-theme-muted flex-shrink-0" />
            <select
              value={branchFilter}
              onChange={e => setBranchFilter(e.target.value)}
              className="bg-theme-primary border border-theme text-theme-primary text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 transition-all"
            >
              <option value="">All Branches</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.branch_name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Status filter tabs */}
        <div className="flex items-center bg-theme-tertiary border border-theme rounded-lg p-0.5 gap-0.5">
          {[
            { key: 'all', label: 'All' },
            { key: 'low', label: 'Low Stock' },
            { key: 'ok', label: 'OK' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                statusFilter === key
                  ? 'bg-accent-gold text-white shadow-sm'
                  : 'text-theme-muted hover:text-theme-primary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-theme-tertiary border border-theme rounded-lg p-0.5 gap-0.5 ml-auto">
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-accent-gold text-white' : 'text-theme-muted hover:text-theme-primary'}`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-accent-gold text-white' : 'text-theme-muted hover:text-theme-primary'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-theme border-t-accent-gold rounded-full animate-spin" />
        </div>
      ) : filteredInventory.length === 0 ? (
        <div className="bg-theme-secondary border border-theme rounded-xl p-12 text-center">
          <Package className="w-12 h-12 text-theme-muted mx-auto mb-3 opacity-40" />
          <p className="text-theme-muted text-sm">
            {searchTerm || branchFilter || statusFilter !== 'all'
              ? 'No items match your filters'
              : 'No inventory data available'}
          </p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-theme-secondary border border-theme rounded-xl overflow-hidden shadow-theme-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-theme-tertiary border-b border-theme">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-xs font-semibold text-theme-muted uppercase tracking-wider">Product</th>
                  {!singleBranchMode && <th className="px-4 sm:px-6 py-3 text-xs font-semibold text-theme-muted uppercase tracking-wider hidden md:table-cell">Branch</th>}
                  <th className="px-4 sm:px-6 py-3 text-xs font-semibold text-theme-muted uppercase tracking-wider">On Hand</th>
                  <th className="px-4 sm:px-6 py-3 text-xs font-semibold text-theme-muted uppercase tracking-wider hidden lg:table-cell">Reserved</th>
                  <th className="px-4 sm:px-6 py-3 text-xs font-semibold text-theme-muted uppercase tracking-wider text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme">
                {filteredInventory.map(item => {
                  const isLow = item.quantity_on_hand <= LOW_STOCK_THRESHOLD;
                  return (
                    <tr key={item.id} className="hover:bg-theme-tertiary/50 transition-colors">
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <p className="font-medium text-theme-primary text-sm">{item.product_name}</p>
                        <p className="text-xs text-theme-muted font-mono">{item.product_code}</p>
                      </td>
                      {!singleBranchMode && (
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-theme-secondary text-sm hidden md:table-cell">
                          {item.branch_name}
                        </td>
                      )}
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <span className={`text-lg font-bold ${isLow ? 'text-red-500' : 'text-theme-primary'}`}>
                          {item.quantity_on_hand}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-theme-muted text-sm hidden lg:table-cell">
                        {item.quantity_reserved ?? 0}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <div className="flex justify-center">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded border bg-red-500/10 text-red-500 border-red-500/20">
                              <AlertTriangle className="w-3 h-3" /> Low
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold rounded border bg-green-500/10 text-green-500 border-green-500/20">
                              OK
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 sm:px-6 py-3 border-t border-theme bg-theme-tertiary flex items-center justify-between">
            <p className="text-xs text-theme-muted">
              Showing {filteredInventory.length} of {inventory.length} items
            </p>
          </div>
        </div>
      ) : (
        // Grid view
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredInventory.map(item => {
            const isLow = item.quantity_on_hand <= LOW_STOCK_THRESHOLD;
            return (
              <div
                key={item.id}
                className="bg-theme-secondary border border-theme rounded-xl p-4 flex flex-col gap-3 hover:shadow-theme-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-theme-primary text-sm leading-tight truncate">{item.product_name}</p>
                    <p className="text-xs font-mono text-theme-muted mt-0.5">{item.product_code}</p>
                  </div>
                  {isLow ? (
                    <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded border bg-red-500/10 text-red-500 border-red-500/20">
                      <AlertTriangle className="w-3 h-3" /> Low
                    </span>
                  ) : (
                    <span className="flex-shrink-0 inline-flex px-2 py-0.5 text-[10px] font-bold rounded border bg-green-500/10 text-green-500 border-green-500/20">
                      OK
                    </span>
                  )}
                </div>

                <div className={`p-2.5 rounded-lg border ${isLow ? 'bg-red-500/10 border-red-500/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
                  <p className="text-xs text-theme-muted">Units on Hand</p>
                  <p className={`text-2xl font-bold ${isLow ? 'text-red-500' : 'text-blue-500'}`}>{item.quantity_on_hand}</p>
                  {item.quantity_reserved > 0 && (
                    <p className="text-[10px] text-theme-muted mt-0.5">{item.quantity_reserved} reserved</p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-theme-muted">
                  <Warehouse className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{item.branch_name}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <InventoryUpdateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleUpdateStock}
        products={products}
        branches={branches}
        loading={submitLoading}
      />
      {/* Note: InventoryUpdateModal reads singleBranchMode + currentBranchId from BranchContext internally */}
    </div>
  );
};

export default InventoryPage;
