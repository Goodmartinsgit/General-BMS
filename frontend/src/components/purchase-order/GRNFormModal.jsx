import React, { useState, useEffect } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';
import { Modal, Input, Button, Badge } from '../ui';

/**
 * GRNFormModal Component
 * Form modal for creating Goods Received Notes (GRN)
 */
const GRNFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  purchaseOrder,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    received_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    notes: '',
    items: [], // { po_item_id, quantity_received, quality_status, quality_notes }
  });

  const [errors, setErrors] = useState({});

  // Initialize items from purchase order
  useEffect(() => {
    if (purchaseOrder?.items) {
      const items = purchaseOrder.items.map((item) => ({
        po_item_id: item.id,
        product_name: item.product_name,
        variant_name: item.variant_name,
        ordered_quantity: item.quantity,
        received_so_far: item.received_quantity || 0,
        pending_quantity: item.quantity - (item.received_quantity || 0),
        quantity_received: 0,
        quality_status: 'approved',
        quality_notes: '',
      }));

      setFormData((prev) => ({ ...prev, items }));
    }
  }, [purchaseOrder]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleUpdateItem = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setFormData((prev) => ({ ...prev, items: updatedItems }));
  };

  const handleReceiveAll = () => {
    const updatedItems = formData.items.map((item) => ({
      ...item,
      quantity_received: item.pending_quantity,
    }));
    setFormData((prev) => ({ ...prev, items: updatedItems }));
  };

  const validate = () => {
    const newErrors = {};

    const totalReceived = formData.items.reduce(
      (sum, item) => sum + parseInt(item.quantity_received || 0),
      0
    );

    if (totalReceived === 0) {
      newErrors.items = 'At least one item must be received';
    }

    // Check for over-receiving
    const hasOverReceiving = formData.items.some(
      (item) =>
        parseInt(item.quantity_received || 0) > item.pending_quantity
    );

    if (hasOverReceiving) {
      newErrors.items = 'Cannot receive more than pending quantity';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      // Filter out items with zero quantity received
      const itemsToSubmit = formData.items
        .filter((item) => parseInt(item.quantity_received || 0) > 0)
        .map((item) => ({
          po_item_id: item.po_item_id,
          quantity_received: parseInt(item.quantity_received),
          quality_status: item.quality_status,
          quality_notes: item.quality_notes,
        }));

      onSubmit({
        ...formData,
        items: itemsToSubmit,
      });
    }
  };

  const qualityStatuses = [
    { value: 'approved', label: 'Approved', color: 'success' },
    { value: 'rejected', label: 'Rejected', color: 'danger' },
    { value: 'pending_review', label: 'Pending Review', color: 'warning' },
  ];

  const totalReceived = formData.items.reduce(
    (sum, item) => sum + parseInt(item.quantity_received || 0),
    0
  );

  const totalPending = formData.items.reduce(
    (sum, item) => sum + item.pending_quantity,
    0
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Receive Goods - ${purchaseOrder?.po_number || ''}`}
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            Create GRN
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* GRN Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            GRN Information
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Received Date"
              type="date"
              value={formData.received_date}
              onChange={(e) => handleChange('received_date', e.target.value)}
              required
              max={new Date().toISOString().split('T')[0]}
            />

            <Input
              label="Reference Number"
              value={formData.reference_number}
              onChange={(e) => handleChange('reference_number', e.target.value)}
              placeholder="Optional invoice/delivery reference"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional notes about this delivery"
            />
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Pending</p>
            <p className="text-2xl font-bold text-gray-900">{totalPending}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Receiving Now</p>
            <p className="text-2xl font-bold text-blue-600">{totalReceived}</p>
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReceiveAll}
              className="w-full"
            >
              Receive All
            </Button>
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Receiving Items {errors.items && <span className="text-red-500 text-xs normal-case">({errors.items})</span>}
            </h3>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Product</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Ordered</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Received</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Pending</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Receive Now</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Quality</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {formData.items.map((item, index) => {
                  const receivingQty = parseInt(item.quantity_received || 0);
                  const isOverReceiving = receivingQty > item.pending_quantity;

                  return (
                    <tr key={index} className={`${isOverReceiving ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{item.product_name}</p>
                          {item.variant_name && (
                            <p className="text-xs text-gray-500">{item.variant_name}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-gray-900">
                        {item.ordered_quantity}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {item.received_so_far}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={item.pending_quantity > 0 ? 'warning' : 'success'}>
                          {item.pending_quantity}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          max={item.pending_quantity}
                          value={item.quantity_received}
                          onChange={(e) =>
                            handleUpdateItem(index, 'quantity_received', e.target.value)
                          }
                          className={`w-20 px-2 py-1 text-center border rounded focus:outline-none focus:ring-2 ${
                            isOverReceiving
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-blue-500'
                          }`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={item.quality_status}
                          onChange={(e) =>
                            handleUpdateItem(index, 'quality_status', e.target.value)
                          }
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={receivingQty === 0}
                        >
                          {qualityStatuses.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={item.quality_notes}
                          onChange={(e) =>
                            handleUpdateItem(index, 'quality_notes', e.target.value)
                          }
                          placeholder="Optional notes"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={receivingQty === 0}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Quality Status Legend */}
          <div className="flex items-center gap-4 text-xs">
            <span className="font-medium text-gray-700">Quality Status:</span>
            {qualityStatuses.map((status) => (
              <div key={status.value} className="flex items-center gap-1">
                <Badge variant={status.color} size="sm">
                  {status.label}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Warning for partial receiving */}
        {totalReceived < totalPending && totalReceived > 0 && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Partial Delivery</p>
              <p className="text-sm text-yellow-700">
                You are receiving {totalReceived} out of {totalPending} pending items. The purchase order status will be set to "Partially Received".
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default GRNFormModal;
