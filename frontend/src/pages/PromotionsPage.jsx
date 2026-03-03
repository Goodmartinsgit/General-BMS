import React, { useState, useEffect } from 'react';
import { Plus, Filter, Download, Tag, TrendingUp, Users, DollarSign, LayoutGrid, List, Search, X } from 'lucide-react';
import Modal from '../components/ui/Modal';
import PageHeader from '../components/common/PageHeader';
import { PromotionFormModal, PromotionCard, PromotionListItem } from '../components/promotions';
import { promotionsAPI } from '../api/promotions';
import { toast } from 'react-toastify';

const inputClass = 'w-full px-3 py-2.5 bg-theme-primary border border-theme rounded-lg text-sm text-theme-primary placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 transition-all';
const labelClass = 'block text-sm font-medium text-theme-secondary mb-1';

const STATUS_TABS = [
  { key: 'all',       label: 'All' },
  { key: 'active',    label: 'Active' },
  { key: 'inactive',  label: 'Inactive' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'expired',   label: 'Expired' },
];

const PromotionsPage = () => {
  const [promotions, setPromotions]       = useState([]);
  const [loading, setLoading]             = useState(false);
  const [viewMode, setViewMode]           = useState('grid');
  const [searchQuery, setSearchQuery]     = useState('');
  const [activeTab, setActiveTab]         = useState('all');
  const [typeFilter, setTypeFilter]       = useState('');
  const [showFilters, setShowFilters]     = useState(false);
  const [showForm, setShowForm]           = useState(false);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [deleteModal, setDeleteModal]     = useState({ open: false, promo: null });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [stats, setStats] = useState({
    total_promotions: 0, active_promotions: 0, total_usage: 0, total_savings: 0,
  });

  useEffect(() => { fetchPromotions(); }, [searchQuery, typeFilter]);
  useEffect(() => { fetchStats(); }, []);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (typeFilter)  params.promotion_type = typeFilter;
      const res = await promotionsAPI.getPromotions(params);
      setPromotions(res.promotions || res.data || res || []);
    } catch {
      toast.error('Failed to load promotions');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await promotionsAPI.getStats();
      setStats(res.stats || res || stats);
    } catch { /* silent */ }
  };

  const handleCreate = async (data) => {
    try {
      await promotionsAPI.createPromotion(data);
      toast.success('Promotion created');
      setShowForm(false); setSelectedPromo(null);
      fetchPromotions(); fetchStats();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create promotion');
    }
  };

  const handleUpdate = async (data) => {
    try {
      await promotionsAPI.updatePromotion(selectedPromo.id, data);
      toast.success('Promotion updated');
      setShowForm(false); setSelectedPromo(null);
      fetchPromotions();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update promotion');
    }
  };

  const handleToggleStatus = async (promo) => {
    try {
      if (promo.is_active) {
        await promotionsAPI.deactivatePromotion(promo.id);
        toast.success('Promotion deactivated');
      } else {
        await promotionsAPI.activatePromotion(promo.id);
        toast.success('Promotion activated');
      }
      fetchPromotions(); fetchStats();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.promo) return;
    setDeleteLoading(true);
    try {
      await promotionsAPI.deletePromotion(deleteModal.promo.id);
      toast.success('Promotion deleted');
      setDeleteModal({ open: false, promo: null });
      fetchPromotions(); fetchStats();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete promotion');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExport = () => {
    try {
      const headers = ['Name', 'Type', 'Description', 'Discount', 'Coupon Code', 'Start Date', 'End Date', 'Status', 'Usage'];
      const rows = promotions.map(p => [
        p.promotion_name, p.promotion_type, p.description || '',
        p.discount_percentage ? `${p.discount_percentage}%` : p.discount_amount ? `$${p.discount_amount}` : '',
        p.coupon_code || '', p.start_date || '', p.end_date || '',
        p.is_active ? 'Active' : 'Inactive', p.usage_count || 0,
      ]);
      const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `promotions-${new Date().toISOString().split('T')[0]}.csv`;
      a.click(); URL.revokeObjectURL(url);
      toast.success('Promotions exported');
    } catch {
      toast.error('Failed to export promotions');
    }
  };

  // Filter by status tab
  const filterByTab = (list) => {
    const now = new Date();
    switch (activeTab) {
      case 'active':    return list.filter(p => p.is_active);
      case 'inactive':  return list.filter(p => !p.is_active);
      case 'expired':   return list.filter(p => p.end_date && new Date(p.end_date) < now);
      case 'scheduled': return list.filter(p => p.start_date && new Date(p.start_date) > now);
      default:          return list;
    }
  };

  const visiblePromos = filterByTab(promotions);
  const tabCount = (key) => filterByTab.call(null, promotions).length; // reuse via call
  const getTabCount = (key) => {
    const now = new Date();
    switch (key) {
      case 'all':       return promotions.length;
      case 'active':    return promotions.filter(p => p.is_active).length;
      case 'inactive':  return promotions.filter(p => !p.is_active).length;
      case 'expired':   return promotions.filter(p => p.end_date && new Date(p.end_date) < now).length;
      case 'scheduled': return promotions.filter(p => p.start_date && new Date(p.start_date) > now).length;
      default: return 0;
    }
  };

  const openEdit = (promo) => { setSelectedPromo(promo); setShowForm(true); };
  const openCreate = () => { setSelectedPromo(null); setShowForm(true); };
  const openDelete = (promo) => setDeleteModal({ open: true, promo });

  const hasFilters = !!typeFilter;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Promotions & Discounts"
        subtitle="Create and manage promotional campaigns"
        icon={Tag}
        badge={promotions.length > 0 ? `${promotions.length} total` : null}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-theme-secondary bg-theme-primary hover:bg-theme-tertiary border border-theme rounded-lg transition-colors">
              <Download className="w-4 h-4" /> Export
            </button>
            <button onClick={openCreate}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-accent-gold rounded-lg hover:bg-accent-goldDark transition-colors">
              <Plus className="w-4 h-4" /> Create Promotion
            </button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Promotions', value: stats.total_promotions, icon: Tag,        color: 'text-blue-500',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20' },
          { label: 'Active',           value: stats.active_promotions, icon: TrendingUp, color: 'text-green-500',  bg: 'bg-green-500/10',  border: 'border-green-500/20' },
          { label: 'Total Usage',      value: stats.total_usage,       icon: Users,      color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
          { label: 'Total Savings',    value: `$${(stats.total_savings || 0).toLocaleString()}`, icon: DollarSign, color: 'text-accent-gold', bg: 'bg-accent-gold/10', border: 'border-accent-gold/20' },
        ].map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className="bg-theme-secondary border border-theme rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-theme-muted">{label}</span>
              <div className={`w-8 h-8 ${bg} border ${border} rounded-lg flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-theme-primary">{value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-theme-secondary border border-theme rounded-xl p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-theme-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name or coupon code..."
              className={`${inputClass} pl-9 pr-8`}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-primary">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(f => !f)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${hasFilters ? 'bg-accent-gold/10 text-accent-gold border-accent-gold/30' : 'text-theme-secondary bg-theme-primary border-theme hover:bg-theme-tertiary'}`}
            >
              <Filter className="w-4 h-4" />
              Filters {hasFilters && <span className="w-4 h-4 flex items-center justify-center bg-accent-gold text-white text-[10px] font-bold rounded-full">1</span>}
            </button>

            <div className="flex items-center border border-theme rounded-lg overflow-hidden">
              <button onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-accent-gold text-white' : 'bg-theme-primary text-theme-muted hover:bg-theme-tertiary'}`}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-accent-gold text-white' : 'bg-theme-primary text-theme-muted hover:bg-theme-tertiary'}`}>
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="pt-4 border-t border-theme">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Promotion Type</label>
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className={inputClass}>
                  <option value="">All Types</option>
                  <option value="percentage">Percentage Discount</option>
                  <option value="fixed_amount">Fixed Amount Off</option>
                  <option value="bogo">BOGO (Buy X Get Y)</option>
                  <option value="bulk_discount">Bulk Discount</option>
                </select>
              </div>
            </div>
            {hasFilters && (
              <button onClick={() => setTypeFilter('')} className="mt-3 text-xs text-theme-muted hover:text-theme-primary underline">
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Status Tabs + Content */}
      <div className="bg-theme-secondary border border-theme rounded-xl overflow-hidden">
        {/* Tab Bar */}
        <div className="flex items-center gap-1 px-4 pt-4 pb-0 border-b border-theme overflow-x-auto">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors border-b-2 -mb-px ${activeTab === tab.key ? 'border-accent-gold text-accent-gold bg-accent-gold/5' : 'border-transparent text-theme-muted hover:text-theme-primary'}`}
            >
              {tab.label}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-accent-gold text-white' : 'bg-theme-tertiary text-theme-muted'}`}>
                {getTabCount(tab.key)}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-theme border-t-accent-gold rounded-full animate-spin" />
            </div>
          ) : visiblePromos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 bg-accent-gold/10 border border-accent-gold/20 rounded-xl flex items-center justify-center mb-4">
                <Tag className="w-7 h-7 text-accent-gold" />
              </div>
              <p className="text-base font-semibold text-theme-primary mb-1">No promotions found</p>
              <p className="text-sm text-theme-muted mb-4">
                {searchQuery || hasFilters ? 'Try adjusting your search or filters' : 'Create a promotion to boost sales'}
              </p>
              {!searchQuery && !hasFilters && (
                <button onClick={openCreate}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-accent-gold rounded-lg hover:bg-accent-goldDark transition-colors">
                  <Plus className="w-4 h-4" /> Create Promotion
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visiblePromos.map(p => (
                <PromotionCard
                  key={p.id} promotion={p}
                  onEdit={openEdit} onDelete={openDelete} onToggleStatus={handleToggleStatus}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {visiblePromos.map(p => (
                <PromotionListItem
                  key={p.id} promotion={p}
                  onEdit={openEdit} onDelete={openDelete} onToggleStatus={handleToggleStatus}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Promotion Form Modal */}
      <PromotionFormModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setSelectedPromo(null); }}
        onSubmit={selectedPromo ? handleUpdate : handleCreate}
        promotion={selectedPromo}
      />

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, promo: null })}
        title="Delete Promotion"
        size="sm"
        footer={
          <div className="flex items-center gap-3">
            <button onClick={() => setDeleteModal({ open: false, promo: null })} disabled={deleteLoading}
              className="px-4 py-2 text-sm font-medium text-theme-secondary bg-theme-primary hover:bg-theme-tertiary border border-theme rounded-lg transition-colors">
              Cancel
            </button>
            <button onClick={handleDelete} disabled={deleteLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50">
              {deleteLoading && <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              Delete Promotion
            </button>
          </div>
        }
      >
        <p className="text-sm text-theme-secondary">
          Are you sure you want to delete <span className="font-semibold text-theme-primary">"{deleteModal.promo?.promotion_name}"</span>?
          This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default PromotionsPage;
