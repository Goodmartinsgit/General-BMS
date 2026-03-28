import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Filter, AlertTriangle, Package,
  TrendingDown, DollarSign, Search, X, RefreshCw,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { stockAPI } from '../api/stock';
import { branchesAPI } from '../api/branches';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/common/PageHeader';
import Modal from '../components/ui/Modal';
import StockDamageFormModal from '../components/stock/StockDamageFormModal';
import DamageCard from '../components/stock/DamageCard';

const DAMAGE_REASONS = [
  'Water Damage',
  'Physical Damage',
  'Manufacturing Defect',
  'Expired Product',
  'Theft/Vandalism',
  'Handling Error',
  'Storage Issue',
  'Other',
];

const DATE_TABS = ['All', 'Today', 'This Week', 'This Month'];

const StockDamages = () => {
  const { formatCurrency } = useCurrency();
  const { auth } = useAuth();
  const userPerms = auth?.user?.permissions || {};
  const canManageStock = userPerms['admin'] === true || userPerms['manage_stock'] === true;

  const [damages, setDamages] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ branch: '', damage_reason: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('All');

  const [showDamageForm, setShowDamageForm] = useState(false);
  const [selectedDamage, setSelectedDamage] = useState(null);

  const [stats, setStats] = useState({
    total_damages: 0,
    total_quantity: 0,
    this_month: 0,
    estimated_loss: 0,
  });

  const fetchDamages = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.branch) params.branchId = filters.branch;
      if (filters.damage_reason) params.damageType = filters.damage_reason;

      const data = await stockAPI.getDamages(params);
      const list = Array.isArray(data) ? data : [];
      setDamages(list);

      // Compute stats client-side from list
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      setStats({
        total_damages: list.length,
        total_quantity: list.reduce((s, d) => s + (parseInt(d.quantity_damaged) || 0), 0),
        this_month: list.filter(d => new Date(d.created_at) >= monthStart).length,
        estimated_loss: list.reduce((s, d) => s + (parseFloat(d.estimated_loss) || 0), 0),
      });
    } catch (err) {
      toast.error('Failed to load damage records');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchBranches = useCallback(async () => {
    try {
      const data = await branchesAPI.getBranches();
      setBranches(Array.isArray(data) ? data : (data?.branches || []));
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => { fetchDamages(); }, [fetchDamages]);
  useEffect(() => { fetchBranches(); }, [fetchBranches]);

  const handleCreateDamage = async (formData) => {
    setSubmitting(true);
    try {
      // Backend records one product per damage entry — loop through items
      for (const item of formData.items) {
        await stockAPI.recordDamage({
          branch_id: formData.branch_id,
          product_id: item.product_id,
          quantity: item.quantity,
          damage_reason: formData.damage_reason,
          damage_type: formData.damage_reason,
          notes: formData.notes,
        });
      }
      toast.success('Damage recorded successfully');
      setShowDamageForm(false);
      fetchDamages();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to record damage');
    } finally {
      setSubmitting(false);
    }
  };

  const clearFilters = () => {
    setFilters({ branch: '', damage_reason: '' });
    setSearchQuery('');
  };

  // Client-side date tab filter
  const filterByTab = (list) => {
    const now = new Date();
    if (activeTab === 'Today') {
      return list.filter(d => new Date(d.created_at).toDateString() === now.toDateString());
    }
    if (activeTab === 'This Week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return list.filter(d => new Date(d.created_at) >= weekAgo);
    }
    if (activeTab === 'This Month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return list.filter(d => new Date(d.created_at) >= monthStart);
    }
    return list;
  };

  // Client-side search filter
  const filterBySearch = (list) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(d =>
      d.product_name?.toLowerCase().includes(q) ||
      d.product_code?.toLowerCase().includes(q) ||
      d.branch_name?.toLowerCase().includes(q) ||
      d.damage_reason?.toLowerCase().includes(q)
    );
  };

  const visibleDamages = filterBySearch(filterByTab(damages));
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const headerActions = canManageStock ? (
    <button
      onClick={() => setShowDamageForm(true)}
      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold text-sm rounded-lg hover:bg-red-700 transition-colors"
    >
      <Plus className="w-4 h-4" />
      Record Damage
    </button>
  ) : null;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-[1700px] mx-auto pb-6 sm:pb-10">
      <PageHeader
        title="Stock Damages"
        subtitle="Track and manage damaged inventory"
        badge={`${stats.total_damages} Records`}
        icon={AlertTriangle}
        actions={headerActions}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="p-4 rounded-xl bg-theme-secondary border border-red-500/40 shadow-theme-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-theme-muted">Total Records</p>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-theme-primary">{stats.total_damages}</p>
        </div>
        <div className="p-4 rounded-xl bg-theme-secondary border border-yellow-500/40 shadow-theme-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-theme-muted">Damaged Units</p>
            <Package className="w-4 h-4 text-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-theme-primary">{stats.total_quantity.toLocaleString()}</p>
        </div>
        <div className="p-4 rounded-xl bg-theme-secondary border border-blue-500/40 shadow-theme-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-theme-muted">This Month</p>
            <TrendingDown className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-theme-primary">{stats.this_month}</p>
        </div>
        <div className="p-4 rounded-xl bg-theme-secondary border border-red-500/40 shadow-theme-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-theme-muted">Estimated Loss</p>
            <DollarSign className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-lg font-bold text-red-500">{formatCurrency(stats.estimated_loss)}</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-theme-secondary rounded-xl shadow-theme-sm border border-theme p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-theme-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by product, branch, or reason..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-theme-primary border border-theme rounded-lg text-sm text-theme-primary placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30"
            />
          </div>
          <div className="flex items-center gap-2">
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
              onClick={fetchDamages}
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
                <label className="block text-sm font-medium text-theme-secondary mb-1">Branch</label>
                <select
                  value={filters.branch}
                  onChange={e => setFilters(f => ({ ...f, branch: e.target.value }))}
                  className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30"
                >
                  <option value="">All Branches</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.branch_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">Damage Reason</label>
                <select
                  value={filters.damage_reason}
                  onChange={e => setFilters(f => ({ ...f, damage_reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30"
                >
                  <option value="">All Reasons</option>
                  {DAMAGE_REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
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

      {/* Date Tabs + Content */}
      <div className="bg-theme-secondary rounded-xl shadow-theme-sm border border-theme overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-theme overflow-x-auto">
          {DATE_TABS.map(tab => (
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
              <span className="ml-1.5 text-xs text-theme-muted">
                ({tab === 'All' ? damages.length : filterByTab(damages).length})
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 md:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-theme border-t-accent-gold rounded-full animate-spin" />
            </div>
          ) : visibleDamages.length === 0 ? (
            <div className="text-center py-16">
              <AlertTriangle className="w-12 h-12 text-theme-muted mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-theme-primary mb-1">No damage records found</h3>
              <p className="text-sm text-theme-muted mb-6">
                {searchQuery || activeFilterCount > 0
                  ? 'Try adjusting your search or filters'
                  : 'No damaged stock has been recorded yet'}
              </p>
              {canManageStock && (
              <button
                onClick={() => setShowDamageForm(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white font-semibold text-sm rounded-lg hover:bg-red-700 transition-colors"
              >
                <Plus className="w-4 h-4" /> Record Damage
              </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleDamages.map(damage => (
                <DamageCard
                  key={damage.id}
                  damageData={damage}
                  onView={setSelectedDamage}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Record Damage Modal */}
      <StockDamageFormModal
        isOpen={showDamageForm}
        onClose={() => setShowDamageForm(false)}
        onSubmit={handleCreateDamage}
        branches={branches}
        loading={submitting}
      />

      {/* Detail Modal */}
      {selectedDamage && (
        <Modal
          isOpen={!!selectedDamage}
          onClose={() => setSelectedDamage(null)}
          title="Damage Record Details"
          size="md"
        >
          <div className="space-y-4">
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-xs text-theme-muted mb-1">Product</p>
              <h3 className="font-semibold text-theme-primary">{selectedDamage.product_name}</h3>
              <p className="text-xs font-mono text-theme-muted mt-0.5">{selectedDamage.product_code}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-theme-tertiary rounded-lg">
                <p className="text-xs text-theme-muted mb-0.5">Branch</p>
                <p className="font-medium text-theme-primary text-sm">{selectedDamage.branch_name}</p>
              </div>
              <div className="p-3 bg-theme-tertiary rounded-lg">
                <p className="text-xs text-theme-muted mb-0.5">Damage Reason</p>
                <p className="font-medium text-theme-primary text-sm">{selectedDamage.damage_reason || selectedDamage.damage_type || '—'}</p>
              </div>
              <div className="p-3 bg-theme-tertiary rounded-lg">
                <p className="text-xs text-theme-muted mb-0.5">Damaged Units</p>
                <p className="text-xl font-bold text-red-500">{selectedDamage.quantity_damaged}</p>
              </div>
              <div className="p-3 bg-theme-tertiary rounded-lg">
                <p className="text-xs text-theme-muted mb-0.5">Estimated Loss</p>
                <p className="text-xl font-bold text-red-500">{formatCurrency(selectedDamage.estimated_loss || 0)}</p>
              </div>
            </div>

            {selectedDamage.notes && (
              <div>
                <p className="text-xs font-medium text-theme-secondary mb-1">Notes</p>
                <p className="text-sm text-theme-secondary bg-theme-tertiary p-3 rounded-lg">
                  {selectedDamage.notes}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-theme-muted pt-2 border-t border-theme">
              <span>Recorded: {new Date(selectedDamage.created_at).toLocaleString()}</span>
              {selectedDamage.reported_by_name && <span>By: {selectedDamage.reported_by_name}</span>}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default StockDamages;
