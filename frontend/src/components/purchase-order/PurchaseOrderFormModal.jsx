import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Package, Minus } from 'lucide-react';
import Modal from '../ui/Modal';
import api from '../../api/axios';
import useFormDraft from '../../hooks/useFormDraft';
import DraftRecoveryBanner from '../common/DraftRecoveryBanner';

const inputClass =
  'w-full px-3 py-2.5 bg-theme-primary border border-theme rounded-lg text-sm text-theme-primary placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 transition-all';
const labelClass = 'block text-sm font-medium text-theme-secondary mb-1';
const sectionHeadClass =
  'text-xs font-semibold text-accent-gold uppercase tracking-wider pb-2 border-b border-theme';

const PurchaseOrderFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  purchaseOrder = null,
  suppliers = [],
  branches = [],
  loading = false,
}) => {
  const isEdit = !!purchaseOrder;

  const defaultPOData = { supplier_id: '', branch_id: '', expected_delivery_date: '', notes: '', items: [] };
  const [formData, setFormData] = useState(defaultPOData);

  const [errors, setErrors] = useState({});

  const draftKey = isEdit ? `po_edit_${purchaseOrder?.id}` : 'po_create';
  const { draftData, hasDraft, applyDraft, dismissDraft, saveDraft, clearDraft } = useFormDraft(draftKey, {
    label: isEdit ? `Edit PO #${purchaseOrder?.po_number || purchaseOrder?.id}` : 'New Purchase Order',
    entityType: 'purchase_order',
    initialData: defaultPOData,
    isOpen,
  });

  useEffect(() => { saveDraft(formData); }, [formData, saveDraft]);

  const handleRestoreDraft = () => {
    if (draftData) {
      const { _savedAt, ...rest } = draftData;
      setFormData(prev => ({ ...prev, ...rest }));
      applyDraft();
    }
  };

  // Product search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Reset on open/close
  useEffect(() => {
    if (isOpen) {
      if (purchaseOrder) {
        setFormData({
          supplier_id: purchaseOrder.supplier_id || '',
          branch_id:   purchaseOrder.branch_id   || '',
          expected_delivery_date: purchaseOrder.expected_delivery_date?.split('T')[0] || '',
          notes: purchaseOrder.notes || '',
          items: (purchaseOrder.items || []).map(i => ({
            product_id:   i.product_id,
            product_name: i.product_name,
            product_code: i.product_code,
            variant_id:   i.variant_id   || null,
            variant_name: i.variant_name || null,
            quantity_ordered: i.quantity_ordered || 1,
            unit_price:       i.unit_price       || 0,
          })),
        });
      } else {
        setFormData({ supplier_id: '', branch_id: '', expected_delivery_date: '', notes: '', items: [] });
      }
      setSearchQuery('');
      setSearchResults([]);
      setErrors({});
    }
  }, [isOpen, purchaseOrder]);

  // Debounced product search
  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get('/products', { params: { search: searchQuery, limit: 10, is_active: true } });
        setSearchResults(res.data?.products || []);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleAddProduct = (product) => {
    const existing = formData.items.findIndex(i => i.product_id === product.id && !i.variant_id);
    if (existing >= 0) {
      const updated = [...formData.items];
      updated[existing].quantity_ordered += 1;
      setFormData(prev => ({ ...prev, items: updated }));
    } else {
      setFormData(prev => ({
        ...prev,
        items: [
          ...prev.items,
          {
            product_id:      product.id,
            product_name:    product.product_name,
            product_code:    product.product_code,
            variant_id:      null,
            variant_name:    null,
            quantity_ordered: 1,
            unit_price:      parseFloat(product.effective_cost_price || product.cost_price || product.purchase_price || 0),
          },
        ],
      }));
    }
    if (errors.items) setErrors(prev => ({ ...prev, items: null }));
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleUpdateItem = (index, field, value) => {
    const updated = [...formData.items];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, items: updated }));
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.supplier_id) errs.supplier_id = 'Supplier is required';
    if (!formData.branch_id)   errs.branch_id   = 'Branch is required';
    if (formData.items.length === 0) errs.items  = 'Add at least one item';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    clearDraft();
    onSubmit({
      supplier_id:            formData.supplier_id,
      branch_id:              formData.branch_id,
      expected_delivery_date: formData.expected_delivery_date || undefined,
      notes:                  formData.notes || undefined,
      items: formData.items.map(i => ({
        product_id:      i.product_id,
        variant_id:      i.variant_id || null,
        product_name:    i.product_name,
        quantity_ordered: parseInt(i.quantity_ordered) || 1,
        unit_price:      parseFloat(i.unit_price)      || 0,
      })),
    });
  };

  const subtotal    = formData.items.reduce((s, i) => s + (i.quantity_ordered * i.unit_price), 0);
  const totalUnits  = formData.items.reduce((s, i) => s + (parseInt(i.quantity_ordered) || 0), 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Purchase Order' : 'Create Purchase Order'}
      subtitle={isEdit ? `Editing ${purchaseOrder.po_number}` : 'Place a new order with a supplier'}
      size="xl"
      footer={
        <div className="flex items-center gap-3">
          <button type="button" onClick={onClose} disabled={loading}
            className="px-4 py-2 text-sm font-medium text-theme-secondary bg-theme-primary hover:bg-theme-tertiary border border-theme rounded-lg transition-colors">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={loading || formData.items.length === 0}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-accent-gold rounded-lg hover:bg-accent-goldDark transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {loading && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            {isEdit ? 'Update Purchase Order' : 'Create Purchase Order'}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <DraftRecoveryBanner
          visible={hasDraft}
          label={isEdit ? `Edit PO #${purchaseOrder?.po_number || purchaseOrder?.id}` : 'New Purchase Order'}
          updatedAt={draftData?._savedAt}
          onRestore={handleRestoreDraft}
          onDiscard={dismissDraft}
        />

        {/* ── Basic Info ── */}
        <div className="space-y-4">
          <h3 className={sectionHeadClass}>Order Details</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Supplier <span className="text-red-500">*</span></label>
              <select value={formData.supplier_id} onChange={e => handleChange('supplier_id', e.target.value)}
                className={`${inputClass} ${errors.supplier_id ? 'border-red-500/60' : ''}`}>
                <option value="">Select Supplier...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.supplier_name}</option>)}
              </select>
              {errors.supplier_id && <p className="mt-1 text-xs text-red-500">{errors.supplier_id}</p>}
            </div>

            <div>
              <label className={labelClass}>Destination Branch <span className="text-red-500">*</span></label>
              <select value={formData.branch_id} onChange={e => handleChange('branch_id', e.target.value)}
                className={`${inputClass} ${errors.branch_id ? 'border-red-500/60' : ''}`}>
                <option value="">Select Branch...</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}{b.main_branch ? ' (Main)' : ''}</option>)}
              </select>
              {errors.branch_id && <p className="mt-1 text-xs text-red-500">{errors.branch_id}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Expected Delivery Date</label>
              <input type="date" value={formData.expected_delivery_date}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => handleChange('expected_delivery_date', e.target.value)}
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Notes</label>
              <input type="text" value={formData.notes} placeholder="Optional order notes..."
                onChange={e => handleChange('notes', e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        {/* ── Product Search ── */}
        <div className="space-y-3">
          <h3 className={sectionHeadClass}>
            Add Products
            {errors.items && <span className="text-red-500 text-xs normal-case font-normal ml-2">{errors.items}</span>}
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
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-accent-gold" />
            </div>
          ) : searchResults.length > 0 ? (
            <div className="border border-theme rounded-lg divide-y divide-theme max-h-48 overflow-y-auto">
              {searchResults.map(product => (
                <div key={product.id} className="flex items-center justify-between p-3 hover:bg-theme-tertiary transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-theme-primary truncate">{product.product_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-accent-gold/10 text-accent-gold border border-accent-gold/20">
                        {product.product_code}
                      </span>
                      {(product.effective_cost_price || product.cost_price) && (
                        <span className="text-xs text-theme-muted">Cost: ${parseFloat(product.effective_cost_price || product.cost_price).toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddProduct(product)}
                    className="ml-3 flex items-center gap-1 px-2.5 py-1.5 bg-accent-gold text-white text-xs font-medium rounded-lg hover:bg-accent-goldDark transition-colors flex-shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              ))}
            </div>
          ) : searchQuery.length >= 2 ? (
            <div className="text-center py-6 text-theme-muted">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No products found for "{searchQuery}"</p>
            </div>
          ) : null}
        </div>

        {/* ── Items Table ── */}
        {formData.items.length > 0 && (
          <div className="space-y-2">
            <h3 className={sectionHeadClass}>Order Items ({formData.items.length})</h3>
            <div className="border border-theme rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-theme-tertiary border-b border-theme">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-theme-muted uppercase">Product</th>
                    <th className="px-4 py-2.5 text-center text-xs font-medium text-theme-muted uppercase">Qty</th>
                    <th className="px-4 py-2.5 text-center text-xs font-medium text-theme-muted uppercase">Unit Price</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-theme-muted uppercase">Total</th>
                    <th className="px-4 py-2.5 w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme">
                  {formData.items.map((item, index) => (
                    <tr key={index} className="hover:bg-theme-tertiary/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-theme-primary text-sm">{item.product_name}</p>
                        {item.product_code && <p className="text-xs font-mono text-theme-muted">{item.product_code}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => handleUpdateItem(index, 'quantity_ordered', Math.max(1, item.quantity_ordered - 1))}
                            className="w-6 h-6 flex items-center justify-center border border-theme rounded hover:bg-theme-secondary transition-colors">
                            <Minus className="w-3 h-3 text-theme-secondary" />
                          </button>
                          <input type="number" min="1" value={item.quantity_ordered}
                            onChange={e => handleUpdateItem(index, 'quantity_ordered', parseInt(e.target.value) || 1)}
                            className="w-14 px-1 py-1 text-center border border-theme bg-theme-primary text-theme-primary rounded text-sm focus:outline-none focus:ring-1 focus:ring-accent-gold/30" />
                          <button onClick={() => handleUpdateItem(index, 'quantity_ordered', item.quantity_ordered + 1)}
                            className="w-6 h-6 flex items-center justify-center border border-theme rounded hover:bg-theme-secondary transition-colors">
                            <Plus className="w-3 h-3 text-theme-secondary" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" min="0" step="0.01" value={item.unit_price}
                          onChange={e => handleUpdateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 text-center border border-theme bg-theme-primary text-theme-primary rounded text-sm focus:outline-none focus:ring-1 focus:ring-accent-gold/30 mx-auto block" />
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-theme-primary">
                        ${(item.quantity_ordered * item.unit_price).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => handleRemoveItem(index)}
                          className="p-1 text-theme-muted hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-theme-tertiary border-t-2 border-theme">
                  <tr>
                    <td className="px-4 py-3 font-semibold text-theme-secondary text-sm">Totals</td>
                    <td className="px-4 py-3 text-center font-bold text-theme-primary">{totalUnits} units</td>
                    <td />
                    <td className="px-4 py-3 text-right font-bold text-accent-gold text-lg">${subtotal.toFixed(2)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PurchaseOrderFormModal;
