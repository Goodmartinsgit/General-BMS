import React, { useState, useEffect } from 'react';
import { AlertCircle, Truck } from 'lucide-react';
import Modal from '../ui/Modal';

const inputClass =
  'w-full px-3 py-2.5 bg-theme-primary border border-theme rounded-lg text-sm text-theme-primary placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 transition-all';
const labelClass = 'block text-sm font-medium text-theme-secondary mb-1';
const sectionHeadClass =
  'text-xs font-semibold text-accent-gold uppercase tracking-wider pb-2 border-b border-theme';

const QUALITY_STATUSES = [
  { value: 'approved',       label: 'Approved' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'rejected',       label: 'Rejected' },
];

const GRNFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  purchaseOrder,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    notes: '',
    quality_check_status: 'passed',
    items: [],
  });
  const [errors, setErrors] = useState({});

  // Init items from PO whenever modal opens or PO changes
  useEffect(() => {
    if (isOpen && purchaseOrder?.items) {
      setFormData({
        notes: '',
        quality_check_status: 'passed',
        items: purchaseOrder.items.map(item => ({
          po_item_id:       item.id,
          product_name:     item.product_name,
          variant_name:     item.variant_name || null,
          ordered_quantity: item.quantity_ordered || 0,
          received_so_far:  item.quantity_received || 0,
          pending_quantity: (item.quantity_ordered || 0) - (item.quantity_received || 0),
          quantity_received: 0,
          quality_status:   'approved',
          quality_notes:    '',
        })),
      });
      setErrors({});
    }
  }, [isOpen, purchaseOrder]);

  const handleUpdateItem = (index, field, value) => {
    const updated = [...formData.items];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, items: updated }));
  };

  const handleReceiveAll = () => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => ({ ...item, quantity_received: item.pending_quantity })),
    }));
  };

  const validate = () => {
    const errs = {};
    const totalReceived = formData.items.reduce((s, i) => s + parseInt(i.quantity_received || 0), 0);
    if (totalReceived === 0) errs.items = 'At least one item must be received';
    const overReceiving = formData.items.some(i => parseInt(i.quantity_received || 0) > i.pending_quantity);
    if (overReceiving) errs.items = 'Cannot receive more than pending quantity';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const received_items = formData.items
      .filter(i => parseInt(i.quantity_received || 0) > 0)
      .map(i => ({
        po_item_id:        i.po_item_id,
        quantity_received: parseInt(i.quantity_received),
        quantity_accepted: parseInt(i.quality_status !== 'rejected' ? i.quantity_received : 0),
        quantity_rejected: parseInt(i.quality_status === 'rejected' ? i.quantity_received : 0),
        rejection_reason:  i.quality_notes || undefined,
      }));
    onSubmit({ received_items, quality_check_status: formData.quality_check_status, notes: formData.notes });
  };

  const totalReceived = formData.items.reduce((s, i) => s + parseInt(i.quantity_received || 0), 0);
  const totalPending  = formData.items.reduce((s, i) => s + i.pending_quantity, 0);
  const isPartial     = totalReceived > 0 && totalReceived < totalPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Receive Goods`}
      subtitle={purchaseOrder ? `${purchaseOrder.po_number} — ${purchaseOrder.supplier_name}` : ''}
      size="xl"
      footer={
        <div className="flex items-center gap-3">
          <button type="button" onClick={onClose} disabled={loading}
            className="px-4 py-2 text-sm font-medium text-theme-secondary bg-theme-primary hover:bg-theme-tertiary border border-theme rounded-lg transition-colors">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={loading || totalReceived === 0}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-accent-gold rounded-lg hover:bg-accent-goldDark transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {loading && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            <Truck className="w-4 h-4" />
            Create GRN ({totalReceived} units)
          </button>
        </div>
      }
    >
      <div className="space-y-6">

        {/* ── GRN Info ── */}
        <div className="space-y-4">
          <h3 className={sectionHeadClass}>Receipt Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Notes</label>
              <textarea value={formData.notes} rows={2}
                onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                placeholder="Delivery notes, invoice reference..."
                className={`${inputClass} resize-none`} />
            </div>
            <div>
              <label className={labelClass}>Quality Check Status</label>
              <select value={formData.quality_check_status}
                onChange={e => setFormData(p => ({ ...p, quality_check_status: e.target.value }))}
                className={inputClass}>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
                <option value="partial">Partial</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Summary bar ── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-theme-tertiary border border-theme rounded-lg p-3 text-center">
            <p className="text-xs text-theme-muted mb-1">Total Pending</p>
            <p className="text-2xl font-bold text-theme-primary">{totalPending}</p>
          </div>
          <div className="bg-accent-gold/10 border border-accent-gold/20 rounded-lg p-3 text-center">
            <p className="text-xs text-theme-muted mb-1">Receiving Now</p>
            <p className="text-2xl font-bold text-accent-gold">{totalReceived}</p>
          </div>
          <div className="flex items-center justify-center">
            <button onClick={handleReceiveAll}
              className="w-full py-2 text-sm font-medium text-theme-secondary bg-theme-tertiary border border-theme rounded-lg hover:bg-theme-secondary hover:text-theme-primary transition-colors">
              Receive All
            </button>
          </div>
        </div>

        {/* ── Items ── */}
        <div className="space-y-2">
          <h3 className={sectionHeadClass}>
            Items
            {errors.items && <span className="text-red-500 text-xs normal-case font-normal ml-2">{errors.items}</span>}
          </h3>

          <div className="border border-theme rounded-lg overflow-hidden max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-theme-tertiary border-b border-theme sticky top-0">
                <tr>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-theme-muted uppercase">Product</th>
                  <th className="px-3 py-2.5 text-center text-xs font-medium text-theme-muted uppercase">Ordered</th>
                  <th className="px-3 py-2.5 text-center text-xs font-medium text-theme-muted uppercase">Done</th>
                  <th className="px-3 py-2.5 text-center text-xs font-medium text-theme-muted uppercase">Pending</th>
                  <th className="px-3 py-2.5 text-center text-xs font-medium text-theme-muted uppercase">Receive</th>
                  <th className="px-3 py-2.5 text-center text-xs font-medium text-theme-muted uppercase">Quality</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme">
                {formData.items.map((item, index) => {
                  const qty = parseInt(item.quantity_received || 0);
                  const isOver = qty > item.pending_quantity;
                  return (
                    <tr key={index} className={isOver ? 'bg-red-500/5' : 'hover:bg-theme-tertiary/50'}>
                      <td className="px-3 py-3">
                        <p className="font-medium text-theme-primary">{item.product_name}</p>
                        {item.variant_name && <p className="text-xs text-theme-muted">{item.variant_name}</p>}
                      </td>
                      <td className="px-3 py-3 text-center text-theme-primary font-medium">{item.ordered_quantity}</td>
                      <td className="px-3 py-3 text-center text-theme-secondary">{item.received_so_far}</td>
                      <td className="px-3 py-3 text-center">
                        <span className={`font-semibold ${item.pending_quantity > 0 ? 'text-yellow-500' : 'text-green-500'}`}>
                          {item.pending_quantity}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          min="0"
                          max={item.pending_quantity}
                          value={item.quantity_received}
                          onChange={e => handleUpdateItem(index, 'quantity_received', e.target.value)}
                          className={`w-16 px-2 py-1 text-center border rounded text-sm focus:outline-none focus:ring-1 mx-auto block bg-theme-primary text-theme-primary ${
                            isOver ? 'border-red-500 focus:ring-red-500/30' : 'border-theme focus:ring-accent-gold/30'
                          }`}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <select
                          value={item.quality_status}
                          disabled={qty === 0}
                          onChange={e => handleUpdateItem(index, 'quality_status', e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-theme bg-theme-primary text-theme-primary rounded focus:outline-none focus:ring-1 focus:ring-accent-gold/30 disabled:opacity-40"
                        >
                          {QUALITY_STATUSES.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Partial warning */}
        {isPartial && (
          <div className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-500">Partial Delivery</p>
              <p className="text-xs text-theme-secondary mt-0.5">
                You are receiving {totalReceived} of {totalPending} pending units.
                The purchase order status will be set to "Partially Received".
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default GRNFormModal;
