import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Filter, FileText, Clock, CheckCircle, Truck,
  Search, X, RefreshCw, User, Calendar,
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { branchesAPI } from '../api/branches';
import { useCurrency } from '../context/CurrencyContext';
import Modal from '../components/ui/Modal';
import PageHeader from '../components/common/PageHeader';
import PurchaseOrderCard from '../components/purchase-order/PurchaseOrderCard';
import PurchaseOrderFormModal from '../components/purchase-order/PurchaseOrderFormModal';
import GRNFormModal from '../components/purchase-order/GRNFormModal';

const STATUS_TABS = [
  { key: 'all',                label: 'All' },
  { key: 'draft',              label: 'Draft' },
  { key: 'confirmed',          label: 'Confirmed' },
  { key: 'partially_received', label: 'Partial' },
  { key: 'received',           label: 'Received' },
  { key: 'cancelled',          label: 'Cancelled' },
];

const PurchaseOrders = () => {
  const { formatCurrency } = useCurrency();

  // Data
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers,      setSuppliers]      = useState([]);
  const [branches,       setBranches]       = useState([]);
  const [stats,          setStats]          = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [submitLoading,  setSubmitLoading]  = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab,   setActiveTab]   = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filters,     setFilters]     = useState({ supplier_id: '', branch_id: '', date_from: '', date_to: '' });

  // Modals
  const [showPOForm,    setShowPOForm]    = useState(false);
  const [selectedPO,    setSelectedPO]    = useState(null);
  const [showGRNForm,   setShowGRNForm]   = useState(false);
  const [grnPO,         setGrnPO]         = useState(null);
  const [viewPO,        setViewPO]        = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCancel,    setShowCancel]    = useState(false);
  const [cancelPO,      setCancelPO]      = useState(null);
  const [cancelReason,  setCancelReason]  = useState('');

  // ─── Load reference data once ───────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      api.get('/suppliers').then(r => setSuppliers(r.data || [])).catch(() => {}),
      branchesAPI.getBranches().then(setBranches).catch(() => {}),
    ]);
  }, []);

  // ─── Load POs ───────────────────────────────────────────────────────────────
  const fetchPOs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (activeTab !== 'all')  params.status      = activeTab;
      if (filters.supplier_id)  params.supplier_id = filters.supplier_id;
      if (filters.branch_id)    params.branch_id   = filters.branch_id;
      if (filters.date_from)    params.from_date   = filters.date_from;
      if (filters.date_to)      params.to_date     = filters.date_to;

      const [posRes, statsRes] = await Promise.all([
        api.get('/purchase-orders', { params }),
        api.get('/purchase-orders/statistics'),
      ]);

      setPurchaseOrders(posRes.data?.purchase_orders || []);
      setStats(statsRes.data || null);
    } catch {
      toast.error('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  }, [activeTab, filters]);

  useEffect(() => { fetchPOs(); }, [fetchPOs]);

  // ─── Client-side search ─────────────────────────────────────────────────────
  const filtered = purchaseOrders.filter(po => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      po.po_number?.toLowerCase().includes(q) ||
      po.supplier_name?.toLowerCase().includes(q) ||
      po.branch_name?.toLowerCase().includes(q)
    );
  });

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleCreate = async (data) => {
    setSubmitLoading(true);
    try {
      await api.post('/purchase-orders', data);
      toast.success('Purchase order created');
      setShowPOForm(false);
      setSelectedPO(null);
      fetchPOs();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create purchase order');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdate = async (data) => {
    setSubmitLoading(true);
    try {
      await api.put(`/purchase-orders/${selectedPO.id}`, data);
      toast.success('Purchase order updated');
      setShowPOForm(false);
      setSelectedPO(null);
      fetchPOs();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update purchase order');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleApprove = async (po) => {
    try {
      await api.post(`/purchase-orders/${po.id}/approve`);
      toast.success(`${po.po_number} confirmed`);
      fetchPOs();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to confirm purchase order');
    }
  };

  const handleCancelSubmit = async () => {
    if (!cancelPO) return;
    try {
      await api.post(`/purchase-orders/${cancelPO.id}/cancel`, { cancellation_reason: cancelReason });
      toast.success(`${cancelPO.po_number} cancelled`);
      setShowCancel(false);
      setCancelPO(null);
      setCancelReason('');
      fetchPOs();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to cancel purchase order');
    }
  };

  const handleReceive = async (grnData) => {
    setSubmitLoading(true);
    try {
      await api.post(`/purchase-orders/${grnPO.id}/receive`, grnData);
      toast.success('Goods received successfully');
      setShowGRNForm(false);
      setGrnPO(null);
      fetchPOs();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to record GRN');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleViewPO = async (po) => {
    try {
      const res = await api.get(`/purchase-orders/${po.id}`);
      setViewPO(res.data);
      setShowViewModal(true);
    } catch {
      toast.error('Failed to load purchase order details');
    }
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const tabCounts = STATUS_TABS.reduce((acc, t) => {
    acc[t.key] = t.key === 'all'
      ? purchaseOrders.length
      : purchaseOrders.filter(p => p.status === t.key).length;
    return acc;
  }, {});

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Purchase Orders"
        subtitle="Manage supplier orders and track deliveries"
        icon={FileText}
        badge={stats ? `${stats.total_pos} total` : null}
        actions={
          <>
            <button
              onClick={fetchPOs}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-theme-secondary bg-theme-secondary border border-theme rounded-lg hover:bg-theme-tertiary transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => { setSelectedPO(null); setShowPOForm(true); }}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-accent-gold rounded-lg hover:bg-accent-goldDark transition-colors"
            >
              <Plus className="w-4 h-4" /> Create PO
            </button>
          </>
        }
      />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: 'Total POs',        value: stats.total_pos,     icon: FileText,    color: 'text-accent-gold', bg: 'bg-accent-gold/10' },
            { label: 'Draft',            value: stats.draft_pos,     icon: Clock,       color: 'text-theme-muted', bg: 'bg-theme-tertiary' },
            { label: 'Confirmed',        value: stats.confirmed_pos, icon: CheckCircle, color: 'text-blue-500',    bg: 'bg-blue-500/10'    },
            { label: 'Pending Delivery',
              value: Number(stats.partially_received_pos || 0) + Number(stats.confirmed_pos || 0),
              icon: Truck, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-theme-secondary border border-theme rounded-xl p-3 sm:p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-xl font-bold text-theme-primary leading-tight">{value}</p>
                <p className="text-[10px] sm:text-xs text-theme-muted">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-theme-secondary border border-theme rounded-xl p-3 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search by PO number, supplier..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-theme-primary border border-theme text-theme-primary text-sm rounded-lg placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-primary">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
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
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-accent-gold text-white rounded-full">{activeFilterCount}</span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="pt-3 border-t border-theme space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { key: 'supplier_id', label: 'Supplier', opts: suppliers, optKey: 'supplier_name', placeholder: 'All Suppliers' },
                { key: 'branch_id',   label: 'Branch',   opts: branches,  optKey: 'branch_name',   placeholder: 'All Branches'  },
              ].map(({ key, label, opts, optKey, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-theme-muted mb-1">{label}</label>
                  <select value={filters[key]} onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-3 py-2 bg-theme-primary border border-theme text-theme-primary text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-gold/20 transition-all">
                    <option value="">{placeholder}</option>
                    {opts.map(o => <option key={o.id} value={o.id}>{o[optKey]}</option>)}
                  </select>
                </div>
              ))}
              {[
                { key: 'date_from', label: 'From Date' },
                { key: 'date_to',   label: 'To Date'   },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-theme-muted mb-1">{label}</label>
                  <input type="date" value={filters[key]} onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-3 py-2 bg-theme-primary border border-theme text-theme-primary text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-gold/20 transition-all" />
                </div>
              ))}
            </div>
            {activeFilterCount > 0 && (
              <button onClick={() => setFilters({ supplier_id: '', branch_id: '', date_from: '', date_to: '' })}
                className="text-xs text-theme-muted hover:text-red-500 transition-colors flex items-center gap-1">
                <X className="w-3.5 h-3.5" /> Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Status tabs */}
        <div className="flex items-center gap-1 flex-wrap">
          {STATUS_TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === key ? 'bg-accent-gold text-white' : 'text-theme-muted hover:text-theme-primary hover:bg-theme-tertiary'
              }`}
            >
              {label}
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === key ? 'bg-white/20' : 'bg-theme-tertiary'}`}>
                {tabCounts[key] ?? 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-theme border-t-accent-gold rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-theme-secondary border border-theme rounded-xl p-12 text-center">
          <FileText className="w-12 h-12 text-theme-muted mx-auto mb-3 opacity-40" />
          <p className="text-theme-primary font-medium">No purchase orders found</p>
          <p className="text-theme-muted text-sm mt-1">
            {searchQuery || activeFilterCount > 0 ? 'Try adjusting your search or filters' : 'Create your first purchase order to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(po => (
            <PurchaseOrderCard
              key={po.id}
              purchaseOrder={po}
              formatCurrency={formatCurrency}
              onView={handleViewPO}
              onEdit={p => { setSelectedPO(p); setShowPOForm(true); }}
              onApprove={handleApprove}
              onReceive={p => { setGrnPO(p); setShowGRNForm(true); }}
              onCancel={p => { setCancelPO(p); setCancelReason(''); setShowCancel(true); }}
            />
          ))}
        </div>
      )}

      {/* Create / Edit PO */}
      <PurchaseOrderFormModal
        isOpen={showPOForm}
        onClose={() => { setShowPOForm(false); setSelectedPO(null); }}
        onSubmit={selectedPO ? handleUpdate : handleCreate}
        purchaseOrder={selectedPO}
        suppliers={suppliers}
        branches={branches}
        loading={submitLoading}
      />

      {/* GRN */}
      <GRNFormModal
        isOpen={showGRNForm}
        onClose={() => { setShowGRNForm(false); setGrnPO(null); }}
        onSubmit={handleReceive}
        purchaseOrder={grnPO}
        loading={submitLoading}
      />

      {/* View PO Detail */}
      {viewPO && (
        <Modal
          isOpen={showViewModal}
          onClose={() => { setShowViewModal(false); setViewPO(null); }}
          title={viewPO.po_number}
          subtitle={`${viewPO.supplier_name} → ${viewPO.branch_name}`}
          size="xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { icon: User,     label: 'Created By',    val: viewPO.created_by_name || '—' },
                { icon: Calendar, label: 'PO Date',       val: viewPO.po_date ? new Date(viewPO.po_date).toLocaleDateString() : '—' },
                { icon: Truck,    label: 'Exp. Delivery', val: viewPO.expected_delivery_date ? new Date(viewPO.expected_delivery_date).toLocaleDateString() : '—' },
              ].map(({ icon: Icon, label, val }) => (
                <div key={label} className="bg-theme-tertiary border border-theme rounded-lg p-2.5">
                  <div className="flex items-center gap-1.5 text-xs text-theme-muted mb-1">
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </div>
                  <p className="text-sm font-medium text-theme-primary">{val}</p>
                </div>
              ))}
            </div>

            {viewPO.items?.length > 0 && (
              <div className="border border-theme rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-theme-tertiary border-b border-theme">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-theme-muted uppercase">Product</th>
                      <th className="px-4 py-2.5 text-center text-xs font-medium text-theme-muted uppercase">Ordered</th>
                      <th className="px-4 py-2.5 text-center text-xs font-medium text-theme-muted uppercase">Received</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-theme-muted uppercase">Unit Price</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-theme-muted uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme">
                    {viewPO.items.map((item, i) => (
                      <tr key={i} className="hover:bg-theme-tertiary/50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-theme-primary">{item.product_name}</p>
                          {item.variant_name && <p className="text-xs text-theme-muted">{item.variant_name}</p>}
                        </td>
                        <td className="px-4 py-3 text-center text-theme-primary">{item.quantity_ordered}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-medium ${(item.quantity_received || 0) >= item.quantity_ordered ? 'text-green-500' : 'text-yellow-500'}`}>
                            {item.quantity_received || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-theme-secondary">{formatCurrency(item.unit_price)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-theme-primary">{formatCurrency(item.line_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-theme-tertiary border-t-2 border-theme">
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-right font-semibold text-theme-secondary">Total Amount</td>
                      <td className="px-4 py-3 text-right font-bold text-accent-gold text-lg">{formatCurrency(viewPO.total_amount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {viewPO.notes && (
              <div className="p-3 bg-theme-tertiary border border-theme rounded-lg text-sm text-theme-secondary">
                <span className="font-medium text-theme-muted text-xs uppercase">Notes: </span>{viewPO.notes}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Cancel Confirmation */}
      <Modal
        isOpen={showCancel}
        onClose={() => { setShowCancel(false); setCancelPO(null); setCancelReason(''); }}
        title="Cancel Purchase Order"
        subtitle={cancelPO?.po_number}
        size="sm"
        footer={
          <div className="flex items-center gap-3">
            <button onClick={() => setShowCancel(false)}
              className="px-4 py-2 text-sm font-medium text-theme-secondary bg-theme-primary border border-theme rounded-lg hover:bg-theme-tertiary transition-colors">
              Keep PO
            </button>
            <button onClick={handleCancelSubmit}
              className="px-5 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">
              Cancel PO
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-theme-secondary">
            This will cancel <span className="font-semibold text-theme-primary">{cancelPO?.po_number}</span>. This action cannot be undone.
          </p>
          <div>
            <label className="block text-xs font-medium text-theme-muted mb-1">Reason (optional)</label>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              rows={2}
              placeholder="Enter cancellation reason..."
              className="w-full px-3 py-2 bg-theme-primary border border-theme text-theme-primary text-sm rounded-lg placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-accent-gold/20 transition-all resize-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PurchaseOrders;
