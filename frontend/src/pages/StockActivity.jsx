import React, { useState, useEffect } from 'react';
import { Filter, Download, Package, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import {
  Button,
  SearchBar,
  LoadingSpinner,
  EmptyState,
} from '../components/ui';
import { StockActivityLog } from '../components/stock';

/**
 * StockActivity Page
 * View complete stock movement history
 */
const StockActivity = () => {
  // State
  const [activities, setActivities] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    activity_type: '',
    branch: '',
    date_range: '',
    product: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    total_activities: 0,
    stock_in: 0,
    stock_out: 0,
    net_change: 0,
  });

  // Fetch activities
  useEffect(() => {
    fetchActivities();
  }, [searchQuery, filters]);

  // Fetch branches
  useEffect(() => {
    fetchBranches();
  }, []);

  // Fetch stats
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const params = new URLSearchParams({
      //   search: searchQuery,
      //   ...filters,
      // });
      // const response = await fetch(`/api/stock-activities?${params}`);
      // const data = await response.json();

      // Mock data for now
      const mockData = [
        {
          id: '1',
          activity_type: 'sale',
          product_name: 'Premium Ceramic Tile',
          variant_name: null,
          quantity: 25,
          branch_name: 'Main Branch',
          reference_number: 'SAL-20260131-0042',
          created_at: '2026-01-31T14:30:00',
          created_by_name: 'Alice Smith',
          notes: null,
        },
        {
          id: '2',
          activity_type: 'purchase',
          product_name: 'Tile Adhesive',
          variant_name: 'White - 25kg',
          quantity: 100,
          branch_name: 'Warehouse',
          reference_number: 'PO-20260131-0015',
          created_at: '2026-01-31T13:15:00',
          created_by_name: 'Bob Johnson',
          notes: 'Bulk purchase from supplier XYZ',
        },
        {
          id: '3',
          activity_type: 'transfer_out',
          product_name: 'Porcelain Floor Tile',
          variant_name: 'Matte - 600x600mm',
          quantity: 50,
          branch_name: 'Main Branch',
          related_branch_name: 'Downtown Store',
          reference_number: 'TRF-20260131-0001',
          created_at: '2026-01-31T12:00:00',
          created_by_name: 'Carol Davis',
          notes: null,
        },
        {
          id: '4',
          activity_type: 'return',
          product_name: 'Wireless Mouse',
          variant_name: null,
          quantity: 3,
          branch_name: 'Main Branch',
          reference_number: 'RET-20260131-0001',
          created_at: '2026-01-31T11:30:00',
          created_by_name: 'Alice Smith',
          notes: 'Customer return - defective',
        },
        {
          id: '5',
          activity_type: 'damage',
          product_name: 'Premium Ceramic Tile',
          variant_name: null,
          quantity: 30,
          branch_name: 'Main Branch',
          reference_number: 'DMG-20260131-0001',
          created_at: '2026-01-31T10:30:00',
          created_by_name: 'Alice Smith',
          notes: 'Water damage from roof leak',
        },
        {
          id: '6',
          activity_type: 'transfer_in',
          product_name: 'Mechanical Keyboard',
          variant_name: 'RGB - Cherry MX Blue',
          quantity: 15,
          branch_name: 'Downtown Store',
          related_branch_name: 'Warehouse',
          reference_number: 'TRF-20260131-0002',
          created_at: '2026-01-31T09:45:00',
          created_by_name: 'Bob Johnson',
          notes: null,
        },
        {
          id: '7',
          activity_type: 'adjustment',
          product_name: 'USB-C Cable',
          variant_name: 'Red - 2m',
          quantity: 5,
          branch_name: 'Main Branch',
          reference_number: 'ADJ-20260131-0001',
          created_at: '2026-01-31T09:00:00',
          created_by_name: 'Manager Admin',
          notes: 'Stock count correction',
        },
      ];

      setActivities(mockData);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      // TODO: Replace with actual API call
      const mockBranches = [
        { id: '1', branch_name: 'Main Branch', main_branch: true },
        { id: '2', branch_name: 'Downtown Store', main_branch: false },
        { id: '3', branch_name: 'Warehouse', main_branch: false },
      ];

      setBranches(mockBranches);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchStats = async () => {
    // TODO: Replace with actual API call
    setStats({
      total_activities: 1847,
      stock_in: 15250,
      stock_out: 12800,
      net_change: 2450,
    });
  };

  const handleExport = () => {
    // TODO: Implement export to CSV
    console.log('Export stock activity');
  };

  const clearFilters = () => {
    setFilters({
      activity_type: '',
      branch: '',
      date_range: '',
      product: '',
    });
    setSearchQuery('');
  };

  const activityTypes = [
    { value: 'sale', label: 'Sales' },
    { value: 'purchase', label: 'Purchases' },
    { value: 'return', label: 'Returns' },
    { value: 'transfer_in', label: 'Transfers In' },
    { value: 'transfer_out', label: 'Transfers Out' },
    { value: 'damage', label: 'Damages' },
    { value: 'adjustment', label: 'Adjustments' },
  ];

  const activeFilterCount = Object.values(filters).filter((v) => v && v !== 'all').length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Stock Activity Log</h1>
        <p className="text-gray-600">Complete history of all stock movements</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Activities"
          value={stats.total_activities}
          icon={Activity}
          variant="primary"
        />
        <StatCard
          label="Stock In"
          value={`+${stats.stock_in.toLocaleString()}`}
          icon={TrendingUp}
          variant="success"
        />
        <StatCard
          label="Stock Out"
          value={`-${stats.stock_out.toLocaleString()}`}
          icon={TrendingDown}
          variant="danger"
        />
        <StatCard
          label="Net Change"
          value={`${stats.net_change >= 0 ? '+' : ''}${stats.net_change.toLocaleString()}`}
          icon={Package}
          variant={stats.net_change >= 0 ? 'success' : 'warning'}
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
              placeholder="Search by product, reference, or branch..."
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

            <Button variant="outline" icon={Download} onClick={handleExport}>
              Export
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Activity Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Activity Type
                </label>
                <select
                  value={filters.activity_type}
                  onChange={(e) => setFilters({ ...filters, activity_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  {activityTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Branch */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                <select
                  value={filters.branch}
                  onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
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
                  <option value="year">This Year</option>
                </select>
              </div>

              {/* Product Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                <input
                  type="text"
                  value={filters.product}
                  onChange={(e) => setFilters({ ...filters, product: e.target.value })}
                  placeholder="Filter by product..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 mt-4">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All Filters
              </Button>
              <p className="text-sm text-gray-600">
                Showing {activities.length} of {stats.total_activities} activities
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : activities.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No stock activity found"
            description="No stock movements match the current filters"
          />
        ) : (
          <StockActivityLog activities={activities} loading={loading} />
        )}
      </div>

      {/* Pagination could be added here */}
      {!loading && activities.length > 0 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <span className="text-sm text-gray-600">Page 1 of 10</span>
          <Button variant="outline" size="sm">
            Next
          </Button>
        </div>
      )}
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

export default StockActivity;
