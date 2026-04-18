import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Package, Edit, Trash2, Star, AlertTriangle,
  CheckCircle, XCircle, BarChart3, TrendingUp, Eye,
  PlusCircle, SlidersHorizontal, Activity, ChevronLeft, ChevronRight,
  Calendar, Globe, Loader2, Palette, Image as ImageIcon, Layers, Tag,
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import Modal from '../components/ui/Modal';
import ColorStockManager from '../components/product/ColorStockManager';

// ── Date range helper ─────────────────────────────────────────────────────────
const getDateRange = (filter) => {
  const now = new Date();
  const start = new Date();
  switch (filter) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      return { start: start.toISOString(), end: now.toISOString() };
    case 'week':
      start.setDate(now.getDate() - 7);
      return { start: start.toISOString(), end: now.toISOString() };
    case 'month':
      start.setMonth(now.getMonth() - 1);
      return { start: start.toISOString(), end: now.toISOString() };
    case 'year':
      start.setFullYear(now.getFullYear() - 1);
      return { start: start.toISOString(), end: now.toISOString() };
    default:
      return { start: null, end: null };
  }
};

// ── Movement type labels / colours ────────────────────────────────────────────
const MOVEMENT_META = {
  receipt:      { label: 'Stock Receipt',  color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  sale:         { label: 'Sale',           color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  adjustment:   { label: 'Adjustment',     color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  return:       { label: 'Return',         color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  transfer_in:  { label: 'Transfer In',    color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' },
  transfer_out: { label: 'Transfer Out',   color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  damage:                { label: 'Damage / Loss',    color: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  initial:               { label: 'Initial Stock',    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  online_sale:           { label: 'Online Sale',      color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300' },
  online_order_reserved: { label: 'Online Reserved',  color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  sale_reversal:         { label: 'Sale Reversal',    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  sale_deletion:         { label: 'Sale Deleted',     color: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
};
const movementMeta = (type) =>
  MOVEMENT_META[type] ?? { label: type ?? 'Unknown', color: 'bg-gray-100 text-gray-600' };

// ── Inline stock modal (pre-fills product) ────────────────────────────────────
const inputCls =
  'w-full px-3 py-2.5 bg-theme-primary border border-theme rounded-lg text-sm text-theme-primary ' +
  'placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 transition-all';
const labelCls = 'block text-sm font-medium text-theme-secondary mb-1';

const StockModal = ({ product, mode, branches, onClose, onSuccess }) => {
  const { singleBranchMode, currentBranchId } = useBranch();
  const [branchId, setBranchId] = useState('');
  const [totalQty, setTotalQty] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Determine product stock mode
  const hasVariants = product.has_variants && product.variants?.length > 0;
  const leafCategories = useMemo(
    () => (product.category_assignments || []).filter(a => a.is_leaf),
    [product.category_assignments]
  );
  const hasCategoryStock = !hasVariants && leafCategories.length > 0;
  const stockMode = hasVariants ? 'variant' : hasCategoryStock ? 'category' : 'simple';

  // Distribution state: { [id]: quantity_string }
  const [allocations, setAllocations] = useState(() => {
    if (stockMode === 'variant') {
      return Object.fromEntries(product.variants.map(v => [v.id, '']));
    }
    if (stockMode === 'category') {
      return Object.fromEntries(leafCategories.map(c => [c.category_id, '']));
    }
    return {};
  });

  const updateAlloc = (id, val) => setAllocations(a => ({ ...a, [id]: val }));

  // Pre-fill branch in single-branch mode
  useEffect(() => {
    if (singleBranchMode && currentBranchId) setBranchId(String(currentBranchId));
  }, [singleBranchMode, currentBranchId]);

  const isAdd = mode === 'add';
  const title = isAdd ? 'Add Stock' : 'Adjust Stock';
  const movementType = isAdd ? 'receipt' : 'adjustment';
  const totalEntered = parseFloat(totalQty) || 0;

  // Sum of distributed quantities
  const allocatedSum = useMemo(() => {
    return Object.values(allocations).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  }, [allocations]);

  const isDistributed = stockMode !== 'simple';
  const isBalanced = isDistributed ? allocatedSum === totalEntered && totalEntered !== 0 : true;
  const remaining = totalEntered - allocatedSum;

  // Check if any allocation would cause negative stock
  const negativeWarnings = useMemo(() => {
    if (stockMode === 'simple') return [];
    const warnings = [];
    const items = stockMode === 'variant' ? product.variants : leafCategories;
    for (const item of items) {
      const id = stockMode === 'variant' ? item.id : item.category_id;
      const allocated = parseFloat(allocations[id]) || 0;
      if (allocated === 0) continue;
      const currentStock = stockMode === 'variant'
        ? parseInt(item.quantity_on_hand ?? item.total_stock ?? 0)
        : parseInt(item.stock_allocated ?? 0);
      const afterStock = currentStock + allocated;
      if (afterStock < 0) {
        const name = stockMode === 'variant' ? item.variant_name : item.category_name;
        warnings.push(`${name}: ${currentStock} + (${allocated}) = ${afterStock}`);
      }
    }
    return warnings;
  }, [allocations, stockMode, product.variants, leafCategories]);

  const canSubmit = isDistributed
    ? isBalanced && negativeWarnings.length === 0
    : totalEntered !== 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const resolvedBranch = branchId || currentBranchId;

    // Validation
    if (isDistributed && !isBalanced) {
      return toast.error('Distribution must exactly match the total quantity');
    }
    if (isAdd && totalEntered <= 0) return toast.error('Total quantity must be positive');
    if (!totalEntered || isNaN(totalEntered)) return toast.error('Enter a valid total quantity');

    if (stockMode !== 'category' && !resolvedBranch) {
      return toast.error('Please select a branch');
    }

    setSaving(true);
    try {
      if (isDistributed) {
        // Build allocations array for batch endpoint
        const allocArray = Object.entries(allocations)
          .filter(([, val]) => parseFloat(val) !== 0 && val !== '')
          .map(([id, val]) => {
            const obj = { quantity_change: parseFloat(val) };
            if (stockMode === 'variant') obj.variant_id = parseInt(id);
            else obj.category_id = parseInt(id);
            return obj;
          });

        await api.post('/inventory/update-batch', {
          product_id: product.id,
          branch_id: resolvedBranch || undefined,
          movement_type: movementType,
          notes,
          allocations: allocArray,
        });
      } else {
        // Simple product — single update
        await api.post('/inventory/update', {
          product_id: product.id,
          branch_id: resolvedBranch,
          quantity_change: totalEntered,
          movement_type: movementType,
          notes,
        });
      }

      toast.success(`Stock ${isAdd ? 'added' : 'adjusted'} successfully`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update stock');
    } finally {
      setSaving(false);
    }
  };

  // Build distribution items
  const distItems = useMemo(() => {
    if (stockMode === 'variant') {
      return product.variants.map(v => ({
        id: v.id,
        name: v.variant_name,
        currentStock: parseInt(v.quantity_on_hand ?? v.total_stock ?? 0),
        sku: v.sku,
      }));
    }
    if (stockMode === 'category') {
      return leafCategories.map(c => ({
        id: c.category_id,
        name: c.category_name + (c.unit_of_measure ? ` (${c.unit_of_measure})` : ''),
        currentStock: parseInt(c.stock_allocated ?? 0),
      }));
    }
    return [];
  }, [stockMode, product.variants, leafCategories]);

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={title}
      subtitle={`${product.product_name} (${product.product_code})`}
      size={isDistributed ? 'lg' : 'md'}
      footer={
        <div className="flex items-center justify-between w-full">
          {/* Balance indicator in footer */}
          {isDistributed && totalEntered > 0 && (
            <div className={`text-xs font-medium ${isBalanced ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {isBalanced ? '✓ Balanced' : `${remaining > 0 ? remaining + ' remaining' : Math.abs(remaining) + ' over-allocated'}`}
            </div>
          )}
          {!isDistributed && <div />}
          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose} disabled={saving}
              className="px-4 py-2 text-sm font-medium text-theme-secondary bg-theme-primary hover:bg-theme-tertiary border border-theme rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" form="stock-modal-form" disabled={saving || !canSubmit}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-accent-gold rounded-lg hover:bg-accent-goldDark transition-colors disabled:opacity-50">
              {saving && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              {isAdd ? <PlusCircle className="w-4 h-4" /> : <SlidersHorizontal className="w-4 h-4" />}
              {title}
            </button>
          </div>
        </div>
      }
    >
      <form id="stock-modal-form" onSubmit={handleSubmit} className="space-y-4">

        {/* Stock Mode Indicator */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-theme-tertiary border border-theme">
          <div className={`w-2 h-2 rounded-full ${
            stockMode === 'variant' ? 'bg-purple-500' : stockMode === 'category' ? 'bg-blue-500' : 'bg-green-500'
          }`} />
          <span className="text-xs font-medium text-theme-secondary">
            {stockMode === 'variant' ? `Variant-level stock · ${product.variants.length} variants` :
             stockMode === 'category' ? `Category-attribute stock · ${leafCategories.length} categories` :
             'Branch inventory stock'}
          </span>
        </div>

        {/* Branch — for variant and simple modes (not category), hidden in single-branch */}
        {stockMode !== 'category' && !singleBranchMode && (
          <div>
            <label className={labelCls}>Branch <span className="text-red-500">*</span></label>
            <select value={branchId} onChange={e => setBranchId(e.target.value)}
              required className={inputCls}>
              <option value="">Select Branch…</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.branch_name}{b.main_branch ? ' (Main)' : ''}</option>
              ))}
            </select>
          </div>
        )}

        {/* Total Quantity */}
        <div>
          <label className={labelCls}>
            {isAdd ? 'Total Quantity to Add' : 'Total Quantity Change'} <span className="text-red-500">*</span>
          </label>
          <input type="number" value={totalQty}
            onChange={e => setTotalQty(e.target.value)}
            placeholder={isAdd ? 'e.g. 100' : 'e.g. 50 or -20'}
            required className={inputCls} />
          {!isAdd && stockMode === 'simple' && (
            <p className="mt-1 text-xs text-theme-muted">Use a negative number to deduct stock.</p>
          )}
          {isDistributed && totalEntered > 0 && (
            <p className="mt-1 text-xs text-theme-muted">
              Distribute this total across the {stockMode === 'variant' ? 'variants' : 'categories'} below.
            </p>
          )}
        </div>

        {/* ── Distribution Table ── */}
        {isDistributed && totalEntered !== 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className={labelCls + ' mb-0'}>
                Distribution <span className="text-red-500">*</span>
              </label>
              {/* Balance badge */}
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                isBalanced
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                  : remaining > 0
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
              }`}>
                {isBalanced ? '✓ Balanced' :
                 remaining > 0 ? `${remaining} unallocated` :
                 `${Math.abs(remaining)} over-allocated`}
              </span>
            </div>

            <div className="border border-theme rounded-lg overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-theme-tertiary text-xs font-medium text-theme-muted uppercase tracking-wide">
                <div className="col-span-5">{stockMode === 'variant' ? 'Variant' : 'Category'}</div>
                <div className="col-span-2 text-center">Current</div>
                <div className="col-span-3 text-center">{isAdd ? 'Add' : 'Change'}</div>
                <div className="col-span-2 text-center">After</div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-theme max-h-[280px] overflow-y-auto">
                {distItems.map(item => {
                  const val = parseFloat(allocations[item.id]) || 0;
                  const afterStock = item.currentStock + val;
                  const isNeg = afterStock < 0;
                  return (
                    <div key={item.id} className="grid grid-cols-12 gap-2 px-3 py-2.5 items-center hover:bg-theme-tertiary/50 transition-colors">
                      <div className="col-span-5">
                        <p className="text-sm font-medium text-theme-primary truncate">{item.name}</p>
                        {item.sku && <p className="text-xs text-theme-muted">{item.sku}</p>}
                      </div>
                      <div className="col-span-2 text-center">
                        <span className="text-sm font-medium text-theme-secondary">{item.currentStock}</span>
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          value={allocations[item.id]}
                          onChange={e => updateAlloc(item.id, e.target.value)}
                          placeholder="0"
                          min={isAdd ? '0' : undefined}
                          className={`w-full px-2 py-1.5 text-sm text-center rounded-md border transition-all
                            ${isNeg
                              ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                              : 'border-theme bg-theme-primary text-theme-primary'
                            }
                            focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30`}
                        />
                      </div>
                      <div className="col-span-2 text-center">
                        <span className={`text-sm font-bold ${
                          val === 0 ? 'text-theme-muted' :
                          isNeg ? 'text-red-600 dark:text-red-400' :
                          'text-green-600 dark:text-green-400'
                        }`}>
                          {val === 0 ? '—' : afterStock}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary row */}
              <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-theme-tertiary border-t border-theme">
                <div className="col-span-5 text-xs font-semibold text-theme-secondary">TOTAL</div>
                <div className="col-span-2 text-center text-xs font-semibold text-theme-secondary">
                  {distItems.reduce((s, i) => s + i.currentStock, 0)}
                </div>
                <div className={`col-span-3 text-center text-xs font-bold ${
                  isBalanced ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
                }`}>
                  {allocatedSum} / {totalEntered}
                </div>
                <div className="col-span-2 text-center text-xs font-bold text-theme-secondary">
                  {distItems.reduce((s, i) => s + i.currentStock, 0) + allocatedSum}
                </div>
              </div>
            </div>

            {/* Negative stock warnings */}
            {negativeWarnings.length > 0 && (
              <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1">⚠ Negative stock warning:</p>
                {negativeWarnings.map((w, i) => (
                  <p key={i} className="text-xs text-red-600 dark:text-red-400">{w}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Simple mode preview */}
        {stockMode === 'simple' && totalEntered !== 0 && (
          <div className={`p-3 rounded-lg border ${
            (parseInt(product.total_stock ?? 0) + totalEntered) >= 0
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            <p className="text-xs text-theme-muted mb-1">Stock Preview</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-theme-secondary">
                Current: {parseInt(product.total_stock ?? 0)} units
              </span>
              <span className="text-theme-muted">→</span>
              <span className={`font-bold ${
                (parseInt(product.total_stock ?? 0) + totalEntered) >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {parseInt(product.total_stock ?? 0) + totalEntered} units
              </span>
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className={labelCls}>Notes / Reference</label>
          <textarea value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2} placeholder="Invoice number, reason for adjustment…"
            className={`${inputCls} resize-none`} />
        </div>
      </form>
    </Modal>
  );
};

// ── Stock Activity History ────────────────────────────────────────────────────
const ITEMS_PER_PAGE = 10;
const DATE_FILTERS = [
  { value: 'today', label: 'Today' },
  { value: 'week',  label: 'Week'  },
  { value: 'month', label: 'Month' },
  { value: 'year',  label: 'Year'  },
  { value: 'all',   label: 'All'   },
  { value: 'custom',label: 'Custom'},
];

const StockActivityHistory = ({ productId, refreshKey }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.get('/stock/activity', { params: { productId, limit: 500 } });
        if (!cancelled) setActivities(res.data?.movements ?? res.data ?? []);
      } catch {
        if (!cancelled) toast.error('Failed to load stock activity');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [productId, refreshKey]);

  const filtered = useMemo(() => {
    if (!activities.length) return [];
    let range = { start: null, end: null };
    if (dateFilter === 'custom') {
      range = {
        start: customStart ? new Date(customStart).toISOString() : null,
        end:   customEnd   ? new Date(customEnd + 'T23:59:59').toISOString() : null,
      };
    } else if (dateFilter !== 'all') {
      range = getDateRange(dateFilter);
    }
    return activities.filter(a => {
      const t = new Date(a.created_at);
      if (range.start && t < new Date(range.start)) return false;
      if (range.end   && t > new Date(range.end))   return false;
      return true;
    });
  }, [activities, dateFilter, customStart, customEnd]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleFilter = (val) => { setDateFilter(val); setPage(1); };

  const QtyCell = ({ row }) => {
    const qty = parseFloat(row.quantity ?? 0);
    return (
      <span className={`font-bold ${qty >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
        {qty >= 0 ? '+' : ''}{qty}
      </span>
    );
  };

  return (
    <div className="rounded-xl shadow-theme-sm border border-theme overflow-hidden bg-theme-secondary">
      {/* Header */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 bg-theme-tertiary border-b border-theme flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-base sm:text-lg font-bold text-theme-primary flex items-center gap-2">
          <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-accent-gold" />
          Stock Activity History
          <span className="text-xs font-normal text-theme-muted">({filtered.length} records)</span>
        </h2>
        <div className="flex flex-wrap gap-1">
          {DATE_FILTERS.map(f => (
            <button key={f.value} onClick={() => handleFilter(f.value)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                dateFilter === f.value
                  ? 'bg-accent-gold text-white'
                  : 'bg-theme-primary text-theme-secondary hover:bg-theme-tertiary border border-theme'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom date inputs */}
      {dateFilter === 'custom' && (
        <div className="px-4 sm:px-6 py-3 bg-theme-tertiary border-b border-theme flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-theme-muted" />
            <span className="text-xs text-theme-muted">From:</span>
            <input type="date" value={customStart}
              onChange={e => { setCustomStart(e.target.value); setPage(1); }}
              className="text-xs px-2 py-1 rounded border border-theme bg-theme-primary text-theme-primary focus:ring-1 focus:ring-accent-gold/30" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-theme-muted">To:</span>
            <input type="date" value={customEnd}
              onChange={e => { setCustomEnd(e.target.value); setPage(1); }}
              className="text-xs px-2 py-1 rounded border border-theme bg-theme-primary text-theme-primary focus:ring-1 focus:ring-accent-gold/30" />
          </div>
        </div>
      )}

      {/* Body */}
      {loading ? (
        <div className="flex items-center justify-center py-14">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-gold" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-14 text-center text-theme-muted">
          <Activity className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No activity found for the selected period</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-theme-tertiary">
                <tr>
                  {['Date & Time', 'Activity Type', 'Qty Change', 'Balance After', 'Stock Balance', 'Branch', 'Notes / Reference', 'Performed By'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-theme-muted uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-theme">
                {paginated.map((row, i) => {
                  const meta = movementMeta(row.movement_type);
                  const variantLabel = row.display_variant_name || row.variant_name;
                  return (
                    <tr key={row.id ?? i} className="hover:bg-theme-tertiary/50 transition-colors">
                      <td className="px-4 py-3 text-xs text-theme-secondary whitespace-nowrap">
                        {new Date(row.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${meta.color}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3"><QtyCell row={row} /></td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold text-theme-primary">{row.quantity_after ?? '—'}</span>
                        {variantLabel && (
                          <span className="block text-[10px] text-theme-muted mt-0.5">{variantLabel}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-theme-primary">
                        {row.total_stock_after != null ? row.total_stock_after : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-theme-secondary">{row.branch_name || (row.movement_type?.startsWith('online') ? 'Online' : '—')}</td>
                      <td className="px-4 py-3 text-xs text-theme-secondary max-w-[180px] truncate" title={row.notes}>
                        {row.notes ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-theme-secondary">{row.performed_by_name ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden divide-y divide-theme">
            {paginated.map((row, i) => {
              const meta = movementMeta(row.movement_type);
              const qty  = parseFloat(row.quantity ?? 0);
              const variantLabel = row.display_variant_name || row.variant_name;
              return (
                <div key={row.id ?? i} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${meta.color}`}>{meta.label}</span>
                      {variantLabel && (
                        <span className="ml-2 text-[10px] text-theme-muted">{variantLabel}</span>
                      )}
                    </div>
                    <span className="text-xs text-theme-muted whitespace-nowrap">{new Date(row.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-5">
                    <div>
                      <p className="text-xs text-theme-muted mb-0.5">Qty Change</p>
                      <span className={`font-bold text-sm ${qty >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {qty >= 0 ? '+' : ''}{qty}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-theme-muted mb-0.5">Balance</p>
                      <p className="text-sm font-bold text-theme-primary">{row.quantity_after ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-theme-muted mb-0.5">Stock Bal.</p>
                      <p className="text-sm font-bold text-theme-primary">{row.total_stock_after != null ? row.total_stock_after : '—'}</p>
                    </div>
                    {row.branch_name && (
                      <div>
                        <p className="text-xs text-theme-muted mb-0.5">Branch</p>
                        <p className="text-xs text-theme-secondary">{row.branch_name}</p>
                      </div>
                    )}
                  </div>
                  {row.notes && <p className="text-xs text-theme-muted">Note: {row.notes}</p>}
                  {row.performed_by_name && <p className="text-xs text-theme-muted">By: {row.performed_by_name}</p>}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 sm:px-6 py-3 border-t border-theme flex items-center justify-between">
              <p className="text-xs text-theme-muted">
                {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 rounded-lg border border-theme hover:bg-theme-tertiary disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft className="w-4 h-4 text-theme-secondary" />
                </button>
                <span className="text-xs font-semibold text-theme-primary">{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-theme hover:bg-theme-tertiary disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ChevronRight className="w-4 h-4 text-theme-secondary" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const { auth } = useAuth();
  const user = auth?.user;

  const { singleBranchMode, branches } = useBranch();
  const [product, setProduct]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [stockModal, setStockModal] = useState(null); // null | 'add' | 'adjust'
  const [refreshKey, setRefreshKey] = useState(0);   // increment to re-fetch activity
  const [toggling, setToggling]     = useState(false);

  const userPerms = user?.permissions || {};
  const canEdit  = userPerms['manage_products'] === true || userPerms['admin'] === true;

  useEffect(() => { fetchProduct(); }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/products/${id}`);
      setProduct(res.data);
    } catch {
      toast.error('Failed to load product');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const toggleOnline = async () => {
    if (!canEdit || toggling) return;
    setToggling(true);
    const next = !product.is_online_available;
    try {
      await api.put(`/products/${id}`, { is_online_available: next });
      await fetchProduct();
      toast.success(next ? 'Product is now available in the online store' : 'Product removed from online store');
    } catch {
      toast.error('Failed to update online availability');
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted successfully');
      navigate('/products');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    }
  };

  // Use product_images_v2 (images array) first, then fall back to legacy product_images JSONB, then category assignment images
  const allImages = (() => {
    if (product?.images?.length > 0) return product.images;
    if (product?.product_images && Array.isArray(product.product_images) && product.product_images.length > 0) {
      return product.product_images.map(img => typeof img === 'string' ? { image_url: img } : img);
    }
    if (product?.image_url) return [{ image_url: product.image_url }];
    // Fallback: use category assignment images
    if (product?.category_assignments && product.category_assignments.length > 0) {
      const catImages = product.category_assignments
        .filter(a => a.image_url)
        .map(a => ({ image_url: a.image_url, alt_text: a.category_name }));
      if (catImages.length > 0) return catImages;
    }
    return [];
  })();

  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  const getImage = () => {
    if (allImages.length > 0) {
      return allImages[selectedImageIdx]?.image_url || allImages[0]?.image_url;
    }
    return null;
  };

  const getStock = () => {
    const inv = product?.total_stock ?? product?.stock ?? product?.quantity_on_hand ?? 0;
    if (inv > 0) return inv;
    if (product?.category_assignments?.length > 0) {
      return product.category_assignments.reduce((sum, a) => sum + (parseInt(a.stock_allocated) || 0), 0);
    }
    return inv;
  };
  const getReorderLevel = () => product?.reorder_level ?? 10;
  const isLowStock     = () => getStock() <= getReorderLevel();

  const effectivePrice = product?.effective_price || product?.retail_price || product?.selling_price || 0;
  const effectiveCost  = product?.effective_cost_price || product?.cost_price || 0;
  const hasPriceRange = product?.price_min && product?.price_max && product?.price_min !== product?.price_max;
  const selectionPrices = product?.selection_prices || [];
  const hasVariantPricing = selectionPrices.length > 0 || hasPriceRange;
  const profitPerUnit = !hasVariantPricing && effectivePrice && effectiveCost
    ? effectivePrice - effectiveCost : null;
  const profitMargin  = profitPerUnit !== null && effectivePrice
    ? ((profitPerUnit / effectivePrice) * 100).toFixed(1) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-gold" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <Package className="w-16 h-16 text-theme-muted mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-theme-primary mb-2">Product Not Found</h2>
        <p className="text-theme-muted mb-6">The product you're looking for doesn't exist or has been deleted.</p>
        <button onClick={() => navigate('/products')}
          className="px-6 py-3 bg-accent-gold text-white rounded-lg font-semibold hover:bg-accent-goldDark transition">
          Back to Products
        </button>
      </div>
    );
  }

  const renderStockBadge = () => {
    const stock  = getStock();
    const reorder = getReorderLevel();
    if (stock <= 0) return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
        <XCircle className="w-4 h-4" /> Out of Stock
      </span>
    );
    if (stock <= reorder) return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
        <AlertTriangle className="w-4 h-4" /> Low Stock
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
        <CheckCircle className="w-4 h-4" /> In Stock
      </span>
    );
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6">

        {/* ── Header row ── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <button onClick={() => navigate('/products')}
            className="flex items-center gap-2 text-theme-secondary hover:text-theme-primary transition-colors text-sm w-fit">
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </button>
          <div className="flex-1" />

          {canEdit && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Add Stock */}
              <button onClick={() => setStockModal('add')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition">
                <PlusCircle className="w-4 h-4" />
                Add Stock
              </button>
              {/* Adjust Stock */}
              <button onClick={() => setStockModal('adjust')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition">
                <SlidersHorizontal className="w-4 h-4" />
                Adjust Stock
              </button>
              {/* Edit */}
              <button onClick={() => navigate(`/products?edit=${product.id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-accent-gold hover:bg-accent-goldDark text-white rounded-lg text-sm font-semibold transition">
                <Edit className="w-4 h-4" />
                Edit
              </button>
              {/* Delete */}
              <button onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition">
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>

        {/* ── Product header card ── */}
        <div className="bg-theme-secondary rounded-xl shadow-theme-sm border border-theme p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-sm font-mono font-semibold px-3 py-1 rounded-lg bg-accent-gold/20 text-accent-gold border border-accent-gold/40">
                  {product.product_code}
                </span>
                <span className={`px-2 py-1 text-xs font-bold rounded border uppercase ${
                  product.product_type === 'service'
                    ? 'bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700'
                    : product.product_type === 'digital'
                    ? 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700'
                    : product.product_type === 'bundle'
                    ? 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700'
                    : 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700'
                }`}>
                  {product.product_type || 'physical'}
                </span>
                {product.is_featured && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700">
                    <Star className="w-3 h-3 fill-yellow-500" /> Featured
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-theme-primary mb-1">{product.product_name}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-theme-muted">
                {product.brand_name    && <span>Brand: <strong className="text-theme-primary">{product.brand_name}</strong></span>}
                {product.category_name && <span>Category: <strong className="text-theme-primary">{product.category_name}</strong></span>}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Sell Online toggle */}
              <button
                onClick={toggleOnline}
                disabled={!canEdit || toggling}
                title={canEdit ? (product.is_online_available ? 'Click to remove from online store' : 'Click to list in online store') : undefined}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border transition-colors ${
                  product.is_online_available
                    ? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                    : 'bg-theme-tertiary text-theme-muted border-theme hover:bg-theme-secondary'
                } ${!canEdit ? 'cursor-default' : 'cursor-pointer'} disabled:opacity-60`}
              >
                {toggling
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Globe className="w-4 h-4" />
                }
                {product.is_online_available ? 'Online' : 'Not Online'}
              </button>

              {renderStockBadge()}
              {product.is_active === false && (
                <span className="px-3 py-1 rounded-full text-sm font-semibold bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  Inactive
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Main 3-col grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

          {/* Left – image gallery */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-theme-secondary rounded-xl shadow-theme-sm border border-theme overflow-hidden">
              <div className="aspect-square bg-theme-tertiary flex items-center justify-center">
                {getImage() ? (
                  <img src={getImage()} alt={product.product_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-theme-muted">
                    <Package className="w-24 h-24 mb-2" />
                    <span className="text-sm">No Image</span>
                  </div>
                )}
              </div>

              {/* Image thumbnails */}
              {allImages.length > 1 && (
                <div className="p-3 border-t border-theme">
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {allImages.map((img, idx) => (
                      <button
                        key={img.id || idx}
                        onClick={() => setSelectedImageIdx(idx)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                          idx === selectedImageIdx
                            ? 'border-accent-gold ring-1 ring-accent-gold/30'
                            : 'border-theme hover:border-accent-gold/40'
                        }`}
                      >
                        <img src={img.image_url} alt={img.alt_text || `Image ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                  {allImages[selectedImageIdx]?.color_name && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <div
                        className="w-3 h-3 rounded-full border border-theme"
                        style={{ backgroundColor: allImages[selectedImageIdx].color_code || '#ccc' }}
                      />
                      <span className="text-xs text-theme-muted">{allImages[selectedImageIdx].color_name}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Quick stats */}
              <div className="p-4 grid grid-cols-2 gap-3 border-t border-theme">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-theme-muted mb-1">
                    <Eye className="w-3 h-3" /><span className="text-xs">Views</span>
                  </div>
                  <p className="text-lg font-bold text-theme-primary">{product.view_count || 0}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-theme-muted mb-1">
                    <BarChart3 className="w-3 h-3" /><span className="text-xs">Sales</span>
                  </div>
                  <p className="text-lg font-bold text-theme-primary">{product.sale_count || 0}</p>
                </div>
              </div>
            </div>

            {/* Colors */}
            {product.colors && product.colors.length > 0 && (
              <div className="bg-theme-secondary rounded-xl shadow-theme-sm border border-theme overflow-hidden">
                <div className="px-4 py-3 bg-theme-tertiary border-b border-theme">
                  <h2 className="text-sm font-bold text-theme-primary flex items-center gap-2">
                    <Palette className="w-4 h-4 text-accent-gold" />
                    Colors ({product.colors.length})
                  </h2>
                </div>
                <div className="p-3 space-y-2">
                  {product.colors.map(color => (
                    <div key={color.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-theme-tertiary">
                      <div
                        className="w-6 h-6 rounded-full border-2 border-theme flex-shrink-0"
                        style={{ backgroundColor: color.color_code || '#ccc' }}
                        title={color.color_code}
                      />
                      <span className="text-sm font-medium text-theme-primary">{color.color_name}</span>
                      {color.is_active === false && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">Inactive</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right – detail cards */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">

            {/* Stock Information */}
            <div className={`rounded-xl shadow-theme-sm border overflow-hidden bg-theme-secondary ${
              isLowStock() ? 'border-red-400 dark:border-red-600' : 'border-theme'
            }`}>
              <div className="px-4 sm:px-6 py-3 sm:py-4 bg-theme-tertiary border-b border-theme">
                <h2 className="text-base sm:text-lg font-bold text-theme-primary flex items-center gap-2">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-accent-gold" />
                  Stock Information
                </h2>
              </div>
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-theme-tertiary rounded-lg p-3 text-center">
                    <p className="text-xs text-theme-muted mb-1">Current Stock</p>
                    <p className={`text-2xl font-bold ${isLowStock() ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                      {getStock()}
                    </p>
                    <p className="text-xs text-theme-muted">{product.unit_of_measure || 'units'}</p>
                  </div>
                  <div className="bg-theme-tertiary rounded-lg p-3 text-center">
                    <p className="text-xs text-theme-muted mb-1">Reorder Level</p>
                    <p className="text-2xl font-bold text-theme-primary">{getReorderLevel()}</p>
                    <p className="text-xs text-theme-muted">{product.unit_of_measure || 'units'}</p>
                  </div>
                  <div className="bg-theme-tertiary rounded-lg p-3 text-center">
                    <p className="text-xs text-theme-muted mb-1">Status</p>
                    <div className="mt-1">{renderStockBadge()}</div>
                  </div>
                </div>

                {/* Branch inventory breakdown */}
                {Array.isArray(product.branch_inventory) && product.branch_inventory.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-theme-secondary mb-2">Branch Inventory</h3>
                    <div className="space-y-2">
                      {product.branch_inventory.map((inv, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-theme-tertiary rounded-lg p-3">
                          <span className="text-sm font-medium text-theme-primary">{inv.branch_name}</span>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <span className="text-xs text-theme-muted mr-2">On Hand:</span>
                              <span className={`text-sm font-bold ${(inv.quantity || 0) <= getReorderLevel() ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                {inv.quantity || 0}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs text-theme-muted mr-2">Available:</span>
                              <span className="text-sm font-semibold text-theme-primary">{inv.quantity_available ?? inv.quantity ?? 0}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Color-based stock breakdown */}
                {product.has_colors && (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-theme-secondary mb-2">Stock by Color</h3>
                    <ColorStockManager
                      productId={product.id}
                      branchId={null}
                      onStockUpdate={() => { fetchProduct(); setRefreshKey(k => k + 1); }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Pricing */}
            <div className="rounded-xl shadow-theme-sm border border-theme overflow-hidden bg-theme-secondary">
              <div className="px-4 sm:px-6 py-3 sm:py-4 bg-theme-tertiary border-b border-theme">
                <h2 className="text-base sm:text-lg font-bold text-theme-primary flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-accent-gold" />
                  Pricing
                </h2>
              </div>
              <div className="p-4 sm:p-6">
                {hasVariantPricing ? (
                  <>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-theme-tertiary rounded-lg p-3 text-center">
                        <p className="text-xs text-theme-muted mb-1">{hasPriceRange ? 'Price Range' : 'Price'}</p>
                        <p className="text-lg font-bold text-accent-gold">
                          {hasPriceRange
                            ? `${formatCurrency(product.price_min)} – ${formatCurrency(product.price_max)}`
                            : formatCurrency(selectionPrices[0]?.price || effectivePrice)}
                        </p>
                      </div>
                      <div className="bg-theme-tertiary rounded-lg p-3 text-center">
                        <p className="text-xs text-theme-muted mb-1">Variants</p>
                        <p className="text-lg font-bold text-theme-primary">{selectionPrices.length}</p>
                      </div>
                    </div>
                    <div className="bg-theme-tertiary rounded-lg overflow-hidden">
                      <div className="grid grid-cols-4 gap-2 px-3 py-2 text-xs font-semibold text-theme-muted border-b border-theme">
                        <span>Category</span>
                        <span className="text-right">Price</span>
                        <span className="text-right">Cost</span>
                        <span className="text-right">Stock</span>
                      </div>
                      {selectionPrices.map((sp, idx) => {
                        const profit = sp.cost_price ? sp.price - sp.cost_price : null;
                        return (
                          <div key={idx} className="grid grid-cols-4 gap-2 px-3 py-2 text-sm border-b border-theme last:border-0">
                            <span className="text-theme-primary font-medium truncate">{sp.category_name}{sp.unit ? ` (${sp.unit})` : ''}</span>
                            <span className="text-right text-accent-gold font-bold">{formatCurrency(sp.price)}</span>
                            <span className="text-right text-theme-muted">{sp.cost_price ? formatCurrency(sp.cost_price) : '–'}</span>
                            <span className="text-right text-theme-primary">{sp.stock}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-theme-tertiary rounded-lg p-3 text-center">
                      <p className="text-xs text-theme-muted mb-1">Cost Price</p>
                      <p className="text-lg font-bold text-theme-primary">{formatCurrency(effectiveCost)}</p>
                    </div>
                    <div className="bg-theme-tertiary rounded-lg p-3 text-center">
                      <p className="text-xs text-theme-muted mb-1">Selling Price</p>
                      <p className="text-lg font-bold text-accent-gold">{formatCurrency(effectivePrice)}</p>
                    </div>
                    {profitPerUnit !== null && (
                      <div className="bg-theme-tertiary rounded-lg p-3 text-center">
                        <p className="text-xs text-theme-muted mb-1">Profit / Unit</p>
                        <p className={`text-lg font-bold ${profitPerUnit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {formatCurrency(profitPerUnit)}
                        </p>
                      </div>
                    )}
                    {profitMargin !== null && (
                      <div className="bg-theme-tertiary rounded-lg p-3 text-center">
                        <p className="text-xs text-theme-muted mb-1">Margin</p>
                        <p className={`text-lg font-bold ${parseFloat(profitMargin) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {profitMargin}%
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Categories & Classification */}
            {(product.brand_name || product.category_name || product.sub_category_name || product.unit_of_measure || product.product_type) && (
              <div className="rounded-xl shadow-theme-sm border border-theme overflow-hidden bg-theme-secondary">
                <div className="px-4 sm:px-6 py-3 sm:py-4 bg-theme-tertiary border-b border-theme">
                  <h2 className="text-base sm:text-lg font-bold text-theme-primary">Categories &amp; Classification</h2>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                    {product.category_name && (
                      <div>
                        <p className="text-xs font-medium text-theme-muted uppercase tracking-wide mb-1">Category</p>
                        <p className="text-sm font-semibold text-theme-primary">{product.category_name}</p>
                      </div>
                    )}
                    {product.sub_category_name && (
                      <div>
                        <p className="text-xs font-medium text-theme-muted uppercase tracking-wide mb-1">Sub-Category</p>
                        <p className="text-sm font-semibold text-theme-primary">{product.sub_category_name}</p>
                      </div>
                    )}
                    {product.brand_name && (
                      <div>
                        <p className="text-xs font-medium text-theme-muted uppercase tracking-wide mb-1">Brand</p>
                        <p className="text-sm font-semibold text-theme-primary">{product.brand_name}</p>
                      </div>
                    )}
                    {product.unit_of_measure && (
                      <div>
                        <p className="text-xs font-medium text-theme-muted uppercase tracking-wide mb-1">Unit of Measure</p>
                        <p className="text-sm font-semibold text-theme-primary">{product.unit_of_measure}</p>
                      </div>
                    )}
                    {product.product_type && (
                      <div>
                        <p className="text-xs font-medium text-theme-muted uppercase tracking-wide mb-1">Product Type</p>
                        <p className="text-sm font-semibold text-theme-primary capitalize">{product.product_type}</p>
                      </div>
                    )}
                    {product.supplier_name && (
                      <div>
                        <p className="text-xs font-medium text-theme-muted uppercase tracking-wide mb-1">Supplier</p>
                        <p className="text-sm font-semibold text-theme-primary">{product.supplier_name}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div className="rounded-xl shadow-theme-sm border border-theme overflow-hidden bg-theme-secondary">
                <div className="px-4 sm:px-6 py-3 sm:py-4 bg-theme-tertiary border-b border-theme">
                  <h2 className="text-base sm:text-lg font-bold text-theme-primary">Description</h2>
                </div>
                <div className="p-4 sm:p-6">
                  <p className="text-sm text-theme-secondary leading-relaxed whitespace-pre-wrap">{product.description}</p>
                </div>
              </div>
            )}

            {/* Additional Details */}
            <div className="rounded-xl shadow-theme-sm border border-theme overflow-hidden bg-theme-secondary">
              <div className="px-4 sm:px-6 py-3 sm:py-4 bg-theme-tertiary border-b border-theme">
                <h2 className="text-base sm:text-lg font-bold text-theme-primary">Additional Details</h2>
              </div>
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                  <div>
                    <p className="text-xs font-medium text-theme-muted uppercase tracking-wide mb-1">SKU</p>
                    <p className="text-sm font-semibold text-theme-primary">{product.sku || product.product_code || '—'}</p>
                  </div>
                  {product.slug && (
                    <div>
                      <p className="text-xs font-medium text-theme-muted uppercase tracking-wide mb-1">Store URL Slug</p>
                      <p className="text-sm font-mono text-theme-secondary truncate" title={product.slug}>{product.slug}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-medium text-theme-muted uppercase tracking-wide mb-1">Barcode</p>
                    <p className="text-sm font-semibold text-theme-primary">{product.barcode || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-theme-muted uppercase tracking-wide mb-1">Weight</p>
                    <p className="text-sm font-semibold text-theme-primary">{product.weight ? `${product.weight} kg` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-theme-muted uppercase tracking-wide mb-1">Active</p>
                    <p className={`text-sm font-semibold ${product.is_active !== false ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {product.is_active !== false ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-theme-muted uppercase tracking-wide mb-1">Featured</p>
                    <p className={`text-sm font-semibold ${product.is_featured ? 'text-yellow-600 dark:text-yellow-400' : 'text-theme-secondary'}`}>
                      {product.is_featured ? 'Yes' : 'No'}
                    </p>
                  </div>
                  {product.created_at && (
                    <div>
                      <p className="text-xs font-medium text-theme-muted uppercase tracking-wide mb-1">Created</p>
                      <p className="text-sm font-semibold text-theme-primary">{new Date(product.created_at).toLocaleDateString()}</p>
                    </div>
                  )}
                  {product.updated_at && (
                    <div>
                      <p className="text-xs font-medium text-theme-muted uppercase tracking-wide mb-1">Last Updated</p>
                      <p className="text-sm font-semibold text-theme-primary">{new Date(product.updated_at).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Category Assignments — Selection Attributes with Stock & Prices */}
            {product.category_assignments && product.category_assignments.length > 0 && (
              <div className="rounded-xl shadow-theme-sm border border-theme overflow-hidden bg-theme-secondary">
                <div className="px-4 sm:px-6 py-3 sm:py-4 bg-theme-tertiary border-b border-theme">
                  <h2 className="text-base sm:text-lg font-bold text-theme-primary flex items-center gap-2">
                    <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-accent-gold" />
                    Selection Attributes &amp; Stock Allocation
                  </h2>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="border border-theme rounded-lg overflow-hidden">
                    <div className="bg-theme-tertiary px-4 py-2.5 grid grid-cols-12 gap-2 text-xs font-semibold text-theme-muted uppercase">
                      <div className="col-span-4">Attribute</div>
                      <div className="col-span-2 text-right">Stock</div>
                      <div className="col-span-2 text-right">Sell Price</div>
                      <div className="col-span-2 text-right">Cost Price</div>
                      <div className="col-span-2 text-center">Image</div>
                    </div>
                    <div className="divide-y divide-theme max-h-96 overflow-y-auto">
                      {(() => {
                        // Build tree from category assignments using parent_category_id
                        const assignments = product.category_assignments;
                        const catIdSet = new Set(assignments.map(a => a.category_id));
                        const childrenMap = {};
                        const roots = [];
                        for (const a of assignments) {
                          if (a.parent_category_id && catIdSet.has(a.parent_category_id)) {
                            (childrenMap[a.parent_category_id] ||= []).push(a);
                          } else {
                            roots.push(a);
                          }
                        }
                        // DFS walk to produce ordered flat list with depth
                        const ordered = [];
                        const walk = (nodes, depth) => {
                          for (const n of nodes) {
                            ordered.push({ ...n, _depth: depth });
                            if (childrenMap[n.category_id]) {
                              walk(childrenMap[n.category_id], depth + 1);
                            }
                          }
                        };
                        walk(roots, 0);

                        return ordered.map((a) => (
                          <div key={a.id || a.category_id} className={`px-4 py-2.5 grid grid-cols-12 gap-2 text-sm hover:bg-theme-tertiary transition-colors items-center ${a._depth === 0 ? 'bg-theme-tertiary/50' : ''}`}>
                            <div className="col-span-4 flex items-center gap-2" style={{ paddingLeft: `${a._depth * 20}px` }}>
                              {a._depth > 0 && <span className="text-theme-muted text-xs">└</span>}
                              <Tag className="w-3 h-3 text-theme-muted flex-shrink-0" />
                              <span className={`font-medium text-theme-primary truncate ${a._depth === 0 ? 'font-bold' : a.is_leaf ? '' : 'font-semibold'}`}>
                                {a.category_name}
                              </span>
                              {a._depth === 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300 flex-shrink-0">Root</span>
                              )}
                              {a.is_listing_category && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex-shrink-0">Listing</span>
                              )}
                              {a.is_selection_attribute && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 flex-shrink-0">Selection</span>
                              )}
                            </div>
                            <div className="col-span-2 text-right">
                              {a.is_leaf ? (
                                <>
                                  <span className={`font-bold ${(a.stock_allocated || 0) > 0 ? 'text-green-600 dark:text-green-400' : 'text-theme-muted'}`}>
                                    {a.stock_allocated || 0}
                                  </span>
                                  {a.unit_of_measure && <span className="text-xs text-theme-muted ml-1">{a.unit_of_measure}</span>}
                                </>
                              ) : (
                                <span className="text-theme-muted text-xs">—</span>
                              )}
                            </div>
                            <div className="col-span-2 text-right font-medium text-accent-gold">
                              {a.price_override ? formatCurrency(a.price_override) : '—'}
                            </div>
                            <div className="col-span-2 text-right font-medium text-theme-secondary">
                              {a.cost_price_override ? formatCurrency(a.cost_price_override) : '—'}
                            </div>
                            <div className="col-span-2 flex justify-center">
                              {a.image_url ? (
                                <img src={a.image_url} alt={a.category_name} className="w-8 h-8 rounded border border-theme object-cover" />
                              ) : (
                                <span className="text-theme-muted text-xs">—</span>
                              )}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Stock Activity History (full width) ── */}
        <StockActivityHistory productId={id} refreshKey={refreshKey} />

      </div>

      {/* ── Stock modals ── */}
      {stockModal && (
        <StockModal
          product={product}
          mode={stockModal}
          branches={branches}
          onClose={() => setStockModal(null)}
          onSuccess={() => { fetchProduct(); setRefreshKey(k => k + 1); }}
        />
      )}
    </>
  );
};

export default ProductDetailPage;
