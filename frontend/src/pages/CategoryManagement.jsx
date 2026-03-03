import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Tag, Briefcase, RefreshCw, AlertCircle } from 'lucide-react';
import api from '../api/axios';

const inputClass =
  'w-full px-3 py-2.5 bg-theme-primary border border-theme rounded-lg text-sm text-theme-primary placeholder-theme-muted focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all';
const labelClass = 'block text-sm font-medium text-theme-secondary mb-1';

// ── helpers ────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'brands',     label: 'Brands',     icon: Briefcase, nameField: 'brand_name',    singular: 'Brand'    },
  { key: 'categories', label: 'Categories', icon: Tag,        nameField: 'category_name', singular: 'Category' },
];

// ── main page ──────────────────────────────────────────────────────────────────
const CategoryManagement = () => {
  const [activeTab, setActiveTab] = useState('brands');
  const [data, setData]           = useState({ brands: [], categories: [] });
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  // modal
  const [showModal, setShowModal]   = useState(false);
  const [editItem, setEditItem]     = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // delete confirm
  const [deleteItem, setDeleteItem]   = useState(null);
  const [deleting, setDeleting]       = useState(false);

  const tab = TABS.find(t => t.key === activeTab);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [brandsRes, catsRes] = await Promise.all([
        api.get('/products/brands'),
        api.get('/products/categories'),
      ]);
      setData({
        brands:     Array.isArray(brandsRes.data)  ? brandsRes.data  : [],
        categories: Array.isArray(catsRes.data)    ? catsRes.data    : [],
      });
    } catch {
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => { setEditItem(null); setShowModal(true); };
  const handleOpenEdit = (item) => { setEditItem(item); setShowModal(true); };
  const handleCloseModal = () => { setShowModal(false); setEditItem(null); };

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    try {
      if (editItem) {
        await api.put(`/products/${activeTab}/${editItem.id}`, formData);
      } else {
        await api.post(`/products/${activeTab}`, formData);
      }
      handleCloseModal();
      fetchAll();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save. Please try again.';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      await api.delete(`/products/${activeTab}/${deleteItem.id}`);
      setDeleteItem(null);
      fetchAll();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete.';
      alert(msg);
    } finally {
      setDeleting(false);
    }
  };

  const rows = data[activeTab] || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-theme-primary">Category Management</h1>
          <p className="text-sm text-theme-muted mt-0.5">Manage product brands and categories</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-accent-gold text-white rounded-lg text-sm font-semibold hover:bg-yellow-600 transition-colors shadow-sm"
        >
          <Plus size={15} />
          Add {tab.singular}
        </button>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 p-1 bg-theme-tertiary/50 rounded-lg border border-theme w-fit">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === t.key
                ? 'bg-theme-secondary text-accent-gold shadow-sm'
                : 'text-theme-muted hover:text-theme-primary'
            }`}
          >
            <t.icon size={14} className={activeTab === t.key ? 'text-accent-gold' : 'opacity-50'} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-theme-secondary border border-theme rounded-xl shadow-theme-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-theme-muted">
            <RefreshCw size={18} className="animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20 gap-3 text-red-500">
            <AlertCircle size={18} />
            <span className="text-sm">{error}</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-theme-muted">
            <tab.icon size={40} className="opacity-20" />
            <div className="text-center">
              <p className="text-sm font-medium text-theme-primary">No {tab.label.toLowerCase()} yet</p>
              <p className="text-xs mt-1">Click "Add {tab.singular}" to create the first one.</p>
            </div>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2 bg-accent-gold text-white rounded-lg text-sm font-semibold hover:bg-yellow-600 transition-colors"
            >
              <Plus size={14} /> Add {tab.singular}
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-theme bg-theme-tertiary/30">
                <th className="px-4 py-3 text-left text-xs font-semibold text-theme-muted uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-theme-muted uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-theme-muted uppercase tracking-wider">Products</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-theme-muted uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-theme-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme">
              {rows.map(row => (
                <tr key={row.id} className="hover:bg-theme-tertiary/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-theme-primary">
                    {row[tab.nameField]}
                  </td>
                  <td className="px-4 py-3 text-theme-muted max-w-xs truncate">
                    {row.description || <span className="italic opacity-40">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent-gold/10 text-accent-gold">
                      {row.product_count ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      row.is_active
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-theme-tertiary text-theme-muted'
                    }`}>
                      {row.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenEdit(row)}
                        className="p-1.5 text-theme-muted hover:text-accent-gold hover:bg-accent-gold/10 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteItem(row)}
                        className="p-1.5 text-theme-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <CategoryFormModal
          tab={tab}
          item={editItem}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}

      {/* Delete Confirm */}
      {deleteItem && (
        <DeleteConfirmDialog
          item={deleteItem}
          tab={tab}
          onClose={() => setDeleteItem(null)}
          onConfirm={handleDelete}
          deleting={deleting}
        />
      )}
    </div>
  );
};

