import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Filter, TruckIcon, Package,
  CheckCircle, Clock, Search, X, RefreshCw,
  LayoutGrid, List, GitMerge,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { stockAPI } from '../api/stock';
import { branchesAPI } from '../api/branches';
import PageHeader from '../components/common/PageHeader';
import Modal from '../components/ui/Modal';
import StockTransferFormModal from '../components/stock/StockTransferFormModal';
import StockTransferCard from '../components/stock/StockTransferCard';
import StockTransferListItem from '../components/stock/StockTransferListItem';
import TransferApprovalModal from '../components/stock/TransferApprovalModal';
import { useBranch } from '../context/BranchContext';

const STATUS_TABS = ['All', 'Pending', 'Approved', 'Completed', 'Rejected'];

export const STATUS_STYLES = {
  pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  approved: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  completed: 'bg-green-500/10 text-green-500 border-green-500/20',
  rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
};
export const STATUS_LABELS = {
  pending: 'Pending Approval',
  approved: 'Approved',
  completed: 'Completed',
  rejected: 'Rejected',
};
export const StatusBadge = ({ status }) => (
  <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${STATUS_STYLES[status] || 'bg-theme-tertiary text-theme-muted border-theme'}`}>
    {STATUS_LABELS[status] || status}
  </span>
);

const StockTransfers = () => {
  const { singleBranchMode } = useBranch();

  // In single-branch mode, stock transfers are not applicable
  if (singleBranchMode) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Stock Transfers"
          subtitle="Move stock between branches"
          icon={TruckIcon}
        />
        <div className="bg-theme-secondary border border-theme rounded-xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-accent-gold/10 flex items-center justify-center mx-auto mb-4">
            <GitMerge className="w-8 h-8 text-accent-gold" />
          </div>
          <h3 className="text-lg font-bold text-theme-primary mb-2">Multiple Branches Required</h3>
          <p className="text-sm text-theme-muted max-w-sm mx-auto">
            Stock transfers move inventory between branches. Create a second branch from the <strong>Branches</strong> page to enable transfers.
          </p>
        </div>
      </div>
    );
  }

  const [transfers, setTransfers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState('grid');

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ from_branch: '', to_branch: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('All');

  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalMode, setApprovalMode] = useState('approval');
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [detailTransfer, setDetailTransfer] = useState(null);

  const fetchTransfers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.from_branch) params.from_branch = filters.from_branch;
      if (filters.to_branch) params.to_branch = filters.to_branch;

      const response = await stockAPI.getTransfers(params);
      setTransfers(Array.isArray(response) ? response : (response?.transfers || response?.data || []));
    } catch {
      toast.error('Failed to load stock transfers');
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchBranches = useCallback(async () => {
    try {
      const response = await branchesAPI.getBranches();
      setBranches(Array.isArray(response) ? response : (response?.branches || response?.data || []));
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => { fetchTransfers(); }, [fetchTransfers]);
  useEffect(() => { fetchBranches(); }, [fetchBranches]);

  const handleCreateTransfer = async (transferData) => {
    setSubmitting(true);
    try {
      await stockAPI.createTransfer(transferData);
      toast.success('Stock transfer created successfully');
      setShowTransferForm(false);
      fetchTransfers();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create stock transfer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (approvalData) => {
    try {
      await stockAPI.approveTransfer(selectedTransfer.id, approvalData);
      toast.success('Transfer approved successfully');
      setShowApprovalModal(false);
      setSelectedTransfer(null);
      fetchTransfers();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to approve transfer');
    }
  };

  const handleReject = async (rejectionData) => {
    try {
      await stockAPI.rejectTransfer(selectedTransfer.id, rejectionData);
      toast.success('Transfer rejected');
      setShowApprovalModal(false);
      setSelectedTransfer(null);
      fetchTransfers();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to reject transfer');
    }
  };

  const handleComplete = async (completionData) => {
    try {
      await stockAPI.completeTransfer(selectedTransfer.id, completionData);
      toast.success('Transfer completed successfully');
      setShowApprovalModal(false);
      setSelectedTransfer(null);
      fetchTransfers();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to complete transfer');
    }
  };

  const openApproval = (transfer) => {
    setSelectedTransfer(transfer);
    setApprovalMode('approval');
    setShowApprovalModal(true);
  };

  const openCompletion = (transfer) => {
    setSelectedTransfer(transfer);
    setApprovalMode('completion');
    setShowApprovalModal(true);
  };

  const clearFilters = () => {
    setFilters({ from_branch: '', to_branch: '' });
    setSearchQuery('');
  };

  const filterByTab = (list) => {
    if (activeTab === 'All') return list;
    return list.filter(t => t.status === activeTab.toLowerCase());
  };

  const filterBySearch = (list) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(t =>
      t.transfer_number?.toLowerCase().includes(q) ||
      t.from_branch_name?.toLowerCase().includes(q) ||
      t.to_branch_name?.toLowerCase().includes(q) ||
      t.transfer_reason?.toLowerCase().includes(q)
    );
  };

  const visibleTransfers = filterBySearch(filterByTab(transfers));
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const stats = {
    total: transfers.length,
    pending: transfers.filter(t => t.status === 'pending').length,
    approved: transfers.filter(t => t.status === 'approved').length,
    completed: transfers.filter(t => t.status === 'completed').length,
  };

  const tabCount = (tab) =>
    tab === 'All' ? transfers.length : transfers.filter(t => t.status === tab.toLowerCase()).length;

  const headerActions = (
    <button
      onClick={() => setShowTransferForm(true)}
      className="flex items-center gap-2 px-4 py-2 bg-accent-gold text-white font-semibold text-sm rounded-lg hover:bg-accent-goldDark transition-colors"
    >
      <Plus className="w-4 h-4" />
      Create Transfer
    </button>
  );

  return (
    <div className="space-y-4 sm:space-y-6 max-w-[1700px] mx-auto pb-6 sm:pb-10">
      <PageHeader
        title="Stock Transfers"
        subtitle="Manage inter-branch inventory transfers"
        badge={`${stats.total} Transfers`}
        icon={TruckIcon}
        actions={headerActions}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="p-4 rounded-xl bg-theme-secondary border border-blue-500/40 shadow-theme-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-theme-muted">Total Transfers</p>
            <TruckIcon className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-theme-primary">{stats.total}</p>
        </div>
        <div className="p-4 rounded-xl bg-theme-secondary border border-yellow-500/40 shadow-theme-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-theme-muted">Pending Approval</p>
            <Clock className="w-4 h-4 text-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-theme-primary">{stats.pending}</p>
        </div>
        <div className="p-4 rounded-xl bg-theme-secondary border border-blue-500/40 shadow-theme-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-theme-muted">Approved</p>
            <Package className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-theme-primary">{stats.approved}</p>
        </div>
        <div className="p-4 rounded-xl bg-theme-secondary border border-green-500/40 shadow-theme-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-theme-muted">Completed</p>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-theme-primary">{stats.completed}</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-theme-secondary rounded-xl shadow-theme-sm border border-theme p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-theme-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by transfer number, branch, or reason..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-theme-primary border border-theme rounded-lg text-sm text-theme-primary placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-theme rounded-lg bg-theme-tertiary overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                title="Grid View"
                className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-accent-gold text-white' : 'text-theme-muted hover:text-theme-primary'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                title="List View"
                className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-accent-gold text-white' : 'text-theme-muted hover:text-theme-primary'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors min-h-[38px] ${
                showFilters || activeFilterCount > 0
                  ? 'border-accent-gold text-accent-gold'
                  : 'border-theme text-theme-secondary hover:bg-theme-tertiary'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>
            <button
              onClick={fetchTransfers}
              className="flex items-center gap-2 px-3 py-2 border border-theme rounded-lg text-theme-secondary hover:bg-theme-tertiary transition-colors min-h-[38px]"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-theme">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">From Branch</label>
                <select
                  value={filters.from_branch}
                  onChange={e => setFilters(f => ({ ...f, from_branch: e.target.value }))}
                  className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30"
                >
                  <option value="">All Branches</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">To Branch</label>
                <select
                  value={filters.to_branch}
                  onChange={e => setFilters(f => ({ ...f, to_branch: e.target.value }))}
                  className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30"
                >
                  <option value="">All Branches</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
                </select>
              </div>
            </div>
            <button
              onClick={clearFilters}
              className="mt-3 flex items-center gap-1 text-sm text-theme-muted hover:text-theme-primary transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Status Tabs + Content */}
      <div className="bg-theme-secondary rounded-xl shadow-theme-sm border border-theme overflow-hidden">
        <div className="flex border-b border-theme overflow-x-auto">
          {STATUS_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab
                  ? 'border-accent-gold text-accent-gold'
                  : 'border-transparent text-theme-muted hover:text-theme-primary'
              }`}
            >
              {tab}
              <span className="ml-1.5 text-xs text-theme-muted">({tabCount(tab)})</span>
            </button>
          ))}
        </div>

        <div className="p-4 md:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-theme border-t-accent-gold rounded-full animate-spin" />
            </div>
          ) : visibleTransfers.length === 0 ? (
            <div className="text-center py-16">
              <TruckIcon className="w-12 h-12 text-theme-muted mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-theme-primary mb-1">No transfers found</h3>
              <p className="text-sm text-theme-muted mb-6">
                {searchQuery || activeFilterCount > 0
                  ? 'Try adjusting your search or filters'
                  : 'No stock transfers have been created yet'}
              </p>
              <button
                onClick={() => setShowTransferForm(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-gold text-white font-semibold text-sm rounded-lg hover:bg-accent-goldDark transition-colors"
              >
                <Plus className="w-4 h-4" /> Create Transfer
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleTransfers.map(transfer => (
                <StockTransferCard
                  key={transfer.id}
                  transferData={transfer}
                  onView={setDetailTransfer}
                  onApprove={openApproval}
                  onReject={openApproval}
                  onComplete={openCompletion}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {visibleTransfers.map(transfer => (
                <StockTransferListItem
                  key={transfer.id}
                  transferData={transfer}
                  onView={setDetailTransfer}
                  onApprove={openApproval}
                  onReject={openApproval}
                  onComplete={openCompletion}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Transfer Modal */}
      <StockTransferFormModal
        isOpen={showTransferForm}
        onClose={() => setShowTransferForm(false)}
        onSubmit={handleCreateTransfer}
        branches={branches}
        loading={submitting}
      />

      {/* Approval / Completion Modal */}
      <TransferApprovalModal
        isOpen={showApprovalModal}
        onClose={() => { setShowApprovalModal(false); setSelectedTransfer(null); }}
        onApprove={handleApprove}
        onReject={handleReject}
        onComplete={handleComplete}
        transferData={selectedTransfer}
        mode={approvalMode}
      />

      {/* Detail View Modal */}
      {detailTransfer && (
        <Modal
          isOpen={!!detailTransfer}
          onClose={() => setDetailTransfer(null)}
          title="Transfer Details"
          size="md"
        >
          <div className="space-y-4">
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-theme-primary">{detailTransfer.transfer_number}</p>
                <StatusBadge status={detailTransfer.status} />
              </div>
              <p className="text-sm text-theme-muted">{detailTransfer.transfer_reason}</p>
            </div>

            <div className="flex items-center gap-3 p-3 bg-theme-tertiary rounded-lg">
              <div className="flex-1 text-center">
                <p className="text-xs text-theme-muted mb-0.5">From</p>
                <p className="text-sm font-semibold text-theme-primary">{detailTransfer.from_branch_name}</p>
              </div>
              <TruckIcon className="w-5 h-5 text-accent-gold flex-shrink-0" />
              <div className="flex-1 text-center">
                <p className="text-xs text-theme-muted mb-0.5">To</p>
                <p className="text-sm font-semibold text-theme-primary">{detailTransfer.to_branch_name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-theme-tertiary rounded-lg">
                <p className="text-xs text-theme-muted mb-0.5">Total Units</p>
                <p className="text-xl font-bold text-accent-gold">{detailTransfer.total_quantity ?? '—'}</p>
              </div>
              <div className="p-3 bg-theme-tertiary rounded-lg">
                <p className="text-xs text-theme-muted mb-0.5">Products</p>
                <p className="text-xl font-bold text-theme-primary">{detailTransfer.total_items ?? '—'}</p>
              </div>
            </div>

            {detailTransfer.notes && (
              <div>
                <p className="text-xs font-medium text-theme-secondary mb-1">Notes</p>
                <p className="text-sm text-theme-secondary bg-theme-tertiary p-3 rounded-lg">{detailTransfer.notes}</p>
              </div>
            )}

            <div className="text-xs text-theme-muted space-y-1 pt-2 border-t border-theme">
              <p>
                Created: {new Date(detailTransfer.created_at).toLocaleString()}
                {detailTransfer.initiated_by_name && ` by ${detailTransfer.initiated_by_name}`}
              </p>
              {detailTransfer.approved_at && (
                <p>
                  Approved: {new Date(detailTransfer.approved_at).toLocaleString()}
                  {detailTransfer.approved_by_name && ` by ${detailTransfer.approved_by_name}`}
                </p>
              )}
              {detailTransfer.completed_at && (
                <p>Completed: {new Date(detailTransfer.completed_at).toLocaleString()}</p>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default StockTransfers;
