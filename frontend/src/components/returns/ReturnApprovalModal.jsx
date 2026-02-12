import React, { useState } from 'react';
import { Check, X, AlertCircle, Package, DollarSign, FileText } from 'lucide-react';
import { Modal, Button, Badge } from '../ui';

/**
 * ReturnApprovalModal Component
 * Approve or reject return/exchange requests
 */
const ReturnApprovalModal = ({
  isOpen,
  onClose,
  onApprove,
  onReject,
  returnData,
  loading = false,
}) => {
  const [action, setAction] = useState(null); // 'approve' or 'reject'
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});

  if (!returnData) return null;

  const {
    return_number,
    sale_number,
    return_type,
    reason,
    notes: return_notes,
    total_amount,
    total_items,
    customer_name,
    created_at,
    created_by_name,
    items = [],
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

  const validate = () => {
    const newErrors = {};

    if (!action) {
      newErrors.action = 'Please select approve or reject';
    }

    if (action === 'reject' && !notes.trim()) {
      newErrors.notes = 'Rejection reason is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    if (action === 'approve') {
      onApprove({
        return_id: returnData.id,
        approval_notes: notes,
      });
    } else if (action === 'reject') {
      onReject({
        return_id: returnData.id,
        rejection_reason: notes,
      });
    }
  };

  const resetForm = () => {
    setAction(null);
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
      title="Review Return Request"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={loading}
            variant={action === 'approve' ? 'primary' : action === 'reject' ? 'danger' : 'outline'}
            disabled={!action}
          >
            {action === 'approve' ? 'Approve Return' : action === 'reject' ? 'Reject Return' : 'Select Action'}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Return Information */}
        <div className={`p-4 ${typeInfo.bgColor} border border-gray-200 rounded-lg`}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 ${typeInfo.bgColor} rounded-lg flex items-center justify-center`}>
                <TypeIcon className={`w-6 h-6 ${typeInfo.color}`} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{return_number}</h3>
                <p className="text-sm text-gray-600">Sale: {sale_number}</p>
              </div>
            </div>
            <Badge variant="primary">{typeInfo.label}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Customer:</span>
              <span className="ml-2 font-medium text-gray-900">
                {customer_name || 'Walk-in Customer'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Return Amount:</span>
              <span className={`ml-2 font-bold text-lg ${typeInfo.color}`}>
                ${parseFloat(total_amount || 0).toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Total Items:</span>
              <span className="ml-2 font-medium text-gray-900">{total_items}</span>
            </div>
            <div>
              <span className="text-gray-600">Created:</span>
              <span className="ml-2 font-medium text-gray-900">
                {new Date(created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Return Reason */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Return Reason
          </h3>
          <div className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <FileText className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">{reason}</p>
              {return_notes && (
                <p className="text-sm text-gray-600 mt-1">{return_notes}</p>
              )}
              {created_by_name && (
                <p className="text-xs text-gray-500 mt-2">
                  Created by: {created_by_name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Items to Return */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Items to Return ({items.length})
          </h3>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Product</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Reason</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
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
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.return_reason || '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      ${parseFloat(item.quantity * item.unit_price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                <tr>
                  <td colSpan="3" className="px-4 py-3 text-right font-semibold text-gray-900">
                    Total Return Amount:
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900 text-lg">
                    ${parseFloat(total_amount || 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Decision Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Decision <span className="text-red-500">*</span>
          </h3>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setAction('approve');
                setErrors({});
              }}
              className={`p-4 rounded-lg border-2 transition-all ${
                action === 'approve'
                  ? 'border-green-600 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Check className={`w-6 h-6 mx-auto mb-2 ${
                action === 'approve' ? 'text-green-600' : 'text-gray-400'
              }`} />
              <p className={`font-medium ${
                action === 'approve' ? 'text-green-900' : 'text-gray-900'
              }`}>
                Approve Return
              </p>
              <p className="text-xs text-gray-600 mt-1">Accept and process this return</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setAction('reject');
                setErrors({});
              }}
              className={`p-4 rounded-lg border-2 transition-all ${
                action === 'reject'
                  ? 'border-red-600 bg-red-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <X className={`w-6 h-6 mx-auto mb-2 ${
                action === 'reject' ? 'text-red-600' : 'text-gray-400'
              }`} />
              <p className={`font-medium ${
                action === 'reject' ? 'text-red-900' : 'text-gray-900'
              }`}>
                Reject Return
              </p>
              <p className="text-xs text-gray-600 mt-1">Decline this return request</p>
            </button>
          </div>

          {errors.action && (
            <p className="text-xs text-red-600">{errors.action}</p>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {action === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason'}
              {action === 'reject' && <span className="text-red-500"> *</span>}
            </label>
            <textarea
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                if (errors.notes) {
                  setErrors({ ...errors, notes: null });
                }
              }}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.notes ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={
                action === 'approve'
                  ? 'Optional notes about the approval...'
                  : action === 'reject'
                  ? 'Explain why this return is being rejected...'
                  : 'Select an action first...'
              }
              disabled={!action}
            />
            {errors.notes && (
              <p className="text-xs text-red-600">{errors.notes}</p>
            )}
          </div>
        </div>

        {/* Warning */}
        {action === 'approve' && return_type === 'exchange' && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              After approval, you'll need to process this exchange by selecting replacement items for the customer.
            </p>
          </div>
        )}

        {action === 'reject' && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">
              Rejecting this return will mark it as declined. The customer will be notified of the rejection.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ReturnApprovalModal;