// ── form modal ─────────────────────────────────────────────────────────────────
const CategoryFormModal = ({ tab, item, onClose, onSubmit, submitting }) => {
  const isEdit = !!item;
  const [formData, setFormData] = useState({
    [tab.nameField]: item?.[tab.nameField] || '',
    description: item?.description || '',
    is_active: item?.is_active !== false,
  });
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData[tab.nameField].trim()) {
      setError(`${tab.singular} name is required`);
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-theme-secondary rounded-xl border border-theme shadow-theme-xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme">
          <h2 className="text-base font-semibold text-theme-primary">
            {isEdit ? `Edit ${tab.singular}` : `Add ${tab.singular}`}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-theme-muted hover:text-theme-primary hover:bg-theme-tertiary rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={labelClass}>
              {tab.singular} Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData[tab.nameField]}
              onChange={e => { setFormData(p => ({ ...p, [tab.nameField]: e.target.value })); setError(''); }}
              placeholder={`Enter ${tab.singular.toLowerCase()} name`}
              className={`${inputClass} ${error ? 'border-red-500/60' : ''}`}
              autoFocus
            />
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
              rows={3}
              placeholder="Optional description"
              className={`${inputClass} resize-none`}
            />
          </div>

          <button
            type="button"
            onClick={() => setFormData(p => ({ ...p, is_active: !p.is_active }))}
            className={`flex items-center justify-between w-full p-3 rounded-lg border transition-all ${
              formData.is_active
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-theme-primary border-theme'
            }`}
          >
            <span className={`text-sm font-medium ${formData.is_active ? 'text-emerald-500' : 'text-theme-muted'}`}>
              Active
            </span>
            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
              formData.is_active ? 'bg-emerald-500 border-emerald-500' : 'border-theme bg-theme-primary'
            }`}>
              {formData.is_active && <span className="text-white text-[10px] font-bold">✓</span>}
            </div>
          </button>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-theme-secondary bg-theme-primary hover:bg-theme-tertiary border border-theme rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2 text-sm font-semibold bg-accent-gold text-white rounded-lg hover:bg-yellow-600 transition-colors shadow-sm disabled:opacity-60"
            >
              {submitting && <RefreshCw size={13} className="animate-spin" />}
              {isEdit ? 'Save Changes' : `Add ${tab.singular}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── delete confirm ─────────────────────────────────────────────────────────────
const DeleteConfirmDialog = ({ item, tab, onClose, onConfirm, deleting }) => (
  <div className="fixed inset-0 z-60 flex items-center justify-center p-4" onClick={onClose}>
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
    <div
      className="relative bg-theme-secondary rounded-xl border border-theme shadow-theme-xl w-full max-w-sm p-6 space-y-4"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
          <Trash2 size={16} className="text-red-500" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-theme-primary">Delete {tab.singular}</h3>
          <p className="text-sm text-theme-muted mt-1">
            Are you sure you want to delete <span className="font-medium text-theme-primary">{item[tab.nameField]}</span>?
            {(item.product_count > 0) && (
              <span className="block mt-1 text-amber-500 text-xs">
                This {tab.singular.toLowerCase()} has {item.product_count} product{item.product_count !== 1 ? 's' : ''} assigned to it.
              </span>
            )}
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          disabled={deleting}
          className="px-4 py-2 text-sm font-medium text-theme-secondary bg-theme-primary hover:bg-theme-tertiary border border-theme rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={deleting}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-60"
        >
          {deleting && <RefreshCw size={13} className="animate-spin" />}
          Delete
        </button>
      </div>
    </div>
  </div>
);

export default CategoryManagement;
