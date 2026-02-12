import React, { useState, useEffect } from 'react';
import {
  Plus,
  Filter,
  Download,
  RotateCcw,
  DollarSign,
  Package,
  TrendingDown,
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
  ConfirmDialog,
  Tabs,
  Modal,
} from '../components/ui';
import {
  ReturnFormModal,
  ReturnCard,
  ReturnListItem,
  ReturnApprovalModal,
  ReturnProcessModal,
  ExchangeItemSelector,
  ReturnDetailView,
} from '../components/returns';
import { returnsAPI } from '../api/returns';
import { branchesAPI } from '../api/branches';
import { toast } from 'react-toastify';

/**
 * Returns Page
 * Manage all returns and exchanges
 */
const Returns = () => {
  // State
  const [returns, setReturns] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    return_type: '',
    date_range: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showExchangeSelector, setShowExchangeSelector] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);

  // Statistics
  const [stats, setStats] = useState({
    total_returns: 0,
    pending_approvals: 0,
    approved_returns: 0,
    total_refund_amount: 0,
  });

  // Fetch returns
  useEffect(() => {
    fetchReturns();
  }, [searchQuery, filters]);

  // Fetch branches
  useEffect(() => {
    fetchBranches();
  }, []);

  // Fetch stats
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const params = {
        search: searchQuery,
        status: filters.status !== 'all' ? filters.status : undefined,
        return_type: filters.return_type || undefined,
        date_range: filters.date_range || undefined,
      };

      const response = await returnsAPI.getReturns(params);
      setReturns(response.returns || response.data || response || []);
    } catch (error) {
      console.error('Error fetching returns:', error);
      toast.error('Failed to load returns');
      setReturns([]);
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
      const response = await returnsAPI.getStats();
      setStats(response.stats || response || {
        total_returns: 0,
        pending_approvals: 0,
        approved_returns: 0,
        total_refund_amount: 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreateReturn = async (returnData) => {
    try {
      await returnsAPI.createReturn(returnData);
      toast.success('Return request created successfully');
      await fetchReturns();
      await fetchStats();
      setShowReturnForm(false);
    } catch (error) {
      console.error('Error creating return:', error);
      toast.error('Failed to create return request');
    }
  };

  const handleApproveReturn = async (approvalData) => {
    try {
      await returnsAPI.approveReturn(approvalData.return_id || selectedReturn.id, approvalData);
      toast.success('Return approved successfully');
      await fetchReturns();
      await fetchStats();
      setShowApprovalModal(false);
      setSelectedReturn(null);
    } catch (error) {
      console.error('Error approving return:', error);
      toast.error('Failed to approve return');
    }
  };

  const handleRejectReturn = async (rejectionData) => {
    try {
      await returnsAPI.rejectReturn(rejectionData.return_id || selectedReturn.id, rejectionData);
      toast.success('Return rejected');
      await fetchReturns();
      await fetchStats();
      setShowApprovalModal(false);
      setSelectedReturn(null);
    } catch (error) {
      console.error('Error rejecting return:', error);
      toast.error('Failed to reject return');
    }
  };

  const handleProcessReturn = async (processData) => {
    try {
      await returnsAPI.processReturn(processData.return_id || selectedReturn.id, processData);

      // If exchange, open exchange item selector
      if (selectedReturn?.return_type === 'exchange') {
        setShowProcessModal(false);
        setShowExchangeSelector(true);
      } else {
        toast.success('Return processed successfully');
        await fetchReturns();
        await fetchStats();
        setShowProcessModal(false);
        setSelectedReturn(null);
      }
    } catch (error) {
      console.error('Error processing return:', error);
      toast.error('Failed to process return');
    }
  };

  const handleConfirmExchange = async (exchangeData) => {
    try {
      await returnsAPI.completeExchange(selectedReturn.id, exchangeData);
      toast.success('Exchange completed successfully');
      await fetchReturns();
      await fetchStats();
      setShowExchangeSelector(false);
      setSelectedReturn(null);
    } catch (error) {
      console.error('Error completing exchange:', error);
      toast.error('Failed to complete exchange');
    }
  };

  const handleViewReturn = (returnData) => {
    setSelectedReturn(returnData);
    setShowDetailModal(true);
  };

  const handleExport = () => {
    // TODO: Implement export to CSV
    console.log('Export returns');
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      return_type: '',
      date_range: '',
    });
    setSearchQuery('');
  };

  // Filter returns by status for tabs
  const filterByStatus = (status) => {
    if (status === 'all') return returns;
    if (status === 'pending') return returns.filter((r) => r.status === 'pending');
    if (status === 'approved') return returns.filter((r) => r.status === 'approved');
    if (status === 'completed') return returns.filter((r) => r.status === 'completed');
    if (status === 'rejected') return returns.filter((r) => r.status === 'rejected');
    return returns;
  };

  const tabs = [
    {
      label: 'All',
      count: returns.length,
      content: renderReturns(returns),
    },
    {
      label: 'Pending',
      count: filterByStatus('pending').length,
      content: renderReturns(filterByStatus('pending')),
    },
    {
      label: 'Approved',
      count: filterByStatus('approved').length,
      content: renderReturns(filterByStatus('approved')),
    },
    {
      label: 'Completed',
      count: filterByStatus('completed').length,
      content: renderReturns(filterByStatus('completed')),
    },
    {
      label: 'Rejected',
      count: filterByStatus('rejected').length,
      content: renderReturns(filterByStatus('rejected')),
    },
  ];

  function renderReturns(returnsList) {
    if (returnsList.length === 0) {
      return (
        <div className="p-6">
          <EmptyState
            icon={RotateCcw}
            title="No returns found"
            description="No returns match the current filters"
            action={
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => setShowReturnForm(true)}
              >
                Create Return Request
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
            {returnsList.map((returnItem) => (
              <ReturnCard
                key={returnItem.id}
                returnData={returnItem}
                onView={handleViewReturn}
                onApprove={(data) => {
                  setSelectedReturn(data);
                  setShowApprovalModal(true);
                }}
                onReject={(data) => {
                  setSelectedReturn(data);
                  setShowApprovalModal(true);
                }}
                onProcess={(data) => {
                  setSelectedReturn(data);
                  setShowProcessModal(true);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {returnsList.map((returnItem) => (
              <ReturnListItem
                key={returnItem.id}
                returnData={returnItem}
                onView={handleViewReturn}
                onApprove={(data) => {
                  setSelectedReturn(data);
                  setShowApprovalModal(true);
                }}
                onReject={(data) => {
                  setSelectedReturn(data);
                  setShowApprovalModal(true);
                }}
                onProcess={(data) => {
                  setSelectedReturn(data);
                  setShowProcessModal(true);
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Returns & Exchanges</h1>
        <p className="text-gray-600">Manage customer returns and product exchanges</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Returns"
          value={stats.total_returns}
          icon={RotateCcw}
          variant="primary"
        />
        <StatCard
          label="Pending Approvals"
          value={stats.pending_approvals}
          icon={Package}
          variant="warning"
        />
        <StatCard
          label="Approved Returns"
          value={stats.approved_returns}
          icon={TrendingDown}
          variant="info"
        />
        <StatCard
          label="Total Refunded"
          value={`$${stats.total_refund_amount.toLocaleString()}`}
          icon={DollarSign}
          variant="danger"
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
              placeholder="Search returns by number, customer, or sale..."
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
              onClick={() => setShowReturnForm(true)}
            >
              Create Return
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Return Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Return Type
                </label>
                <select
                  value={filters.return_type}
                  onChange={(e) => setFilters({ ...filters, return_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="refund">Refund</option>
                  <option value="exchange">Exchange</option>
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

      {/* Return Form Modal */}
      <ReturnFormModal
        isOpen={showReturnForm}
        onClose={() => setShowReturnForm(false)}
        onSubmit={handleCreateReturn}
      />

      {/* Approval Modal */}
      <ReturnApprovalModal
        isOpen={showApprovalModal}
        onClose={() => {
          setShowApprovalModal(false);
          setSelectedReturn(null);
        }}
        onApprove={handleApproveReturn}
        onReject={handleRejectReturn}
        returnData={selectedReturn}
      />

      {/* Process Modal */}
      <ReturnProcessModal
        isOpen={showProcessModal}
        onClose={() => {
          setShowProcessModal(false);
          setSelectedReturn(null);
        }}
        onProcess={handleProcessReturn}
        returnData={selectedReturn}
        branches={branches}
      />

      {/* Exchange Item Selector */}
      <ExchangeItemSelector
        isOpen={showExchangeSelector}
        onClose={() => {
          setShowExchangeSelector(false);
          setSelectedReturn(null);
        }}
        onConfirm={handleConfirmExchange}
        returnData={selectedReturn}
      />

      {/* Detail View Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedReturn(null);
        }}
        title="Return Details"
        size="xl"
      >
        <ReturnDetailView
          returnData={selectedReturn}
          onApprove={(data) => {
            setShowDetailModal(false);
            setSelectedReturn(data);
            setShowApprovalModal(true);
          }}
          onReject={(data) => {
            setShowDetailModal(false);
            setSelectedReturn(data);
            setShowApprovalModal(true);
          }}
          onProcess={(data) => {
            setShowDetailModal(false);
            setSelectedReturn(data);
            setShowProcessModal(true);
          }}
          onPrint={() => {
            console.log('Print return', selectedReturn);
          }}
          onEmail={() => {
            console.log('Email return', selectedReturn);
          }}
        />
      </Modal>
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
    danger: 'bg-red-50 text-red-900',
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

export default Returns;
