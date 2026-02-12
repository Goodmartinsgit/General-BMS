import React, { useState, useEffect } from 'react';
import {
  Plus,
  Filter,
  Download,
  Tag,
  TrendingUp,
  Users,
  DollarSign,
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
} from '../components/ui';
import {
  PromotionFormModal,
  PromotionCard,
  PromotionListItem,
} from '../components/promotions';
import { promotionsAPI } from '../api/promotions';
import { toast } from 'react-toastify';

/**
 * PromotionsPage
 * Manage all promotions and discounts
 */
const PromotionsPage = () => {
  // State
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    promotion_type: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showPromotionForm, setShowPromotionForm] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [promotionToDelete, setPromotionToDelete] = useState(null);

  // Statistics
  const [stats, setStats] = useState({
    total_promotions: 0,
    active_promotions: 0,
    total_usage: 0,
    total_savings: 0,
  });

  // Fetch promotions
  useEffect(() => {
    fetchPromotions();
  }, [searchQuery, filters]);

  // Fetch stats
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const params = {
        search: searchQuery || undefined,
        promotion_type: filters.promotion_type || undefined,
      };
      // Remove undefined values
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const response = await promotionsAPI.getPromotions(params);
      setPromotions(response.promotions || response.data || response || []);
    } catch (error) {
      console.error('Error fetching promotions:', error);
      toast.error('Failed to load promotions');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await promotionsAPI.getStats();
      setStats(response.stats || response || {
        total_promotions: 0,
        active_promotions: 0,
        total_usage: 0,
        total_savings: 0,
      });
    } catch (error) {
      console.error('Error fetching promotion stats:', error);
    }
  };

  const handleCreatePromotion = async (promotionData) => {
    try {
      await promotionsAPI.createPromotion(promotionData);
      toast.success('Promotion created successfully');
      await fetchPromotions();
      await fetchStats();
      setShowPromotionForm(false);
      setSelectedPromotion(null);
    } catch (error) {
      console.error('Error creating promotion:', error);
      toast.error(error.response?.data?.message || 'Failed to create promotion');
    }
  };

  const handleUpdatePromotion = async (promotionData) => {
    try {
      await promotionsAPI.updatePromotion(selectedPromotion.id, promotionData);
      toast.success('Promotion updated successfully');
      await fetchPromotions();
      setShowPromotionForm(false);
      setSelectedPromotion(null);
    } catch (error) {
      console.error('Error updating promotion:', error);
      toast.error(error.response?.data?.message || 'Failed to update promotion');
    }
  };

  const handleToggleStatus = async (promotion) => {
    try {
      if (promotion.is_active) {
        await promotionsAPI.deactivatePromotion(promotion.id);
        toast.success('Promotion deactivated');
      } else {
        await promotionsAPI.activatePromotion(promotion.id);
        toast.success('Promotion activated');
      }
      await fetchPromotions();
      await fetchStats();
    } catch (error) {
      console.error('Error toggling promotion status:', error);
      toast.error(error.response?.data?.message || 'Failed to update promotion status');
    }
  };

  const handleDeletePromotion = async () => {
    if (!promotionToDelete) return;

    try {
      await promotionsAPI.deletePromotion(promotionToDelete.id);
      toast.success('Promotion deleted successfully');
      await fetchPromotions();
      await fetchStats();
      setShowDeleteConfirm(false);
      setPromotionToDelete(null);
    } catch (error) {
      console.error('Error deleting promotion:', error);
      toast.error(error.response?.data?.message || 'Failed to delete promotion');
    }
  };

  const handleExport = async () => {
    try {
      // Create CSV from promotions data
      const headers = ['Name', 'Type', 'Description', 'Discount', 'Coupon Code', 'Start Date', 'End Date', 'Status', 'Usage'];
      const rows = promotions.map(p => [
        p.promotion_name,
        p.promotion_type,
        p.description || '',
        p.discount_percentage ? `${p.discount_percentage}%` : p.discount_amount ? `$${p.discount_amount}` : '',
        p.coupon_code || '',
        p.start_date || '',
        p.end_date || '',
        p.is_active ? 'Active' : 'Inactive',
        p.usage_count || 0
      ]);

      const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `promotions-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Promotions exported successfully');
    } catch (error) {
      console.error('Error exporting promotions:', error);
      toast.error('Failed to export promotions');
    }
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      promotion_type: '',
    });
    setSearchQuery('');
  };

  // Filter promotions by status for tabs
  const filterByStatus = (status) => {
    if (status === 'all') return promotions;
    if (status === 'active') return promotions.filter((p) => p.is_active);
    if (status === 'inactive') return promotions.filter((p) => !p.is_active);
    if (status === 'expired') {
      const now = new Date();
      return promotions.filter((p) => p.end_date && new Date(p.end_date) < now);
    }
    if (status === 'scheduled') {
      const now = new Date();
      return promotions.filter((p) => p.start_date && new Date(p.start_date) > now);
    }
    return promotions;
  };

  const tabs = [
    {
      label: 'All',
      count: promotions.length,
      content: renderPromotions(promotions),
    },
    {
      label: 'Active',
      count: filterByStatus('active').length,
      content: renderPromotions(filterByStatus('active')),
    },
    {
      label: 'Inactive',
      count: filterByStatus('inactive').length,
      content: renderPromotions(filterByStatus('inactive')),
    },
    {
      label: 'Scheduled',
      count: filterByStatus('scheduled').length,
      content: renderPromotions(filterByStatus('scheduled')),
    },
    {
      label: 'Expired',
      count: filterByStatus('expired').length,
      content: renderPromotions(filterByStatus('expired')),
    },
  ];

  function renderPromotions(promos) {
    if (promos.length === 0) {
      return (
        <div className="p-6">
          <EmptyState
            icon={Tag}
            title="No promotions found"
            description="Create a promotion to boost sales"
            action={
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => {
                  setSelectedPromotion(null);
                  setShowPromotionForm(true);
                }}
              >
                Create Promotion
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
            {promos.map((promo) => (
              <PromotionCard
                key={promo.id}
                promotion={promo}
                onEdit={(promo) => {
                  setSelectedPromotion(promo);
                  setShowPromotionForm(true);
                }}
                onDelete={(promo) => {
                  setPromotionToDelete(promo);
                  setShowDeleteConfirm(true);
                }}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {promos.map((promo) => (
              <PromotionListItem
                key={promo.id}
                promotion={promo}
                onEdit={(promo) => {
                  setSelectedPromotion(promo);
                  setShowPromotionForm(true);
                }}
                onDelete={(promo) => {
                  setPromotionToDelete(promo);
                  setShowDeleteConfirm(true);
                }}
                onToggleStatus={handleToggleStatus}
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Promotions & Discounts</h1>
        <p className="text-gray-600">Create and manage promotional campaigns</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Promotions"
          value={stats.total_promotions}
          icon={Tag}
          variant="primary"
        />
        <StatCard
          label="Active Promotions"
          value={stats.active_promotions}
          icon={TrendingUp}
          variant="success"
        />
        <StatCard
          label="Total Usage"
          value={stats.total_usage}
          icon={Users}
          variant="info"
        />
        <StatCard
          label="Total Savings"
          value={`$${stats.total_savings.toLocaleString()}`}
          icon={DollarSign}
          variant="warning"
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
              placeholder="Search promotions by name or coupon code..."
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
              onClick={() => {
                setSelectedPromotion(null);
                setShowPromotionForm(true);
              }}
            >
              Create Promotion
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Promotion Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Promotion Type
                </label>
                <select
                  value={filters.promotion_type}
                  onChange={(e) => setFilters({ ...filters, promotion_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="percentage">Percentage Discount</option>
                  <option value="fixed_amount">Fixed Amount Off</option>
                  <option value="bogo">BOGO (Buy X Get Y)</option>
                  <option value="bulk_discount">Bulk Discount</option>
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

      {/* Promotion Form Modal */}
      <PromotionFormModal
        isOpen={showPromotionForm}
        onClose={() => {
          setShowPromotionForm(false);
          setSelectedPromotion(null);
        }}
        onSubmit={selectedPromotion ? handleUpdatePromotion : handleCreatePromotion}
        promotion={selectedPromotion}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setPromotionToDelete(null);
        }}
        onConfirm={handleDeletePromotion}
        title="Delete Promotion"
        message={`Are you sure you want to delete "${promotionToDelete?.promotion_name}"? This action cannot be undone.`}
        confirmText="Delete Promotion"
        variant="danger"
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

export default PromotionsPage;
