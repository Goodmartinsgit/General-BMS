import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Edit, Trash2, Plus, FolderTree, Layers, Ruler,
  Package, RefreshCw, AlertCircle, X
} from 'lucide-react';
import api from '../api/axios';
import { toast } from 'react-toastify';

const inputClass =
  'w-full px-3 py-2.5 bg-theme-primary border border-theme rounded-lg text-sm text-theme-primary placeholder-theme-muted focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all';
const labelClass = 'block text-sm font-medium text-theme-secondary mb-1';

const CategoryDetailPage = ({ categoryId, onClose, onUpdate }) => {
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [categoryTree, setCategoryTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (categoryId) fetchData();
  }, [categoryId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [categoryRes, treeRes] = await Promise.all([
        api.get(`/categories/${categoryId}`),
        api.get('/categories/tree'),
      ]);
      setCategory(categoryRes.data);
      setCategoryTree(Array.isArray(treeRes.data) ? treeRes.data : []);
    } catch (err) {
      setError('Failed to load category details.');
      toast.error('Failed to load category details.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (formData) => {
    setSubmitting(true);
    try {
      await api.put(`/categories/${categoryId}`, formData);
      toast.success('Category updated successfully');
      setShowEditModal(false);
      fetchData();
      onUpdate?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/categories/${categoryId}`);
      toast.success('Category deleted successfully');
      onClose();
      onUpdate?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete category');
    } finally {
      setDeleting(false);
    }
  };

  const handleAddChild = async (formData) => {
    setSubmitting(true);
    try {
      await api.post('/categories', { ...formData, parent_category_id: categoryId });
      toast.success('Sub-category created successfully');
      setShowAddChildModal(false);
      fetchData();
      onUpdate?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create sub-category');
    } finally {
      setSubmitting(false);
    }
  };

  if (!categoryId) return null;

  const level = category?.level || 1;
  const isListing = category?.is_listing_category;
  const isSelection = category?.is_selection_attribute;

  // Find the single root tree that contains this category (using its path)
  const rootId = category?.path ? parseInt(category.path.split('/')[0]) : null;
  const relevantTree = rootId
    ? categoryTree.filter(node => node.id === rootId)
    : categoryTree;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-theme-secondary rounded-xl border border-theme shadow-theme-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme sticky top-0 bg-theme-secondary z-10">
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-theme-primary">{loading ? 'Loading...' : category?.category_name || 'Category Details'}</h1>
            <p className="text-sm text-theme-muted mt-0.5">Category Details & Tree Structure</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-theme-muted hover:text-theme-primary hover:bg-theme-tertiary rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-theme-muted">
            <RefreshCw size={18} className="animate-spin" />
            <span className="text-sm">Loading category details...</span>
          </div>
        ) : error || !category ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <AlertCircle size={40} className="text-red-500 opacity-50" />
            <p className="text-sm text-theme-muted">{error || 'Category not found'}</p>
          </div>
        ) : (
          <div className="space-y-6 p-6">

            {/* Category Info Card with Action Buttons */}
            <div className="bg-theme-primary border border-theme rounded-xl shadow-theme-sm p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-theme-primary">{category.category_name}</h2>
              <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded border ${
                isListing
                  ? 'bg-accent-gold/10 text-accent-gold border-accent-gold/30'
                  : isSelection
                    ? 'bg-purple-500/10 text-purple-500 border-purple-500/30'
                    : 'bg-blue-500/10 text-blue-500 border-blue-500/30'
              }`}>
                L{level}
              </span>
              {!category.is_active && (
                <span className="px-2 py-0.5 text-xs font-medium text-theme-muted bg-theme-tertiary rounded-full">
                  Inactive
                </span>
              )}
            </div>

            {category.description && (
              <p className="text-sm text-theme-muted">{category.description}</p>
            )}

            <div className="flex items-center gap-4 text-sm">
              {category.unit_of_measure && (
                <span className="flex items-center gap-1.5 text-theme-muted">
                  <Ruler size={14} />
                  <span className="font-medium">{category.unit_of_measure}</span>
                </span>
              )}
              {category.product_count > 0 && (
                <span className="flex items-center gap-1.5 text-accent-gold">
                  <Package size={14} />
                  <span className="font-medium">{category.product_count} {category.product_count === 1 ? 'product' : 'products'}</span>
                </span>
              )}
              {category.children_count > 0 && (
                <span className="flex items-center gap-1.5 text-theme-muted">
                  <FolderTree size={14} />
                  <span className="font-medium">{category.children_count} sub-{category.children_count === 1 ? 'category' : 'categories'}</span>
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddChildModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-semibold hover:bg-emerald-600 transition-colors shadow-sm"
            >
              <Plus size={14} />
              Add Sub-category
            </button>
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-accent-gold text-white rounded-lg text-sm font-semibold hover:bg-yellow-600 transition-colors shadow-sm"
            >
              <Edit size={14} />
              Edit
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors shadow-sm"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </div>

            {/* Category Type Info */}
            <div className="bg-theme-secondary border border-theme rounded-lg p-4 text-xs text-theme-muted space-y-1">
          <p>
            <strong className={isListing ? 'text-accent-gold' : isSelection ? 'text-purple-500' : 'text-blue-500'}>
              {isListing ? 'Listing Category' : isSelection ? 'Selection Attribute' : 'Browsing Category'}
            </strong>
          </p>
          <p>
            {isListing
              ? 'Products are listed at this level with prices and inventory.'
              : isSelection
                ? 'This is a selection attribute (e.g., size, color) for product variants.'
                : 'This is a browsing category used for navigation and filtering.'}
              </p>
            </div>
            </div>

            {/* Full Category Tree — Visual Hierarchical Layout */}
            <div className="bg-theme-primary border border-theme rounded-xl shadow-theme-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-theme">
                <h3 className="text-base font-semibold text-theme-primary flex items-center gap-2">
                  <FolderTree size={16} />
                  Complete Category Tree
                </h3>
                <p className="text-xs text-theme-muted mt-1">
                  The highlighted category shows where "{category.category_name}" is located in the hierarchy
                </p>
              </div>

              <div className="p-6">
                {/* Legend */}
                <div className="flex items-center gap-4 mb-6 text-[11px] text-theme-muted">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Browsing
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-accent-gold" /> Listing
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Selection
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-accent-gold/20 border-2 border-accent-gold" /> Current
                  </span>
                </div>

                {relevantTree.length === 0 ? (
                  <div className="text-center py-10 text-theme-muted text-sm">
                    No categories in the tree
                  </div>
                ) : (
                  <div className="overflow-x-auto pb-4">
                    <div className="inline-flex flex-col items-center min-w-full">
                      {relevantTree.map(node => (
                        <HierarchicalTreeNode
                          key={node.id}
                          node={node}
                          highlightId={categoryId}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <CategoryFormModal
            item={category}
            onClose={() => setShowEditModal(false)}
            onSubmit={handleEdit}
            submitting={submitting}
          />
        )}

        {/* Add Child Modal */}
        {showAddChildModal && (
          <CategoryFormModal
            parentCategory={category}
            onClose={() => setShowAddChildModal(false)}
            onSubmit={handleAddChild}
            submitting={submitting}
          />
        )}

        {/* Delete Confirmation */}
        {showDeleteModal && (
          <DeleteConfirmDialog
            category={category}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleDelete}
            deleting={deleting}
          />
        )}
      </div>
    </div>
  );
};

// ── Visual Hierarchical Tree Node (top-down org-chart style) ────────────────
const HierarchicalTreeNode = ({ node, highlightId }) => {
  const hasChildren = node.children && node.children.length > 0;
  const level = node.level || 1;
  const isListing = node.is_listing_category;
  const isSelection = node.is_selection_attribute;
  const isHighlighted = node.id === highlightId;

  // Node styling
  const borderColor = isHighlighted
    ? 'border-accent-gold'
    : isListing
      ? 'border-accent-gold/40'
      : isSelection
        ? 'border-purple-500/40'
        : 'border-blue-500/40';

  const bgColor = isHighlighted
    ? 'bg-accent-gold/15'
    : isListing
      ? 'bg-accent-gold/5'
      : isSelection
        ? 'bg-purple-500/5'
        : 'bg-blue-500/5';

  const dotColor = isListing
    ? 'bg-accent-gold'
    : isSelection
      ? 'bg-purple-500'
      : 'bg-blue-500';

  const typeLabel = isListing ? 'Listing' : isSelection ? 'Selection' : 'Browse';

  const connectorColor = 'var(--tree-line, rgba(148,163,184,0.35))';

  return (
    <div className="flex flex-col items-center">
      {/* ── Node Box ── */}
      <div
        className={`relative px-4 py-2.5 rounded-xl border-2 ${borderColor} ${bgColor} text-center transition-all ${
          isHighlighted ? 'ring-2 ring-accent-gold/30 shadow-lg shadow-accent-gold/10' : 'shadow-sm'
        }`}
        style={{ minWidth: 110 }}
      >
        <div className="flex items-center justify-center gap-1.5 mb-0.5">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
          <span
            className={`text-xs font-semibold whitespace-nowrap ${
              isHighlighted ? 'text-accent-gold' : 'text-theme-primary'
            }`}
          >
            {node.category_name}
          </span>
        </div>
        <div className="text-[9px] text-theme-muted uppercase font-semibold tracking-wide">
          L{level} &middot; {typeLabel}
        </div>
        {/* Metadata pills */}
        <div className="flex items-center justify-center gap-1 mt-1.5">
          {node.product_count > 0 && (
            <span className="text-[9px] text-accent-gold bg-accent-gold/10 px-1.5 py-px rounded-full font-medium">
              {node.product_count} prod
            </span>
          )}
          {node.unit_of_measure && (
            <span className="text-[9px] text-theme-muted bg-theme-tertiary px-1.5 py-px rounded-full">
              {node.unit_of_measure}
            </span>
          )}
        </div>
      </div>

      {/* ── Connector lines to children ── */}
      {hasChildren && (
        <>
          {/* Vertical line down from parent */}
          <div className="w-px h-6" style={{ backgroundColor: connectorColor }} />

          {/* Children row */}
          <div className="relative flex items-start">
            {/* Horizontal line spanning from first child center to last child center */}
            {node.children.length > 1 && (
              <div
                className="absolute top-0 h-px"
                style={{
                  backgroundColor: connectorColor,
                  left: `calc(${100 / (node.children.length * 2)}% + 0px)`,
                  right: `calc(${100 / (node.children.length * 2)}% + 0px)`,
                }}
              />
            )}

            {/* Child nodes */}
            {node.children.map((child) => (
              <div key={child.id} className="flex flex-col items-center px-3">
                {/* Vertical stub up from horizontal line to child */}
                <div className="w-px h-6" style={{ backgroundColor: connectorColor }} />
                <HierarchicalTreeNode node={child} highlightId={highlightId} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ── Category Form Modal ─────────────────────────────────────────────────────
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

  const parentName = parentCategory?.category_name || null;
  const newLevel = parentCategory ? (parentCategory.level || 1) + 1 : (item?.level || 1);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.category_name.trim()) {
      setError('Category name is required');
      return;
    }
    onSubmit(formData);
  };

  return (
    <ModalShell
      title={isEdit ? 'Edit Category' : `Add Sub-category under "${parentCategory.category_name}"`}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Level info */}
        <div className="flex items-center gap-2 text-xs text-theme-muted bg-theme-primary border border-theme rounded-lg px-3 py-2">
          <Layers size={12} />
          <span>Level <strong className="text-accent-gold">L{newLevel}</strong></span>
          {parentName && <span>· Parent: <strong className="text-theme-primary">{parentName}</strong></span>}
        </div>

        <div>
          <label className={labelClass}>Category Name <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={formData.category_name}
            autoFocus
            onChange={e => {
              setFormData(p => ({ ...p, category_name: e.target.value }));
              setError('');
            }}
            className={`${inputClass} ${error ? 'border-red-500/60' : ''}`}
            placeholder="e.g. Clothing, Size, Color"
          />
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea
            value={formData.description}
            rows={2}
            placeholder="Optional description"
            onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
            className={`${inputClass} resize-none`}
          />
        </div>

        <div>
          <label className={labelClass}>
            <span className="flex items-center gap-1"><Ruler size={12} /> Unit of Measure (Optional)</span>
          </label>
          <input
            type="text"
            value={formData.unit_of_measure}
            onChange={e => setFormData(p => ({ ...p, unit_of_measure: e.target.value }))}
            className={inputClass}
            placeholder="e.g. pieces, kg, meters, liters"
          />
        </div>

        <div>
          <label className={labelClass}>Display Order</label>
          <input
            type="number"
            value={formData.display_order}
            min={0}
            onChange={e => setFormData(p => ({ ...p, display_order: parseInt(e.target.value) || 0 }))}
            className={inputClass}
            placeholder="0"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <ToggleField
            label="Active"
            value={formData.is_active}
            onChange={v => setFormData(p => ({ ...p, is_active: v }))}
          />
          <ToggleField
            label="Listing Category"
            value={formData.is_listing_category}
            onChange={v => setFormData(p => ({ ...p, is_listing_category: v }))}
          />
        </div>
        <p className="text-[10px] text-theme-muted italic">
          * Enabling this will apply to the entire category level (L{newLevel}) under this branch.
        </p>
        <ModalFooter
          onClose={onClose}
          submitting={submitting}
          submitLabel={isEdit ? 'Save Changes' : 'Add Sub-category'}
        />
      </form>
    </ModalShell>
  );
};

// ── Delete Confirmation Dialog ──────────────────────────────────────────────
const DeleteConfirmDialog = ({ category, onClose, onConfirm, deleting }) => (
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
          <h3 className="text-sm font-semibold text-theme-primary">Delete Category</h3>
          <p className="text-sm text-theme-muted mt-1">
            Are you sure you want to delete <span className="font-medium text-theme-primary">{category.category_name}</span>?
            {category.children_count > 0 && (
              <span className="block mt-1 text-amber-500 text-xs">
                This category has {category.children_count} sub-categor{category.children_count !== 1 ? 'ies' : 'y'}.
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

// ── Shared UI Components ────────────────────────────────────────────────────
const ModalShell = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-60 flex items-center justify-center p-4" onClick={onClose}>
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
    <div
      className="relative bg-theme-secondary rounded-xl border border-theme shadow-theme-xl w-full max-w-md max-h-[85vh] overflow-y-auto"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-theme sticky top-0 bg-theme-secondary z-10">
        <h2 className="text-base font-semibold text-theme-primary">{title}</h2>
        <button
          onClick={onClose}
          className="p-1.5 text-theme-muted hover:text-theme-primary hover:bg-theme-tertiary rounded-lg transition-colors"
        >
          <X size={16} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

const ToggleField = ({ label, value, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!value)}
    className={`flex items-center justify-between w-full p-3 rounded-lg border transition-all ${
      value ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-theme-primary border-theme'
    }`}
  >
    <span className={`text-sm font-medium ${value ? 'text-emerald-500' : 'text-theme-muted'}`}>{label}</span>
    <div
      className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
        value ? 'bg-emerald-500 border-emerald-500' : 'border-theme bg-theme-primary'
      }`}
    >
      {value && <span className="text-white text-[10px] font-bold">✓</span>}
    </div>
  </button>
);

const ModalFooter = ({ onClose, submitting, submitLabel }) => (
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
      {submitLabel}
    </button>
  </div>
);

export default CategoryDetailPage;
