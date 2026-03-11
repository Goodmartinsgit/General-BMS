import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronDown, ChevronRight, Layers, AlertTriangle, CheckCircle,
  Package, DollarSign, RefreshCw, Ruler,
} from 'lucide-react';
import api from '../../api/axios';
import { useCurrency } from '../../context/CurrencyContext';

/**
 * CategoryStockAssigner
 * Shows the selection-level subtree under a listing-level category.
 * Each node lets the user assign stock and optional price override.
 * Enforces hard stock balancing: parent stock == SUM(children stock).
 */
const CategoryStockAssigner = ({
  categoryId,
  productId,
  totalStock = 0,
  basePrice = 0,
  onChange,
  className = '',
}) => {
  const { formatCurrency } = useCurrency();
  const [tree, setTree] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Fetch subtree and existing assignments
  const fetchData = useCallback(async () => {
    if (!categoryId) return;
    setLoading(true);
    setError(null);
    try {
      const [subtreeRes, assignRes] = await Promise.all([
        api.get(`/categories/${categoryId}/subtree`),
        productId ? api.get(`/categories/assignments/${productId}`) : { data: [] },
      ]);

      const subtree = Array.isArray(subtreeRes.data) ? subtreeRes.data : [];
      setTree(subtree);

      // Build assignments map from existing data
      const existing = {};
      if (Array.isArray(assignRes.data)) {
        for (const a of assignRes.data) {
          existing[a.category_id] = {
            stock_allocated: a.stock_allocated || 0,
            price_override: a.price_override || '',
          };
        }
      }
      setAssignments(existing);
    } catch {
      setError('Failed to load category tree');
    } finally {
      setLoading(false);
    }
  }, [categoryId, productId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Notify parent about changes
  useEffect(() => {
    if (onChange) {
      onChange(assignments, validationErrors);
    }
  }, [assignments, validationErrors]);

  // Update a single node's assignment
  const updateAssignment = (catId, field, value) => {
    setAssignments(prev => {
      const updated = {
        ...prev,
        [catId]: {
          ...prev[catId],
          stock_allocated: prev[catId]?.stock_allocated || 0,
          price_override: prev[catId]?.price_override || '',
          [field]: value,
        },
      };
      // Re-validate
      validateAll(updated, tree);
      return updated;
    });
  };

  // Stock balancing validation
  const validateAll = (assigns, nodes) => {
    const errors = {};
    const checkNode = (node) => {
      if (!node.children || node.children.length === 0) return;
      const parentStock = parseInt(assigns[node.id]?.stock_allocated) || 0;
      const childTotal = node.children.reduce(
        (sum, ch) => sum + (parseInt(assigns[ch.id]?.stock_allocated) || 0),
        0
      );
      if (parentStock > 0 && childTotal !== parentStock) {
        errors[node.id] = {
          parent_stock: parentStock,
          children_total: childTotal,
          diff: parentStock - childTotal,
        };
      }
      node.children.forEach(checkNode);
    };
    nodes.forEach(checkNode);
    setValidationErrors(errors);
  };

  // Get flat list of assignments for saving
  const getAssignmentsForSave = () => {
    const result = [];
    const flattenTree = (nodes) => {
      for (const node of nodes) {
        const a = assignments[node.id];
        if (a && (a.stock_allocated > 0 || a.price_override)) {
          result.push({
            category_id: node.id,
            stock_allocated: parseInt(a.stock_allocated) || 0,
            price_override: a.price_override ? parseFloat(a.price_override) : null,
            is_leaf: !node.children || node.children.length === 0,
          });
        }
        if (node.children) flattenTree(node.children);
      }
    };
    flattenTree(tree);
    return result;
  };

  // Expose for parent
  useEffect(() => {
    if (onChange) {
      onChange(getAssignmentsForSave(), validationErrors);
    }
  }, [assignments, validationErrors]);

  if (!categoryId) return null;

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-8 gap-2 text-theme-muted ${className}`}>
        <RefreshCw size={16} className="animate-spin" />
        <span className="text-sm">Loading category tree…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center py-8 gap-2 text-red-500 ${className}`}>
        <AlertTriangle size={16} />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  if (tree.length === 0) {
    return (
      <div className={`text-center py-6 text-theme-muted ${className}`}>
        <Layers size={24} className="mx-auto mb-2 opacity-30" />
        <p className="text-sm">No sub-categories under this category.</p>
        <p className="text-xs mt-1">Add sub-categories in Category Management first.</p>
      </div>
    );
  }

  const hasErrors = Object.keys(validationErrors).length > 0;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-accent-gold uppercase tracking-wider">
          Stock & Price Allocation
        </h4>
        {hasErrors ? (
          <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
            <AlertTriangle size={12} />
            Stock imbalance
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-emerald-500 font-medium">
            <CheckCircle size={12} />
            Balanced
          </span>
        )}
      </div>

      {/* Tree */}
      <div className="border border-theme rounded-lg overflow-hidden divide-y divide-theme">
        {tree.map(node => (
          <AssignmentNode
            key={node.id}
            node={node}
            depth={0}
            assignments={assignments}
            validationErrors={validationErrors}
            onUpdate={updateAssignment}
            basePrice={basePrice}
            formatCurrency={formatCurrency}
          />
        ))}
      </div>

      {/* Summary */}
      {hasErrors && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-xs text-red-600 dark:text-red-400">
          <strong>Stock must balance:</strong> The total stock assigned to children must equal the parent's stock at every level. Saving is blocked until all levels balance.
        </div>
      )}
    </div>
  );
};

