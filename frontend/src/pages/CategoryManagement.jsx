import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Edit, Trash2, Tag, Briefcase, RefreshCw, AlertCircle,
  ChevronRight, ChevronDown, FolderTree, Layers, Settings2,
  Ruler, Package, X,
} from 'lucide-react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import CategoryDetailPage from './CategoryDetailPage';

const inputClass =
  'w-full px-3 py-2.5 bg-theme-primary border border-theme rounded-lg text-sm text-theme-primary placeholder-theme-muted focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all';
const labelClass = 'block text-sm font-medium text-theme-secondary mb-1';

// ── Tab config ──────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'brands',     label: 'Brands',     icon: Briefcase, nameField: 'brand_name',    singular: 'Brand'    },
  { key: 'categories', label: 'Categories', icon: FolderTree, nameField: 'category_name', singular: 'Category' },
];

// ── Main Page ───────────────────────────────────────────────────────────────────
const CategoryManagement = () => {
  const [activeTab, setActiveTab] = useState('categories');
  const [brands, setBrands] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [parentCategory, setParentCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete state
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Category detail modal
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const tab = TABS.find(t => t.key === activeTab);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [brandsRes, treeRes] = await Promise.all([
        api.get('/products/brands'),
        api.get('/categories/tree'),
      ]);
      setBrands(Array.isArray(brandsRes.data) ? brandsRes.data : []);
      setCategoryTree(Array.isArray(treeRes.data) ? treeRes.data : []);
    } catch {
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Brand CRUD (kept as before) ──
  const handleBrandSubmit = async (formData) => {
    setSubmitting(true);
    try {
      if (editItem) {
        await api.put(`/products/brands/${editItem.id}`, formData);
      } else {
        await api.post('/products/brands', formData);
      }
      setShowModal(false);
      setEditItem(null);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save brand.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Category CRUD ──
  const handleCategorySubmit = async (formData) => {
    setSubmitting(true);
    try {
      if (editItem) {
        await api.put(`/categories/${editItem.id}`, formData);
        toast.success('Category updated');
      } else {
        await api.post('/categories', formData);
        toast.success('Category created');
      }
      setShowModal(false);
      setEditItem(null);
      setParentCategory(null);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      if (activeTab === 'brands') {
        await api.delete(`/products/brands/${deleteItem.id}`);
      } else {
        await api.delete(`/categories/${deleteItem.id}`);
      }
      setDeleteItem(null);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete.');
    } finally {
      setDeleting(false);
    }
  };


  const handleOpenAddRoot = () => {
    setEditItem(null);
    setParentCategory(null);
    setShowModal(true);
  };
  const handleOpenAddChild = (parent) => {
    setEditItem(null);
    setParentCategory(parent);
    setShowModal(true);
  };
  const handleOpenEdit = (item) => {
    setEditItem(item);
    setParentCategory(null);
    setShowModal(true);
  };


  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-theme-primary">Category Management</h1>
          <p className="text-sm text-theme-muted mt-0.5">Manage product brands and hierarchical categories</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={activeTab === 'brands' ? () => { setEditItem(null); setShowModal(true); } : handleOpenAddRoot}
            className="flex items-center gap-2 px-4 py-2 bg-accent-gold text-white rounded-lg text-sm font-semibold hover:bg-yellow-600 transition-colors shadow-sm"
          >
            <Plus size={15} />
            Add {tab.singular}
          </button>
        </div>
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
            <RefreshCw size={18} className="animate-spin" /> <span className="text-sm">Loading…</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20 gap-3 text-red-500">
            <AlertCircle size={18} /> <span className="text-sm">{error}</span>
          </div>
        ) : activeTab === 'brands' ? (
          <BrandsTable
            brands={brands}
            onEdit={handleOpenEdit}
            onDelete={setDeleteItem}
          />
        ) : (
          <CategoryTreeView
            tree={categoryTree}
            onEdit={handleOpenEdit}
            onDelete={setDeleteItem}
            onAddChild={handleOpenAddChild}
            onAddRoot={handleOpenAddRoot}
            onViewDetails={setSelectedCategoryId}
          />
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        activeTab === 'brands' ? (
          <BrandFormModal
            item={editItem}
            onClose={() => { setShowModal(false); setEditItem(null); }}
            onSubmit={handleBrandSubmit}
            submitting={submitting}
          />
        ) : (
          <CategoryFormModal
            item={editItem}
            parentCategory={parentCategory}
            onClose={() => { setShowModal(false); setEditItem(null); setParentCategory(null); }}
            onSubmit={handleCategorySubmit}
            submitting={submitting}
          />
        )
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


      {/* Category Detail Modal */}
      {selectedCategoryId && (
        <CategoryDetailPage
          categoryId={selectedCategoryId}
          onClose={() => setSelectedCategoryId(null)}
          onUpdate={fetchAll}
        />
      )}
    </div>
  );
};

// ── Brands Table (unchanged from old design) ───────────────────────────────────
const BrandsTable = ({ brands, onEdit, onDelete }) => {
  if (brands.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-theme-muted">
      <Briefcase size={40} className="opacity-20" />
      <p className="text-sm font-medium text-theme-primary">No brands yet</p>
    </div>
  );
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-theme bg-theme-tertiary/30">
          <th className="px-4 py-3 text-left text-xs font-semibold text-theme-muted uppercase">Name</th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-theme-muted uppercase">Description</th>
          <th className="px-4 py-3 text-center text-xs font-semibold text-theme-muted uppercase">Status</th>
          <th className="px-4 py-3 text-right text-xs font-semibold text-theme-muted uppercase">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-theme">
        {brands.map(b => (
          <tr key={b.id} className="hover:bg-theme-tertiary/20 transition-colors">
            <td className="px-4 py-3 font-medium text-theme-primary">{b.brand_name}</td>
            <td className="px-4 py-3 text-theme-muted max-w-xs truncate">{b.description || <span className="italic opacity-40">—</span>}</td>
            <td className="px-4 py-3 text-center">
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${b.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-theme-tertiary text-theme-muted'}`}>
                {b.is_active ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td className="px-4 py-3 text-right">
              <div className="flex items-center justify-end gap-1">
                <button onClick={() => onEdit(b)} className="p-1.5 text-theme-muted hover:text-accent-gold hover:bg-accent-gold/10 rounded-lg transition-colors" title="Edit">
                  <Edit size={14} />
                </button>
                <button onClick={() => onDelete(b)} className="p-1.5 text-theme-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// ── Category Tree View ──────────────────────────────────────────────────────────
const CategoryTreeView = ({ tree, onEdit, onDelete, onAddChild, onAddRoot, onViewDetails }) => {
  if (tree.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-theme-muted">
      <FolderTree size={40} className="opacity-20" />
      <div className="text-center">
        <p className="text-sm font-medium text-theme-primary">No categories yet</p>
        <p className="text-xs mt-1">Click "Add Category" to create the first one.</p>
      </div>
      <button onClick={onAddRoot} className="flex items-center gap-2 px-4 py-2 bg-accent-gold text-white rounded-lg text-sm font-semibold hover:bg-yellow-600 transition-colors">
        <Plus size={14} /> Add Category
      </button>
    </div>
  );

  return (
    <div className="p-4 space-y-1">
      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 px-2 text-[11px] text-theme-muted">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Browsing</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent-gold" /> Listing</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> Selection</span>
      </div>
      {tree.map(node => (
        <CategoryTreeNode key={node.id} node={node} depth={0} onEdit={onEdit} onDelete={onDelete} onAddChild={onAddChild} onViewDetails={onViewDetails} />
      ))}
    </div>
  );
};

// ── Single tree node (recursive) ────────────────────────────────────────────────
const CategoryTreeNode = ({ node, depth, onEdit, onDelete, onAddChild, onViewDetails }) => {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const level = node.level || (depth + 1);
  const isListing = node.is_listing_category;
  const isSelection = node.is_selection_attribute;

  const levelColor = isListing
    ? 'bg-accent-gold/10 text-accent-gold border-accent-gold/30'
    : isSelection
      ? 'bg-purple-500/10 text-purple-500 border-purple-500/30'
      : 'bg-blue-500/10 text-blue-500 border-blue-500/30';

  const nodeBg = isListing
    ? 'bg-accent-gold/5 border-accent-gold/20'
    : 'bg-theme-primary border-theme';

  return (
    <div>
      <div
        onClick={() => onViewDetails(node.id)}
        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border ${nodeBg} transition-all hover:shadow-sm cursor-pointer hover:border-accent-gold/40`}
        style={{ marginLeft: depth * 24 }}
      >
        {/* Expand toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(v => !v);
          }}
          className={`p-0.5 rounded transition-colors ${hasChildren ? 'text-theme-muted hover:text-theme-primary' : 'invisible'}`}
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {/* Level badge */}
        <span className={`flex-shrink-0 px-1.5 py-0.5 text-[10px] font-bold uppercase rounded border ${levelColor}`}>
          L{level}
        </span>

        {/* Name */}
        <span className="flex-1 text-sm font-medium text-theme-primary truncate">
          {node.category_name}
        </span>

        {/* Unit of measure */}
        {node.unit_of_measure && (
          <span className="flex items-center gap-1 text-[11px] text-theme-muted bg-theme-tertiary px-2 py-0.5 rounded-full">
            <Ruler size={10} /> {node.unit_of_measure}
          </span>
        )}

        {/* Product count */}
        {node.product_count > 0 && (
          <span className="text-[11px] text-accent-gold bg-accent-gold/10 px-2 py-0.5 rounded-full font-medium">
            {node.product_count} {node.product_count === 1 ? 'product' : 'products'}
          </span>
        )}

        {/* Children count */}
        {hasChildren && (
          <span className="text-[11px] text-theme-muted bg-theme-tertiary px-2 py-0.5 rounded-full">
            {node.children.length} sub
          </span>
        )}

        {/* Status */}
        {!node.is_active && (
          <span className="text-[10px] font-medium text-theme-muted bg-theme-tertiary px-2 py-0.5 rounded-full">
            Inactive
          </span>
        )}

        {/* Right arrow indicator */}
        <ChevronRight size={14} className="text-theme-muted opacity-50" />
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div className="mt-1 space-y-1">
          {node.children.map(child => (
            <CategoryTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ── Brand Form Modal ────────────────────────────────────────────────────────────
const BrandFormModal = ({ item, onClose, onSubmit, submitting }) => {
  const isEdit = !!item;
  const [formData, setFormData] = useState({
    brand_name: item?.brand_name || '',
    description: item?.description || '',
    is_active: item?.is_active !== false,
  });
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.brand_name.trim()) { setError('Brand name is required'); return; }
    onSubmit(formData);
  };

  return (
    <ModalShell title={isEdit ? 'Edit Brand' : 'Add Brand'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div>
          <label className={labelClass}>Brand Name <span className="text-red-500">*</span></label>
          <input type="text" value={formData.brand_name} autoFocus
            onChange={e => { setFormData(p => ({ ...p, brand_name: e.target.value })); setError(''); }}
            className={`${inputClass} ${error ? 'border-red-500/60' : ''}`}
            placeholder="Enter brand name" />
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <textarea value={formData.description} rows={3} placeholder="Optional description"
            onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
            className={`${inputClass} resize-none`} />
        </div>
        <ToggleField label="Active" value={formData.is_active} onChange={v => setFormData(p => ({ ...p, is_active: v }))} />
        <ModalFooter onClose={onClose} submitting={submitting} submitLabel={isEdit ? 'Save Changes' : 'Add Brand'} />
      </form>
    </ModalShell>
  );
};

// ── Category Form Modal ─────────────────────────────────────────────────────────
const CategoryFormModal = ({ item, parentCategory, onClose, onSubmit, submitting }) => {
  const isEdit = !!item;
  const [formData, setFormData] = useState({
    category_name: item?.category_name || '',
    description: item?.description || '',
    unit_of_measure: item?.unit_of_measure || '',
    parent_category_id: item?.parent_category_id || parentCategory?.id || null,
    is_active: item?.is_active !== false,
    is_listing_category: item?.is_listing_category || false,
    display_order: item?.display_order || 0,
  });
  const [error, setError] = useState('');

  const parentName = parentCategory?.category_name || item?.parent_category_name || null;
  const newLevel = parentCategory ? (parentCategory.level || 1) + 1 : (item?.level || 1);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.category_name.trim()) { setError('Category name is required'); return; }
    onSubmit(formData);
  };

  return (
    <ModalShell title={isEdit ? 'Edit Category' : parentCategory ? `Add Sub-category under "${parentCategory.category_name}"` : 'Add Root Category'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Level & parent info */}
        {(parentName || isEdit) && (
          <div className="flex items-center gap-2 text-xs text-theme-muted bg-theme-primary border border-theme rounded-lg px-3 py-2">
            <Layers size={12} />
            <span>Level <strong className="text-accent-gold">L{newLevel}</strong></span>
            {parentName && <span>· Parent: <strong className="text-theme-primary">{parentName}</strong></span>}
          </div>
        )}

        <div>
          <label className={labelClass}>Category Name <span className="text-red-500">*</span></label>
          <input type="text" value={formData.category_name} autoFocus
            onChange={e => { setFormData(p => ({ ...p, category_name: e.target.value })); setError(''); }}
            className={`${inputClass} ${error ? 'border-red-500/60' : ''}`}
            placeholder="e.g. Clothing, Size, Color" />
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea value={formData.description} rows={2} placeholder="Optional description"
            onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
            className={`${inputClass} resize-none`} />
        </div>

        <div>
          <label className={labelClass}>
            <span className="flex items-center gap-1"><Ruler size={12} /> Unit of Measure (Optional)</span>
          </label>
          <input type="text" value={formData.unit_of_measure}
            onChange={e => setFormData(p => ({ ...p, unit_of_measure: e.target.value }))}
            className={inputClass}
            placeholder="e.g. pieces, kg, meters, liters" />
          <p className="mt-1 text-[11px] text-theme-muted">Set the unit used for inventory and sales at this category level</p>
        </div>

        <div>
          <label className={labelClass}>Display Order</label>
          <input type="number" value={formData.display_order} min={0}
            onChange={e => setFormData(p => ({ ...p, display_order: parseInt(e.target.value) || 0 }))}
            className={inputClass} placeholder="0" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <ToggleField label="Active" value={formData.is_active} onChange={v => setFormData(p => ({ ...p, is_active: v }))} />
          <ToggleField label="Listing Category" value={formData.is_listing_category} onChange={v => setFormData(p => ({ ...p, is_listing_category: v }))} />
        </div>
        <ModalFooter onClose={onClose} submitting={submitting} submitLabel={isEdit ? 'Save Changes' : 'Add Category'} />
      </form>
    </ModalShell>
  );
};


// ── Delete Confirm Dialog ───────────────────────────────────────────────────────
const DeleteConfirmDialog = ({ item, tab, onClose, onConfirm, deleting }) => (
  <div className="fixed inset-0 z-60 flex items-center justify-center p-4" onClick={onClose}>
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
    <div className="relative bg-theme-secondary rounded-xl border border-theme shadow-theme-xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
          <Trash2 size={16} className="text-red-500" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-theme-primary">Delete {tab.singular}</h3>
          <p className="text-sm text-theme-muted mt-1">
            Are you sure you want to delete <span className="font-medium text-theme-primary">{item[tab.nameField] || item.category_name || item.brand_name}</span>?
            {item.children_count > 0 && (
              <span className="block mt-1 text-amber-500 text-xs">
                This category has {item.children_count} sub-categor{item.children_count !== 1 ? 'ies' : 'y'}.
              </span>
            )}
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} disabled={deleting} className="px-4 py-2 text-sm font-medium text-theme-secondary bg-theme-primary hover:bg-theme-tertiary border border-theme rounded-lg transition-colors">Cancel</button>
        <button onClick={onConfirm} disabled={deleting} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-60">
          {deleting && <RefreshCw size={13} className="animate-spin" />} Delete
        </button>
      </div>
    </div>
  </div>
);

// ── Shared UI helpers ───────────────────────────────────────────────────────────
const ModalShell = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-60 flex items-center justify-center p-4" onClick={onClose}>
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
    <div className="relative bg-theme-secondary rounded-xl border border-theme shadow-theme-xl w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-theme sticky top-0 bg-theme-secondary z-10">
        <h2 className="text-base font-semibold text-theme-primary">{title}</h2>
        <button onClick={onClose} className="p-1.5 text-theme-muted hover:text-theme-primary hover:bg-theme-tertiary rounded-lg transition-colors"><X size={16} /></button>
      </div>
      {children}
    </div>
  </div>
);

const ToggleField = ({ label, value, onChange }) => (
  <button type="button" onClick={() => onChange(!value)}
    className={`flex items-center justify-between w-full p-3 rounded-lg border transition-all ${
      value ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-theme-primary border-theme'
    }`}>
    <span className={`text-sm font-medium ${value ? 'text-emerald-500' : 'text-theme-muted'}`}>{label}</span>
    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
      value ? 'bg-emerald-500 border-emerald-500' : 'border-theme bg-theme-primary'
    }`}>
      {value && <span className="text-white text-[10px] font-bold">✓</span>}
    </div>
  </button>
);

const ModalFooter = ({ onClose, submitting, submitLabel }) => (
  <div className="flex justify-end gap-3 pt-2">
    <button type="button" onClick={onClose} disabled={submitting}
      className="px-4 py-2 text-sm font-medium text-theme-secondary bg-theme-primary hover:bg-theme-tertiary border border-theme rounded-lg transition-colors">
      Cancel
    </button>
    <button type="submit" disabled={submitting}
      className="flex items-center gap-2 px-6 py-2 text-sm font-semibold bg-accent-gold text-white rounded-lg hover:bg-yellow-600 transition-colors shadow-sm disabled:opacity-60">
      {submitting && <RefreshCw size={13} className="animate-spin" />}
      {submitLabel}
    </button>
  </div>
);

export default CategoryManagement;
