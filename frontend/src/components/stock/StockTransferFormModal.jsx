import React, { useState, useEffect } from 'react';
import { TruckIcon, Warehouse, Package, Search, Plus, Minus, AlertCircle, X } from 'lucide-react';
import Modal from '../ui/Modal';
import api from '../../api/axios';

const inputClass =
  'w-full px-3 py-2.5 bg-theme-primary border border-theme rounded-lg text-sm text-theme-primary placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 transition-all';
const labelClass = 'block text-sm font-medium text-theme-secondary mb-1';
const sectionHeadClass =
  'text-xs font-semibold text-accent-gold uppercase tracking-wider pb-2 border-b border-theme';

const TRANSFER_REASONS = [
  'Stock Balancing',
  'Customer Request',
  'Emergency Stock',
  'Store Opening',
  'Store Closing',
  'Seasonal Adjustment',
  'Other',
];

const StockTransferFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  branches = [],
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    from_branch_id: '',
    to_branch_id: '',
    transfer_reason: '',
    notes: '',
    items: [],
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [searching, setSearching] = useState(false);
  const [errors, setErrors] = useState({});

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setFormData({ from_branch_id: '', to_branch_id: '', transfer_reason: '', notes: '', items: [] });
      setSearchQuery('');
      setProducts([]);
      setErrors({});
    }
  }, [isOpen]);

  // Debounced product search
  useEffect(() => {
    if (searchQuery.length < 2 || !formData.from_branch_id) {
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
  }, [searchQuery, formData.from_branch_id]);

  const handleChange = (field, value) => {
    if (field === 'from_branch_id') {
      setFormData(prev => ({ ...prev, from_branch_id: value, items: [] }));
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
        items: [...prev.items, {
          product_id: product.id,
          product_name: product.product_name,
          product_code: product.product_code,
          quantity: 1,
          available_stock: availableStock,
        }],
      }));
    }
    if (errors.items) setErrors(prev => ({ ...prev, items: null }));
  };

  const handleUpdateQuantity = (index, qty) => {
    const updated = [...formData.items];
    const item = updated[index];
    if (qty <= 0) {
      updated.splice(index, 1);
    } else if (qty <= item.available_stock) {
      updated[index] = { ...item, quantity: qty };
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
    if (!formData.from_branch_id) errs.from_branch_id = 'Select source branch';
    if (!formData.to_branch_id) errs.to_branch_id = 'Select destination branch';
    if (formData.from_branch_id && formData.to_branch_id && formData.from_branch_id === formData.to_branch_id)
      errs.to_branch_id = 'Destination must differ from source';
    if (!formData.transfer_reason) errs.transfer_reason = 'Transfer reason is required';
    if (formData.items.length === 0) errs.items = 'At least one item must be added';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit({
        from_branch_id: formData.from_branch_id,
        to_branch_id: formData.to_branch_id,
        transfer_reason: formData.transfer_reason,
        notes: formData.notes,
        items: formData.items.map(i => ({
          product_id: i.product_id,
          quantity: i.quantity,
        })),
      });
    }
  };

  const totalItems = formData.items.reduce((s, i) => s + i.quantity, 0);
  const fromBranch = branches.find(b => String(b.id) === String(formData.from_branch_id));
  const toBranch = branches.find(b => String(b.id) === String(formData.to_branch_id));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Stock Transfer"
      subtitle="Transfer inventory between branches"
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
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-accent-gold text-white rounded-lg hover:bg-accent-goldDark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            Create Transfer ({formData.items.length} product{formData.items.length !== 1 ? 's' : ''},{' '}
            {totalItems} units)
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Transfer Details */}
        <div className="space-y-4">
          <h3 className={sectionHeadClass}>Transfer Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>From Branch (Source) <span className="text-red-500">*</span></label>
              <select
                value={formData.from_branch_id}
                onChange={e => handleChange('from_branch_id', e.target.value)}
                className={`${inputClass} ${errors.from_branch_id ? 'border-red-500/60' : ''}`}
              >
                <option value="">Select source branch...</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.branch_name}{b.main_branch ? ' (Main)' : ''}</option>
                ))}
              </select>
              {errors.from_branch_id && <p className="mt-1 text-xs text-red-500">{errors.from_branch_id}</p>}
            </div>

            <div>
              <label className={labelClass}>To Branch (Destination) <span className="text-red-500">*</span></label>
              <select
                value={formData.to_branch_id}
                onChange={e => handleChange('to_branch_id', e.target.value)}
                className={`${inputClass} ${errors.to_branch_id ? 'border-red-500/60' : ''}`}
              >
                <option value="">Select destination branch...</option>
                {branches
                  .filter(b => String(b.id) !== String(formData.from_branch_id))
                  .map(b => (
                    <option key={b.id} value={b.id}>{b.branch_name}{b.main_branch ? ' (Main)' : ''}</option>
                  ))}
              </select>
              {errors.to_branch_id && <p className="mt-1 text-xs text-red-500">{errors.to_branch_id}</p>}
            </div>
          </div>

          {/* Branch indicator */}
          {fromBranch && toBranch && (
            <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex-1 text-center">
                <Warehouse className="w-5 h-5 mx-auto mb-0.5 text-blue-500" />
                <p className="text-xs font-semibold text-theme-primary">{fromBranch.branch_name}</p>
                <p className="text-[10px] text-blue-500">Source</p>
              </div>
              <TruckIcon className="w-6 h-6 text-accent-gold flex-shrink-0" />
              <div className="flex-1 text-center">
                <Warehouse className="w-5 h-5 mx-auto mb-0.5 text-green-500" />
                <p className="text-xs font-semibold text-theme-primary">{toBranch.branch_name}</p>
                <p className="text-[10px] text-green-500">Destination</p>
              </div>
            </div>
          )}

          <div>
            <label className={labelClass}>Transfer Reason <span className="text-red-500">*</span></label>
            <select
              value={formData.transfer_reason}
              onChange={e => handleChange('transfer_reason', e.target.value)}
              className={`${inputClass} ${errors.transfer_reason ? 'border-red-500/60' : ''}`}
            >
              <option value="">Select reason...</option>
              {TRANSFER_REASONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            {errors.transfer_reason && <p className="mt-1 text-xs text-red-500">{errors.transfer_reason}</p>}
          </div>

          <div>
            <label className={labelClass}>Additional Notes</label>
            <textarea
              value={formData.notes}
              onChange={e => handleChange('notes', e.target.value)}
              rows={2}
              placeholder="Optional details about the transfer..."
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>

        {/* Product Search */}
        {formData.from_branch_id && (
          <div className="space-y-3">
            <h3 className={sectionHeadClass}>
              Add Products — {fromBranch?.branch_name}
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
                        className="ml-3 flex items-center gap-1 px-2.5 py-1.5 bg-accent-gold text-white text-xs font-medium rounded-lg hover:bg-accent-goldDark transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
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
            Items to Transfer ({formData.items.length})
            {errors.items && (
              <span className="text-red-500 text-xs normal-case ml-2">{errors.items}</span>
            )}
          </h3>

          {formData.items.length === 0 ? (
            <div className="border-2 border-dashed border-theme rounded-lg p-8 text-center">
              <Package className="w-10 h-10 text-theme-muted mx-auto mb-2 opacity-50" />
              <p className="text-sm text-theme-muted">
                {formData.from_branch_id ? 'Search and add products above' : 'Select a source branch first'}
              </p>
            </div>
          ) : (
            <div className="border border-theme rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-theme-tertiary border-b border-theme">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-theme-muted uppercase">Product</th>
                    <th className="px-4 py-2.5 text-center text-xs font-medium text-theme-muted uppercase">Available</th>
                    <th className="px-4 py-2.5 text-center text-xs font-medium text-theme-muted uppercase">Transfer Qty</th>
                    <th className="w-10"></th>
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
                      <td className="px-4 py-3 text-center font-medium text-theme-secondary">
                        {item.available_stock}
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
                            max={item.available_stock}
                            value={item.quantity}
                            onChange={e => handleUpdateQuantity(index, parseInt(e.target.value) || 1)}
                            className="w-14 px-2 py-1 text-center border border-theme bg-theme-primary text-theme-primary rounded text-sm focus:outline-none focus:ring-1 focus:ring-accent-gold/30"
                          />
                          <button
                            onClick={() => handleUpdateQuantity(index, item.quantity + 1)}
                            disabled={item.quantity >= item.available_stock}
                            className="w-7 h-7 flex items-center justify-center border border-theme rounded hover:bg-theme-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-3.5 h-3.5 text-theme-secondary" />
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
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
                <tfoot className="bg-theme-tertiary border-t-2 border-theme">
                  <tr>
                    <td colSpan="2" className="px-4 py-3 text-right font-semibold text-theme-secondary text-sm">
                      Total Units:
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-accent-gold text-lg">
                      {totalItems}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Info notice */}
        {formData.items.length > 0 && (
          <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-500">
              Transfer will be created with <span className="font-bold">Pending</span> status and must be approved before stock is moved.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default StockTransferFormModal;
