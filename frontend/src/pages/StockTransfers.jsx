import React, { useState, useEffect } from 'react';
import {
  Plus,
  Filter,
  Download,
  TruckIcon,
  Package,
  CheckCircle,
  Clock,
  Grid,
  List,
} from 'lucide-react';
import {
  Button,
  SearchBar,
  ViewModeToggle,
  Badge,
  LoadingSpinner,
  EmptyState,
  Tabs,
  Modal,
} from '../components/ui';
import {
  StockTransferFormModal,
  StockTransferCard,
  StockTransferListItem,
  TransferApprovalModal,
} from '../components/stock';
import { stockAPI } from '../api/stock';
import { branchesAPI } from '../api/branches';
import { toast } from 'react-toastify';

/**
 * StockTransfers Page
 * Manage inter-branch stock transfers
 */
const StockTransfers = () => {
  // State
  const [transfers, setTransfers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    from_branch: '',
    to_branch: '',
    date_range: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalMode, setApprovalMode] = useState('approval'); // 'approval' or 'completion'
  const [selectedTransfer, setSelectedTransfer] = useState(null);

  // Statistics
  const [stats, setStats] = useState({
    total_transfers: 0,
    pending_approvals: 0,
    approved_transfers: 0,
    completed_transfers: 0,
  });

  // Fetch transfers
  useEffect(() => {
    fetchTransfers();
  }, [searchQuery, filters]);

  // Fetch branches
  useEffect(() => {
    fetchBranches();
  }, []);

  // Fetch stats
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const params = {
        search: searchQuery,
        status: filters.status !== 'all' ? filters.status : undefined,
        from_branch: filters.from_branch || undefined,
        to_branch: filters.to_branch || undefined,
        date_range: filters.date_range || undefined,
      };

      const response = await stockAPI.getTransfers(params);
      setTransfers(response.transfers || response.data || response || []);
    } catch (error) {
      console.error('Error fetching transfers:', error);
      toast.error('Failed to load stock transfers');
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await branchesAPI.getBranches();
      setBranches(response.branches || response.data || response || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
      setBranches([]);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await stockAPI.getStats();
      setStats(response.stats || response || {
        total_transfers: 0,
        pending_approvals: 0,
        approved_transfers: 0,
        completed_transfers: 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreateTransfer = async (transferData) => {
    try {
      await stockAPI.createTransfer(transferData);
      toast.success('Stock transfer created successfully');
      await fetchTransfers();
      await fetchStats();
      setShowTransferForm(false);
    } catch (error) {
      console.error('Error creating transfer:', error);
      toast.error('Failed to create stock transfer');
    }
  };

  const handleApproveTransfer = async (approvalData) => {
    try {
      await stockAPI.approveTransfer(approvalData.transfer_id || selectedTransfer.id, approvalData);
      toast.success('Transfer approved successfully');
      await fetchTransfers();
      await fetchStats();
      setShowApprovalModal(false);
      setSelectedTransfer(null);
    } catch (error) {
      console.error('Error approving transfer:', error);
      toast.error('Failed to approve transfer');
    }
  };

  const handleRejectTransfer = async (rejectionData) => {
    try {
      await stockAPI.rejectTransfer(rejectionData.transfer_id || selectedTransfer.id, rejectionData);
      toast.success('Transfer rejected');
      await fetchTransfers();
      await fetchStats();
      setShowApprovalModal(false);
      setSelectedTransfer(null);
    } catch (error) {
      console.error('Error rejecting transfer:', error);
      toast.error('Failed to reject transfer');
    }
  };

  const handleCompleteTransfer = async (completionData) => {
    try {
      await stockAPI.completeTransfer(completionData.transfer_id || selectedTransfer.id, completionData);
      toast.success('Transfer completed successfully');
      await fetchTransfers();
      await fetchStats();
      setShowApprovalModal(false);
      setSelectedTransfer(null);
    } catch (error) {
      console.error('Error completing transfer:', error);
      toast.error('Failed to complete transfer');
    }
  };

  const handleViewTransfer = (transferData) => {
    // Can open a detail modal here if needed
    console.log('View transfer:', transferData);
  };

  const handleExport = () => {
    // TODO: Implement export to CSV
    console.log('Export transfers');
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      from_branch: '',
      to_branch: '',
      date_range: '',
    });
    setSearchQuery('');
  };

  // Filter transfers by status for tabs
  const filterByStatus = (status) => {
    if (status === 'all') return transfers;
    if (status === 'pending') return transfers.filter((t) => t.status === 'pending');
    if (status === 'approved') return transfers.filter((t) => t.status === 'approved');
    if (status === 'completed') return transfers.filter((t) => t.status === 'completed');
    if (status === 'rejected') return transfers.filter((t) => t.status === 'rejected');
    return transfers;
  };

  const tabs = [
    {
      label: 'All',
      count: transfers.length,
      content: renderTransfers(transfers),
    },
    {
      label: 'Pending',
      count: filterByStatus('pending').length,
      content: renderTransfers(filterByStatus('pending')),
    },
    {
      label: 'Approved',
      count: filterByStatus('approved').length,
      content: renderTransfers(filterByStatus('approved')),
    },
    {
      label: 'Completed',
      count: filterByStatus('completed').length,
      content: renderTransfers(filterByStatus('completed')),
    },
    {
      label: 'Rejected',
      count: filterByStatus('rejected').length,
      content: renderTransfers(filterByStatus('rejected')),
    },
  ];

  function renderTransfers(transfersList) {
    if (transfersList.length === 0) {
      return (
        <div className="p-6">
          <EmptyState
            icon={TruckIcon}
            title="No transfers found"
            description="No transfers match the current filters"
            action={
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => setShowTransferForm(true)}
              >
                Create Transfer
              </Button>
            }
          />
        </div>
      );
    }

    return (
      <div className="p-6">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {transfersList.map((transfer) => (
              <StockTransferCard
                key={transfer.id}
                transferData={transfer}
                onView={handleViewTransfer}
                onApprove={(data) => {
                  setSelectedTransfer(data);
                  setApprovalMode('approval');
                  setShowApprovalModal(true);
                }}
                onReject={(data) => {
                  setSelectedTransfer(data);
                  setApprovalMode('approval');
                  setShowApprovalModal(true);
                }}
                onComplete={(data) => {
                  setSelectedTransfer(data);
                  setApprovalMode('completion');
                  setShowApprovalModal(true);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {transfersList.map((transfer) => (
              <StockTransferListItem
                key={transfer.id}
                transferData={transfer}
                onView={handleViewTransfer}
                onApprove={(data) => {
                  setSelectedTransfer(data);
                  setApprovalMode('approval');
                  setShowApprovalModal(true);
                }}
                onReject={(data) => {
                  setSelectedTransfer(data);
                  setApprovalMode('approval');
                  setShowApprovalModal(true);
                }}
                onComplete={(data) => {
                  setSelectedTransfer(data);
                  setApprovalMode('completion');
                  setShowApprovalModal(true);
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const activeFilterCount = Object.values(filters).filter((v) => v && v !== 'all').length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Stock Transfers</h1>
        <p className="text-gray-600">Manage inter-branch inventory transfers</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Transfers"
          value={stats.total_transfers}
          icon={TruckIcon}
          variant="primary"
        />
        <StatCard
          label="Pending Approvals"
          value={stats.pending_approvals}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          label="Approved"
          value={stats.approved_transfers}
          icon={Package}
          variant="info"
        />
        <StatCard
          label="Completed"
          value={stats.completed_transfers}
          icon={CheckCircle}
          variant="success"
        />
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search transfers by number or branch..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              icon={Filter}
              onClick={() => setShowFilters(!showFilters)}
              className={activeFilterCount > 0 ? 'border-blue-600 text-blue-600' : ''}
            >
              Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </Button>

            <ViewModeToggle
              value={viewMode}
              onChange={setViewMode}
              modes={['grid', 'list']}
            />

            <Button variant="outline" icon={Download} onClick={handleExport}>
              Export
            </Button>

            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setShowTransferForm(true)}
            >
              Create Transfer
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* From Branch */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Branch
                </label>
                <select
                  value={filters.from_branch}
                  onChange={(e) => setFilters({ ...filters, from_branch: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Branches</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.branch_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* To Branch */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Branch
                </label>
                <select
                  value={filters.to_branch}
                  onChange={(e) => setFilters({ ...filters, to_branch: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Branches</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.branch_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Range
                </label>
                <select
                  value={filters.date_range}
                  onChange={(e) => setFilters({ ...filters, date_range: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-4">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All Filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <Tabs tabs={tabs} />
        </div>
      )}

      {/* Transfer Form Modal */}
      <StockTransferFormModal
        isOpen={showTransferForm}
        onClose={() => setShowTransferForm(false)}
        onSubmit={handleCreateTransfer}
        branches={branches}
      />

      {/* Approval/Completion Modal */}
      <TransferApprovalModal
        isOpen={showApprovalModal}
        onClose={() => {
          setShowApprovalModal(false);
          setSelectedTransfer(null);
        }}
        onApprove={handleApproveTransfer}
        onReject={handleRejectTransfer}
        onComplete={handleCompleteTransfer}
        transferData={selectedTransfer}
        mode={approvalMode}
      />
    </div>
  );
};

// Stat Card Component
const StatCard = ({ label, value, icon: Icon, variant = 'default' }) => {
  const variants = {
    default: 'bg-gray-50 text-gray-900',
    primary: 'bg-blue-50 text-blue-900',
    success: 'bg-green-50 text-green-900',
    warning: 'bg-yellow-50 text-yellow-900',
    info: 'bg-cyan-50 text-cyan-900',
  };

  return (
    <div className={`p-4 rounded-lg ${variants[variant]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium opacity-75">{label}</span>
        <Icon className="w-5 h-5 opacity-50" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
};

export default StockTransfers;
