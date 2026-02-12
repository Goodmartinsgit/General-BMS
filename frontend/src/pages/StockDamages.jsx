import React, { useState, useEffect } from 'react';
import {
  Plus,
  Filter,
  Download,
  AlertTriangle,
  Package,
  TrendingDown,
  DollarSign,
  Grid,
  List,
} from 'lucide-react';
import {
  Button,
  SearchBar,
  ViewModeToggle,
  LoadingSpinner,
  EmptyState,
  Tabs,
  Modal,
} from '../components/ui';
import {
  StockDamageFormModal,
  DamageCard,
} from '../components/stock';

/**
 * StockDamages Page
 * Manage and track damaged stock inventory
 */
const StockDamages = () => {
  // State
  const [damages, setDamages] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    branch: '',
    damage_reason: '',
    date_range: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showDamageForm, setShowDamageForm] = useState(false);
  const [selectedDamage, setSelectedDamage] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    total_damages: 0,
    total_damaged_units: 0,
    damages_this_month: 0,
    estimated_loss: 0,
  });

  // Fetch damages
  useEffect(() => {
    fetchDamages();
  }, [searchQuery, filters]);

  // Fetch branches
  useEffect(() => {
    fetchBranches();
  }, []);

  // Fetch stats
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchDamages = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const params = new URLSearchParams({
      //   search: searchQuery,
      //   ...filters,
      // });
      // const response = await fetch(`/api/stock-damages?${params}`);
      // const data = await response.json();

      // Mock data for now
      const mockData = [
        {
          id: '1',
          damage_number: 'DMG-20260131-0001',
          branch_name: 'Main Branch',
          damage_reason: 'Water Damage',
          notes: 'Roof leak damaged tiles in storage area',
          total_items: 3,
          total_quantity: 45,
          estimated_value: 675.50,
          created_at: '2026-01-31T10:30:00',
          created_by_name: 'Alice Smith',
          items: [
            {
              product_name: 'Premium Ceramic Tile',
              variant_name: null,
              quantity: 30,
            },
            {
              product_name: 'Porcelain Floor Tile',
              variant_name: 'Matte - 600x600mm',
              quantity: 15,
            },
          ],
        },
        {
          id: '2',
          damage_number: 'DMG-20260130-0015',
          branch_name: 'Downtown Store',
          damage_reason: 'Physical Damage',
          notes: 'Forklift accident during restocking',
          total_items: 2,
          total_quantity: 120,
          estimated_value: 1850.00,
          created_at: '2026-01-30T14:20:00',
          created_by_name: 'Bob Johnson',
          items: [],
        },
        {
          id: '3',
          damage_number: 'DMG-20260129-0008',
          branch_name: 'Warehouse',
          damage_reason: 'Expired Product',
          notes: 'Adhesive products past expiration date',
          total_items: 5,
          total_quantity: 85,
          estimated_value: 425.75,
          created_at: '2026-01-29T09:15:00',
          created_by_name: 'Carol Davis',
          items: [],
        },
        {
          id: '4',
          damage_number: 'DMG-20260128-0003',
          branch_name: 'Main Branch',
          damage_reason: 'Handling Error',
          notes: 'Dropped during transfer to truck',
          total_items: 1,
          total_quantity: 25,
          estimated_value: 312.50,
          created_at: '2026-01-28T16:45:00',
          created_by_name: 'Alice Smith',
          items: [],
        },
      ];

      setDamages(mockData);
    } catch (error) {
      console.error('Error fetching damages:', error);
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
      total_damages: 47,
      total_damaged_units: 1250,
      damages_this_month: 12,
      estimated_loss: 18750.25,
    });
  };

  const handleCreateDamage = async (damageData) => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/stock-damages', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(damageData),
      // });

      await fetchDamages();
      await fetchStats();
      setShowDamageForm(false);
    } catch (error) {
      console.error('Error creating damage record:', error);
    }
  };

  const handleViewDamage = (damageData) => {
    setSelectedDamage(damageData);
    setShowDetailModal(true);
  };

  const handleExport = () => {
    // TODO: Implement export to CSV
    console.log('Export damages');
  };

  const clearFilters = () => {
    setFilters({
      branch: '',
      damage_reason: '',
      date_range: '',
    });
    setSearchQuery('');
  };

  // Filter damages by date for tabs
  const filterByDateRange = (range) => {
    const now = new Date();
    if (range === 'all') return damages;
    if (range === 'today') {
      return damages.filter((d) => {
        const damageDate = new Date(d.created_at);
        return damageDate.toDateString() === now.toDateString();
      });
    }
    if (range === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return damages.filter((d) => new Date(d.created_at) >= weekAgo);
    }
    if (range === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return damages.filter((d) => new Date(d.created_at) >= monthAgo);
    }
    return damages;
  };

  const damageReasons = [
    'Water Damage',
    'Physical Damage',
    'Manufacturing Defect',
    'Expired Product',
    'Theft/Vandalism',
    'Handling Error',
    'Storage Issue',
    'Other',
  ];

  const tabs = [
    {
      label: 'All',
      count: damages.length,
      content: renderDamages(damages),
    },
    {
      label: 'Today',
      count: filterByDateRange('today').length,
      content: renderDamages(filterByDateRange('today')),
    },
    {
      label: 'This Week',
      count: filterByDateRange('week').length,
      content: renderDamages(filterByDateRange('week')),
    },
    {
      label: 'This Month',
      count: filterByDateRange('month').length,
      content: renderDamages(filterByDateRange('month')),
    },
  ];

  function renderDamages(damagesList) {
    if (damagesList.length === 0) {
      return (
        <div className="p-6">
          <EmptyState
            icon={AlertTriangle}
            title="No damage records found"
            description="No damaged stock matches the current filters"
            action={
              <Button
                variant="danger"
                icon={Plus}
                onClick={() => setShowDamageForm(true)}
              >
                Record Damage
              </Button>
            }
          />
        </div>
      );
    }

    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {damagesList.map((damage) => (
            <DamageCard
              key={damage.id}
              damageData={damage}
              onView={handleViewDamage}
            />
          ))}
        </div>
      </div>
    );
  }

  const activeFilterCount = Object.values(filters).filter((v) => v && v !== 'all').length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Stock Damages</h1>
        <p className="text-gray-600">Track and manage damaged inventory</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Damages"
          value={stats.total_damages}
          icon={AlertTriangle}
          variant="danger"
        />
        <StatCard
          label="Damaged Units"
          value={stats.total_damaged_units}
          icon={Package}
          variant="warning"
        />
        <StatCard
          label="This Month"
          value={stats.damages_this_month}
          icon={TrendingDown}
          variant="info"
        />
        <StatCard
          label="Estimated Loss"
          value={`$${stats.estimated_loss.toLocaleString()}`}
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
              placeholder="Search damages by number, product, or branch..."
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

            <Button
              variant="danger"
              icon={Plus}
              onClick={() => setShowDamageForm(true)}
            >
              Record Damage
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              {/* Damage Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Damage Reason
                </label>
                <select
                  value={filters.damage_reason}
                  onChange={(e) => setFilters({ ...filters, damage_reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Reasons</option>
                  {damageReasons.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
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

      {/* Damage Form Modal */}
      <StockDamageFormModal
        isOpen={showDamageForm}
        onClose={() => setShowDamageForm(false)}
        onSubmit={handleCreateDamage}
        branches={branches}
      />

      {/* Detail View Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedDamage(null);
        }}
        title="Damage Details"
        size="lg"
      >
        {selectedDamage && (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">{selectedDamage.damage_number}</h3>
              <p className="text-sm text-gray-600">Branch: {selectedDamage.branch_name}</p>
              <p className="text-sm text-gray-600">Reason: {selectedDamage.damage_reason}</p>
              <p className="text-sm text-gray-600">
                Date: {new Date(selectedDamage.created_at).toLocaleString()}
              </p>
            </div>

            {selectedDamage.notes && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Notes</p>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  {selectedDamage.notes}
                </p>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Summary</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Total Items</p>
                  <p className="text-lg font-bold text-gray-900">{selectedDamage.total_items}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Quantity</p>
                  <p className="text-lg font-bold text-gray-900">{selectedDamage.total_quantity}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Estimated Loss</p>
                  <p className="text-lg font-bold text-red-600">
                    ${parseFloat(selectedDamage.estimated_value || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
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

export default StockDamages;