// ── Single Assignment Node (recursive) ──────────────────────────────────────────
const AssignmentNode = ({ node, depth, assignments, validationErrors, onUpdate, basePrice, formatCurrency }) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const assignment = assignments[node.id] || { stock_allocated: 0, price_override: '' };
  const nodeError = validationErrors[node.id];

  const inputClass =
    'w-full px-2 py-1.5 bg-theme-primary border border-theme rounded text-sm text-theme-primary placeholder-theme-muted focus:ring-1 focus:ring-accent-gold/30 focus:border-accent-gold/30 outline-none';

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-3 py-2.5 ${
          nodeError ? 'bg-red-500/5' : depth % 2 === 0 ? 'bg-theme-primary' : 'bg-theme-secondary'
        }`}
        style={{ paddingLeft: `${12 + depth * 20}px` }}
      >
        {/* Expand toggle */}
        {hasChildren ? (
          <button onClick={() => setExpanded(v => !v)} className="p-0.5 text-theme-muted hover:text-theme-primary">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span className="w-[18px]" />
        )}

        {/* Name + unit */}
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-theme-primary">{node.category_name}</span>
          {node.unit_of_measure && (
            <span className="ml-2 text-[10px] text-theme-muted bg-theme-tertiary px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5">
              <Ruler size={8} /> {node.unit_of_measure}
            </span>
          )}
        </div>

        {/* Stock input */}
        <div className="flex items-center gap-1 w-28">
          <Package size={12} className={`flex-shrink-0 ${nodeError ? 'text-red-500' : 'text-theme-muted'}`} />
          <input
            type="number"
            min="0"
            value={assignment.stock_allocated}
            onChange={e => onUpdate(node.id, 'stock_allocated', e.target.value)}
            className={`${inputClass} ${nodeError ? 'border-red-500/60' : ''}`}
            placeholder="Stock"
          />
        </div>

        {/* Price override input */}
        <div className="flex items-center gap-1 w-32">
          <DollarSign size={12} className="flex-shrink-0 text-theme-muted" />
          <input
            type="number"
            min="0"
            step="0.01"
            value={assignment.price_override}
            onChange={e => onUpdate(node.id, 'price_override', e.target.value)}
            className={inputClass}
            placeholder={basePrice ? formatCurrency(basePrice) : 'Price'}
          />
        </div>

        {/* Balance indicator */}
        {nodeError && (
          <span className="flex-shrink-0 text-[10px] text-red-500 font-medium whitespace-nowrap">
            {nodeError.diff > 0 ? `${nodeError.diff} unassigned` : `${Math.abs(nodeError.diff)} over`}
          </span>
        )}
      </div>

      {/* Children */}
      {expanded && hasChildren && node.children.map(child => (
        <AssignmentNode
          key={child.id}
          node={child}
          depth={depth + 1}
          assignments={assignments}
          validationErrors={validationErrors}
          onUpdate={onUpdate}
          basePrice={basePrice}
          formatCurrency={formatCurrency}
        />
      ))}
    </div>
  );
};

export default CategoryStockAssigner;
