import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import Modal from './ui/Modal';
import { useBranch } from '../context/BranchContext';

const inputClass =
  'w-full px-3 py-2.5 bg-theme-primary border border-theme rounded-lg text-sm text-theme-primary placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 transition-all';
const labelClass = 'block text-sm font-medium text-theme-secondary mb-1';

const MOVEMENT_TYPES = [
  { value: 'receipt',    label: 'Stock Receipt (Add)'      },
  { value: 'adjustment', label: 'Manual Adjustment'        },
  { value: 'return',     label: 'Customer Return (Add)'    },
  { value: 'sale',       label: 'Manual Sale (Deduct)'     },
];

const InventoryUpdateModal = ({ isOpen, onClose, onSubmit, products = [], branches = [], loading = false }) => {
  const { singleBranchMode, currentBranchId } = useBranch();

  const [formData, setFormData] = useState({
    product_id: '',
    branch_id: '',
    quantity_change: '',
    movement_type: 'receipt',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        product_id: '',
        // In single-branch mode auto-fill; otherwise clear for manual selection
        branch_id: singleBranchMode && currentBranchId ? String(currentBranchId) : '',
        quantity_change: '',
        movement_type: 'receipt',
        notes: '',
      });
    }
  }, [isOpen, singleBranchMode, currentBranchId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Stock Level"
      subtitle="Manually adjust stock for a product"
      size="md"
      footer={
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-theme-secondary bg-theme-primary hover:bg-theme-tertiary border border-theme rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="inventory-update-form"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-accent-gold rounded-lg hover:bg-accent-goldDark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            <RefreshCw className="w-4 h-4" />
            Update Stock
          </button>
        </div>
      }
    >
      <form id="inventory-update-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>
            Product <span className="text-red-500">*</span>
          </label>
          <select
            name="product_id"
            value={formData.product_id}
            onChange={handleChange}
            required
            className={inputClass}
          >
            <option value="">Select Product...</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>
                {p.product_name} ({p.product_code})
              </option>
            ))}
          </select>
        </div>

        {/* Branch dropdown — hidden in single-branch mode */}
        {!singleBranchMode && (
          <div>
            <label className={labelClass}>
              Branch <span className="text-red-500">*</span>
            </label>
            <select
              name="branch_id"
              value={formData.branch_id}
              onChange={handleChange}
              required
              className={inputClass}
            >
              <option value="">Select Branch...</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.branch_name}{b.main_branch ? ' (Main)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className={labelClass}>
            Adjustment Type <span className="text-red-500">*</span>
          </label>
          <select
            name="movement_type"
            value={formData.movement_type}
            onChange={handleChange}
            required
            className={inputClass}
          >
            {MOVEMENT_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>
            Quantity Change <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="quantity_change"
            value={formData.quantity_change}
            onChange={handleChange}
            placeholder="e.g. 50 or -10"
            required
            className={inputClass}
          />
          <p className="mt-1 text-xs text-theme-muted">Use a negative number to deduct stock.</p>
        </div>

        <div>
          <label className={labelClass}>Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={2}
            placeholder="Reference number or reason..."
            className={`${inputClass} resize-none`}
          />
        </div>
      </form>
    </Modal>
  );
};

export default InventoryUpdateModal;
