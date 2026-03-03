import React, { useState, useEffect, useCallback } from 'react';
import {
  Filter, Package, TrendingUp, TrendingDown, Activity,
  Search, X, RefreshCw,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { stockAPI } from '../api/stock';
import { branchesAPI } from '../api/branches';
import StockActivityLog from '../components/stock/StockActivityLog';
import PageHeader from '../components/common/PageHeader';

const MOVEMENT_TYPES = [
  { value: 'sale',         label: 'Sales' },
  { value: 'receipt',      label: 'Receipts' },
  { value: 'return',       label: 'Returns' },
  { value: 'transfer_in',  label: 'Transfers In' },
  { value: 'transfer_out', label: 'Transfers Out' },
  { value: 'damage',       label: 'Damages' },
  { value: 'adjustment',   label: 'Adjustments' },
];

const DATE_RANGES = [
  { value: '',        label: 'All Time' },
  { value: 'today',   label: 'Today' },
  { value: 'week',    label: 'This Week' },
  { value: 'month',   label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year',    label: 'This Year' },
];

const getDateRange = (range) => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  switch (range) {
    case 'today': {
      const today = fmt(now);
      return { startDate: today, endDate: today };
    }
    case 'week': {
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      return { startDate: fmt(start), endDate: fmt(now) };
    }
    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: fmt(start), endDate: fmt(now) };
    }
    case 'quarter': {
      const quarterStart = Math.floor(now.getMonth() / 3) * 3;
      const start = new Date(now.getFullYear(), quarterStart, 1);
      return { startDate: fmt(start), endDate: fmt(now) };
    }
    case 'year': {
      const start = new Date(now.getFullYear(), 0, 1);
      return { startDate: fmt(start), endDate: fmt(now) };
    }
    default:
      return {};
  }
};

const StockActivity = () => {
  const [activities, setActivities]   = useState([]);
  const [branches, setBranches]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters]         = useState({
    movementType: '',
    branchId:     '',
    dateRange:    '',
  });

  // ─── Fetch branches once ───────────────────────────────────────────────────
  useEffect(() => {
    branchesAPI.getBranches()
      .then(setBranches)
      .catch(() => toast.error('Failed to load branches'));
  }, []);

  // ─── Fetch activity whenever filters change ────────────────────────────────
  const fetchActivity = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 200 };
      if (filters.movementType) params.movementType = filters.movementType;
      if (filters.branchId)     params.branchId     = filters.branchId;
      const dateRange = getDateRange(filters.dateRange);
      if (dateRange.startDate) params.startDate = dateRange.startDate;
      if (dateRange.endDate)   params.endDate   = dateRange.endDate;

      const data = await stockAPI.getActivity(params);
      setActivities(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load stock activity');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchActivity(); }, [fetchActivity]);

  // ─── Client-side search ────────────────────────────────────────────────────
  const filtered = activities.filter(a => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.product_name?.toLowerCase().includes(q) ||
      a.product_code?.toLowerCase().includes(q) ||
      a.branch_name?.toLowerCase().includes(q) ||
      a.notes?.toLowerCase().includes(q)
    );
  });

  // ─── Stats (computed from visible filtered data) ───────────────────────────
  const stockIn  = filtered.filter(a => (a.quantity ?? 0) > 0).reduce((s, a) => s + (a.quantity ?? 0), 0);
  const stockOut = filtered.filter(a => (a.quantity ?? 0) < 0).reduce((s, a) => s + Math.abs(a.quantity ?? 0), 0);
  const netChange = stockIn - stockOut;

  const activeFilterCount = [filters.movementType, filters.branchId, filters.dateRange].filter(Boolean).length;

  const clearFilters = () => {
    setFilters({ movementType: '', branchId: '', dateRange: '' });
    setSearchQuery('');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Stock Activity Log"
        subtitle="Complete history of all stock movements"
        icon={Activity}
        badge={`${filtered.length} records`}
        actions={
          <button
            onClick={fetchActivity}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-theme-secondary bg-theme-secondary border border-theme rounded-lg hover:bg-theme-tertiary transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Records Loaded', value: filtered.length, icon: Activity,    color: 'text-accent-gold',  bg: 'bg-accent-gold/10'  },
          { label: 'Stock In',       value: `+${stockIn.toLocaleString()}`,  icon: TrendingUp,   color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Stock Out',      value: `-${stockOut.toLocaleString()}`, icon: TrendingDown, color: 'text-red-500',   bg: 'bg-red-500/10'   },
          {
            label: 'Net Change',
            value: `${netChange >= 0 ? '+' : ''}${netChange.toLocaleString()}`,
            icon: Package,
            color: netChange >= 0 ? 'text-green-500' : 'text-red-500',
            bg:    netChange >= 0 ? 'bg-green-500/10' : 'bg-red-500/10',
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-theme-secondary border border-theme rounded-xl p-3 sm:p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div className="min-w-0">
              <p className={`text-base sm:text-xl font-bold leading-tight ${color}`}>{value}</p>
              <p className="text-[10px] sm:text-xs text-theme-muted">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-theme-secondary border border-theme rounded-xl p-3 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search by product, branch, or notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-theme-primary border border-theme text-theme-primary text-sm rounded-lg placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-primary"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-lg transition-colors ${
              activeFilterCount > 0
                ? 'bg-accent-gold/10 border-accent-gold/30 text-accent-gold'
                : 'bg-theme-primary border-theme text-theme-secondary hover:bg-theme-tertiary'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-accent-gold text-white rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="pt-3 border-t border-theme space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Movement Type */}
              <div>
                <label className="block text-xs font-medium text-theme-muted mb-1">Movement Type</label>
                <select
                  value={filters.movementType}
                  onChange={e => setFilters(f => ({ ...f, movementType: e.target.value }))}
                  className="w-full px-3 py-2 bg-theme-primary border border-theme text-theme-primary text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 transition-all"
                >
                  <option value="">All Types</option>
                  {MOVEMENT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Branch */}
              <div>
                <label className="block text-xs font-medium text-theme-muted mb-1">Branch</label>
                <select
                  value={filters.branchId}
                  onChange={e => setFilters(f => ({ ...f, branchId: e.target.value }))}
                  className="w-full px-3 py-2 bg-theme-primary border border-theme text-theme-primary text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 transition-all"
                >
                  <option value="">All Branches</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.branch_name}</option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-xs font-medium text-theme-muted mb-1">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={e => setFilters(f => ({ ...f, dateRange: e.target.value }))}
                  className="w-full px-3 py-2 bg-theme-primary border border-theme text-theme-primary text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 transition-all"
                >
                  {DATE_RANGES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs text-theme-muted hover:text-red-500 transition-colors flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="bg-theme-secondary border border-theme rounded-xl p-4 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-theme border-t-accent-gold rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-theme-muted mx-auto mb-3 opacity-40" />
            <p className="text-theme-primary font-medium">No activity found</p>
            <p className="text-theme-muted text-sm mt-1">
              {searchQuery || activeFilterCount > 0
                ? 'Try adjusting your search or filters'
                : 'No stock movements have been recorded yet'}
            </p>
          </div>
        ) : (
          <StockActivityLog activities={filtered} />
        )}
      </div>
    </div>
  );
};

export default StockActivity;
