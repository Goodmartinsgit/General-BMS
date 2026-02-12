import React, { useState } from 'react';
import { Package, DollarSign, Check, AlertCircle, Warehouse, CreditCard } from 'lucide-react';
import { Modal, Button, Badge } from '../ui';

/**
 * ReturnProcessModal Component
 * Process approved return - restock items and issue refund/prepare exchange
 */
const ReturnProcessModal = ({
  isOpen,
  onClose,
  onProcess,
  returnData,
  branches = [],
  loading = false,
}) => {
  const [restockBranchId, setRestockBranchId] = useState('');
  const [refundMethod, setRefundMethod] = useState(''); // cash, card, credit_note
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});

  if (!returnData) return null;

  const {
    return_number,
    sale_number,
    return_type,
    total_amount,
    total_items,
    customer_name,
    items = [],
    approved_at,
    approved_by_name,
  } = returnData;

  const typeConfig = {
    refund: {
      icon: DollarSign,
      label: 'Refund',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    exchange: {
      icon: Package,
      label: 'Exchange',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  };

  const typeInfo = typeConfig[return_type] || typeConfig.refund;
  const TypeIcon = typeInfo.icon;

  const refundMethods = [
    {
      value: 'cash',
      label: 'Cash',
      icon: DollarSign,
      description: 'Refund in cash',
    },
    {
      value: 'card',
      label: 'Card',
      icon: CreditCard,
      description: 'Refund to original payment card',
    },
    {
      value: 'credit_note',
      label: 'Store Credit',
      icon: Package,
      description: 'Issue store credit note',
    },
  ];

  const validate = () => {
    const newErrors = {};

    if (!restockBranchId) {
      newErrors.restockBranchId = 'Please select a branch for restocking';
    }

    if (return_type === 'refund' && !refundMethod) {
      newErrors.refundMethod = 'Please select a refund method';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const processData = {
      return_id: returnData.id,
      restock_branch_id: restockBranchId,
      processing_notes: notes,
    };

    if (return_type === 'refund') {
      processData.refund_method = refundMethod;
    }

    onProcess(processData);
  };

  const resetForm = () => {
    setRestockBranchId('');
    setRefundMethod('');
    setNotes('');
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Process Return"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading} variant="primary">
            Complete Processing
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Return Information */}
        <div className={`p-4 ${typeInfo.bgColor} border border-gray-200 rounded-lg`}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-gray-900">{return_number}</h3>
              <p className="text-sm text-gray-600">Sale: {sale_number}</p>
              <p className="text-sm text-gray-600">
                Customer: {customer_name || 'Walk-in Customer'}
              </p>
            </div>
            <Badge variant="primary">{typeInfo.label}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Return Amount:</span>
              <span className={`ml-2 font-bold text-lg ${typeInfo.color}`}>
                ${parseFloat(total_amount || 0).toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Approved:</span>
              <span className="ml-2 font-medium text-gray-900">
                {new Date(approved_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Items Summary */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Items to Restock ({items.length})
          </h3>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Product</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Qty</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{item.product_name}</p>
                        {item.variant_name && (
                          <p className="text-xs text-gray-500">{item.variant_name}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      ${parseFloat(item.quantity * item.unit_price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Restock Branch Selection */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Restock Location <span className="text-red-500">*</span>
          </h3>
          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-3">
            <Warehouse className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">
              Returned items will be added back to the selected branch's inventory. Choose the branch where items will be physically stored.
            </p>
          </div>

          <div className="space-y-1">
            <select
              value={restockBranchId}
              onChange={(e) => {
                setRestockBranchId(e.target.value);
                if (errors.restockBranchId) {
                  setErrors({ ...errors, restockBranchId: null });
                }
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.restockBranchId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select branch for restocking...</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.branch_name}
                  {branch.main_branch && ' (Main Branch)'}
                </option>
              ))}
            </select>
            {errors.restockBranchId && (
              <p className="text-xs text-red-600">{errors.restockBranchId}</p>
            )}
          </div>
        </div>

        {/* Refund Method (only for refunds) */}
        {return_type === 'refund' && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Refund Method <span className="text-red-500">*</span>
            </h3>

            <div className="grid grid-cols-3 gap-3">
              {refundMethods.map((method) => {
                const MethodIcon = method.icon;
                const isSelected = refundMethod === method.value;

                return (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => {
                      setRefundMethod(method.value);
                      if (errors.refundMethod) {
                        setErrors({ ...errors, refundMethod: null });
                      }
                    }}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <MethodIcon className={`w-6 h-6 mx-auto mb-2 ${
                      isSelected ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <p className={`font-medium text-sm ${
                      isSelected ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {method.label}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">{method.description}</p>
                  </button>
                );
              })}
            </div>

            {errors.refundMethod && (
              <p className="text-xs text-red-600">{errors.refundMethod}</p>
            )}
          </div>
        )}

        {/* Processing Notes */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Processing Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Any notes about the processing (condition of returned items, etc.)..."
          />
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            {return_type === 'refund' ? (
              <div>
                <p className="font-semibold mb-1">Processing this return will:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Add returned items back to the selected branch inventory</li>
                  <li>Issue refund of ${parseFloat(total_amount || 0).toFixed(2)} via {refundMethod ? refundMethods.find(m => m.value === refundMethod)?.label : 'selected method'}</li>
                  <li>Mark this return as completed</li>
                  <li>Update all financial records</li>
                </ul>
              </div>
            ) : (
              <div>
                <p className="font-semibold mb-1">Processing this exchange will:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Add returned items back to the selected branch inventory</li>
                  <li>Allow you to select replacement items for the customer</li>
                  <li>Calculate any price difference</li>
                  <li>Mark this exchange as completed</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ReturnProcessModal;
