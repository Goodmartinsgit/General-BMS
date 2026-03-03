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
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import {
  Button,
  SearchBar,
  ViewModeToggle,
  EmptyState,
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
import PageHeader from '../components/common/PageHeader';
import KPICard from '../components/dashboard/KPICard';
import { useCurrency } from '../context/CurrencyContext';

/**
 * Returns Page
 * Manage all returns and exchanges
 */
const Returns = () => {
  const { formatCurrency } = useCurrency();
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
    pending_returns: 0,
    approved_returns: 0,
    total_refunded: 0,
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
        pending_returns: 0,
        approved_returns: 0,
        total_refunded: 0,
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

  const headerActions = (
    <>
      <button
        onClick={fetchReturns}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-theme-secondary border border-theme text-theme-secondary font-medium rounded-lg hover:bg-theme-tertiary transition-colors"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        Refresh
      </button>
      <button
        onClick={() => setShowReturnForm(true)}
        className="bg-accent-gold text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-accent-goldDark transition flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Create Return
      </button>
    </>
  );

  return (
    <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
      {/* Page Header */}
      <PageHeader
        title="Returns & Exchanges"
        subtitle="Manage customer returns, refunds, and product exchanges"
        badge={`${stats.total_returns || 0} Total Returns`}
        icon={RotateCcw}
        actions={headerActions}
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KPICard
          title="Total Returns"
          value={stats.total_returns || 0}
          icon={RotateCcw}
          iconColor="bg-blue-500"
          change="All time"
          changeType="neutral"
          loading={loading}
        />
        <KPICard
          title="Pending Approvals"
          value={stats.pending_returns || 0}
          icon={AlertCircle}
          iconColor="bg-orange-500"
          change={stats.pending_returns > 0 ? "Needs attention" : "All clear"}
          changeType={stats.pending_returns > 0 ? "negative" : "neutral"}
          loading={loading}
        />
        <KPICard
          title="Approved Returns"
          value={stats.approved_returns || 0}
          icon={Package}
          iconColor="bg-green-500"
          change="Ready to process"
          changeType="neutral"
          loading={loading}
        />
        <KPICard
          title="Total Refunded"
          value={formatCurrency(stats.total_refunded || 0)}
          icon={DollarSign}
          iconColor="bg-accent-gold"
          change="All time"
          changeType="neutral"
          loading={loading}
        />
      </div>

      {/* Search & Toolbar */}
      <div className="bg-theme-secondary p-4 rounded-lg border border-theme shadow-theme-sm">
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
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeFilterCount > 0
                  ? 'bg-accent-gold text-white border border-accent-gold'
                  : 'bg-theme-primary border border-theme text-theme-secondary hover:bg-theme-tertiary'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>

            <ViewModeToggle
              mode={viewMode}
              onModeChange={setViewMode}
              modes={['grid', 'list']}
            />

            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-theme-primary border border-theme text-theme-secondary font-medium rounded-lg hover:bg-theme-tertiary transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-theme">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Return Type */}
              <div>
                <label className="block text-sm font-medium text-theme-primary mb-2">
                  Return Type
                </label>
                <select
                  value={filters.return_type}
                  onChange={(e) => setFilters({ ...filters, return_type: e.target.value })}
                  className="w-full px-3 py-2.5 bg-theme-primary border border-theme rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all text-sm text-theme-primary"
                >
                  <option value="">All Types</option>
                  <option value="refund">Refund</option>
                  <option value="exchange">Exchange</option>
                  <option value="store_credit">Store Credit</option>
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-theme-primary mb-2">
                  Date Range
                </label>
                <select
                  value={filters.date_range}
                  onChange={(e) => setFilters({ ...filters, date_range: e.target.value })}
                  className="w-full px-3 py-2.5 bg-theme-primary border border-theme rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all text-sm text-theme-primary"
                >
                  <option value="">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2.5 text-sm text-theme-muted hover:text-accent-gold transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-theme border-t-accent-gold rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-theme-secondary rounded-lg shadow-theme-sm border border-theme">
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
