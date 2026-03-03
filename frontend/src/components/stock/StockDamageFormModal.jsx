import React, { useState, useEffect } from 'react';
import { AlertTriangle, Package, Search, Plus, Minus, X } from 'lucide-react';
import Modal from '../ui/Modal';
import api from '../../api/axios';

const inputClass =
  'w-full px-3 py-2.5 bg-theme-primary border border-theme rounded-lg text-sm text-theme-primary placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 transition-all';
const labelClass = 'block text-sm font-medium text-theme-secondary mb-1';
const sectionHeadClass =
  'text-xs font-semibold text-accent-gold uppercase tracking-wider pb-2 border-b border-theme';

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

const StockDamageFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  branches = [],
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    branch_id: '',
    damage_reason: '',
    notes: '',
    items: [],
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [searching, setSearching] = useState(false);
  const [errors, setErrors] = useState({});

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({ branch_id: '', damage_reason: '', notes: '', items: [] });
      setSearchQuery('');
      setProducts([]);
      setErrors({});
    }
  }, [isOpen]);

  // Search products when query changes and branch is selected
  useEffect(() => {
    if (searchQuery.length < 2 || !formData.branch_id) {
      setProducts([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get('/products', {
          params: { search: searchQuery, limit: 10, is_active: true },
        });
        setProducts(res.data?.products || []);
      } catch {
        setProducts([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, formData.branch_id]);

  const handleChange = (field, value) => {
    if (field === 'branch_id') {
      setFormData(prev => ({ ...prev, branch_id: value, items: [] }));
      setSearchQuery('');
      setProducts([]);
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleAddProduct = (product) => {
    const existing = formData.items.findIndex(i => i.product_id === product.id);
    if (existing >= 0) {
      const updated = [...formData.items];
      updated[existing].quantity += 1;
      setFormData(prev => ({ ...prev, items: updated }));
    } else {
      const availableStock = product.total_stock ?? product.stock ?? product.quantity_on_hand ?? 0;
      setFormData(prev => ({
        ...prev,
        items: [
          ...prev.items,
          {
            product_id: product.id,
            product_name: product.product_name,
            product_code: product.product_code,
            quantity: 1,
            available_stock: availableStock,
          },
        ],
      }));
    }
    if (errors.items) setErrors(prev => ({ ...prev, items: null }));
  };

  const handleUpdateQuantity = (index, qty) => {
    const updated = [...formData.items];
    if (qty <= 0) {
      updated.splice(index, 1);
    } else {
      updated[index] = { ...updated[index], quantity: qty };
    }
    setFormData(prev => ({ ...prev, items: updated }));
  };

  const handleRemoveItem = (index) => {
    const updated = [...formData.items];
    updated.splice(index, 1);
    setFormData(prev => ({ ...prev, items: updated }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.branch_id) errs.branch_id = 'Please select a branch';
    if (!formData.damage_reason) errs.damage_reason = 'Damage reason is required';
    if (formData.items.length === 0) errs.items = 'At least one item must be added';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) onSubmit(formData);
  };

  const totalUnits = formData.items.reduce((s, i) => s + i.quantity, 0);
  const selectedBranch = branches.find(b => String(b.id) === String(formData.branch_id));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Damaged Stock"
      subtitle="Record items that have been damaged or lost"
      size="lg"
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
            type="button"
            onClick={handleSubmit}
            disabled={loading || formData.items.length === 0}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            Record Damage ({formData.items.length} product{formData.items.length !== 1 ? 's' : ''},{' '}
            {totalUnits} units)
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Damage Details */}
        <div className="space-y-4">
          <h3 className={sectionHeadClass}>Damage Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Branch <span className="text-red-500">*</span></label>
              <select
                value={formData.branch_id}
                onChange={e => handleChange('branch_id', e.target.value)}
                className={`${inputClass} ${errors.branch_id ? 'border-red-500/60' : ''}`}
              >
                <option value="">Select branch...</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.branch_name}{b.main_branch ? ' (Main)' : ''}
                  </option>
                ))}
              </select>
              {errors.branch_id && <p className="mt-1 text-xs text-red-500">{errors.branch_id}</p>}
            </div>

            <div>
              <label className={labelClass}>Damage Reason <span className="text-red-500">*</span></label>
              <select
                value={formData.damage_reason}
                onChange={e => handleChange('damage_reason', e.target.value)}
                className={`${inputClass} ${errors.damage_reason ? 'border-red-500/60' : ''}`}
              >
                <option value="">Select reason...</option>
                {DAMAGE_REASONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              {errors.damage_reason && <p className="mt-1 text-xs text-red-500">{errors.damage_reason}</p>}
            </div>
          </div>

          <div>
            <label className={labelClass}>Additional Notes</label>
            <textarea
              value={formData.notes}
              onChange={e => handleChange('notes', e.target.value)}
              rows={2}
              placeholder="Describe the damage in detail..."
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>

        {/* Product Search */}
        {formData.branch_id && (
          <div className="space-y-3">
            <h3 className={sectionHeadClass}>
              Add Products — {selectedBranch?.branch_name}
            </h3>

            <div className="relative">
              <Search className="w-4 h-4 text-theme-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by product name or code..."
                className={`${inputClass} pl-9`}
              />
            </div>

            {searching ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-gold" />
              </div>
            ) : products.length > 0 ? (
              <div className="border border-theme rounded-lg divide-y divide-theme max-h-52 overflow-y-auto">
                {products.map(product => {
                  const stock = product.total_stock ?? product.stock ?? product.quantity_on_hand ?? 0;
                  return (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 hover:bg-theme-tertiary transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-theme-primary truncate">{product.product_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-accent-gold/10 text-accent-gold border border-accent-gold/20">
                            {product.product_code}
                          </span>
                          <span className={`text-xs ${stock > 10 ? 'text-green-500' : 'text-yellow-500'}`}>
                            {stock} in stock
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddProduct(product)}
                        disabled={stock === 0}
                        className="ml-3 flex items-center gap-1 px-2.5 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : searchQuery.length >= 2 ? (
              <div className="text-center py-8 text-theme-muted">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No products found for "{searchQuery}"</p>
              </div>
            ) : null}
          </div>
        )}

        {/* Items Table */}
        <div className="space-y-2">
          <h3 className={sectionHeadClass}>
            Damaged Items ({formData.items.length})
            {errors.items && (
              <span className="text-red-500 text-xs normal-case ml-2">{errors.items}</span>
            )}
          </h3>

          {formData.items.length === 0 ? (
            <div className="border-2 border-dashed border-theme rounded-lg p-8 text-center">
              <AlertTriangle className="w-10 h-10 text-theme-muted mx-auto mb-2 opacity-50" />
              <p className="text-sm text-theme-muted">
                {formData.branch_id ? 'Search and add damaged products above' : 'Select a branch first'}
              </p>
            </div>
          ) : (
            <div className="border border-theme rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-theme-tertiary border-b border-theme">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-theme-muted uppercase">Product</th>
                    <th className="px-4 py-2.5 text-center text-xs font-medium text-theme-muted uppercase">Damaged Qty</th>
                    <th className="px-4 py-2.5 text-center text-xs font-medium text-theme-muted uppercase w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme">
                  {formData.items.map((item, index) => (
                    <tr key={index} className="hover:bg-theme-tertiary transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-theme-primary">{item.product_name}</p>
                        {item.product_code && (
                          <p className="text-xs font-mono text-theme-muted">{item.product_code}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleUpdateQuantity(index, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center border border-theme rounded hover:bg-theme-secondary transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5 text-theme-secondary" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={e => handleUpdateQuantity(index, parseInt(e.target.value) || 1)}
                            className="w-14 px-2 py-1 text-center border border-theme bg-theme-primary text-theme-primary rounded text-sm focus:outline-none focus:ring-1 focus:ring-accent-gold/30"
                          />
                          <button
                            onClick={() => handleUpdateQuantity(index, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center border border-theme rounded hover:bg-theme-secondary transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5 text-theme-secondary" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="p-1.5 text-theme-muted hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-red-500/10 border-t-2 border-red-500/30">
                  <tr>
                    <td className="px-4 py-3 text-right font-semibold text-theme-secondary text-sm">Total Damaged Units:</td>
                    <td className="px-4 py-3 text-center font-bold text-red-500 text-lg">{totalUnits}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Warning */}
        {formData.items.length > 0 && (
          <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-500">
                This will reduce stock at {selectedBranch?.branch_name} by {totalUnits} unit{totalUnits !== 1 ? 's' : ''}.
              </p>
              <p className="text-xs text-red-400 mt-0.5">
                Damage records cannot be undone. Ensure all details are correct before submitting.
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default StockDamageFormModal;
