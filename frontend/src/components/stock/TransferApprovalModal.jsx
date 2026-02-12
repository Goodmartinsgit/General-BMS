import React, { useState } from 'react';
import { Check, X, TruckIcon, AlertCircle, Warehouse, ArrowRight } from 'lucide-react';
import { Modal, Button, Badge } from '../ui';

/**
 * TransferApprovalModal Component
 * Approve, reject, or complete stock transfers
 */
const TransferApprovalModal = ({
  isOpen,
  onClose,
  onApprove,
  onReject,
  onComplete,
  transferData,
  mode = 'approval', // 'approval' or 'completion'
  loading = false,
}) => {
  const [action, setAction] = useState(null); // 'approve', 'reject', 'complete'
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});

  if (!transferData) return null;

  const {
    transfer_number,
    from_branch_name,
    to_branch_name,
    transfer_reason,
    notes: transfer_notes,
    total_items,
    total_quantity,
    created_at,
    created_by_name,
    approved_at,
    approved_by_name,
    items = [],
  } = transferData;

  const validate = () => {
    const newErrors = {};

    if (!action) {
      newErrors.action = 'Please select an action';
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
        transfer_id: transferData.id,
        approval_notes: notes,
      });
    } else if (action === 'reject') {
      onReject({
        transfer_id: transferData.id,
        rejection_reason: notes,
      });
    } else if (action === 'complete') {
      onComplete({
        transfer_id: transferData.id,
        completion_notes: notes,
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

  const isApprovalMode = mode === 'approval';
  const isCompletionMode = mode === 'completion';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isApprovalMode ? 'Review Stock Transfer' : 'Complete Stock Transfer'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={loading}
            variant={
              action === 'approve' || action === 'complete'
                ? 'primary'
                : action === 'reject'
                ? 'danger'
                : 'outline'
            }
            disabled={!action}
          >
            {action === 'approve'
              ? 'Approve Transfer'
              : action === 'reject'
              ? 'Reject Transfer'
              : action === 'complete'
              ? 'Complete Transfer'
              : 'Select Action'}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Transfer Information */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-gray-900">{transfer_number}</h3>
              <p className="text-sm text-gray-600">{transfer_reason}</p>
            </div>
            <Badge variant="info">Transfer</Badge>
          </div>

          {/* Branch Route Visual */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 text-center p-2 bg-white rounded">
              <Warehouse className="w-5 h-5 mx-auto mb-1 text-gray-600" />
              <p className="text-sm font-medium text-gray-900">{from_branch_name}</p>
              <p className="text-xs text-gray-500">Source</p>
            </div>
            <ArrowRight className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div className="flex-1 text-center p-2 bg-white rounded">
              <Warehouse className="w-5 h-5 mx-auto mb-1 text-green-600" />
              <p className="text-sm font-medium text-gray-900">{to_branch_name}</p>
              <p className="text-xs text-gray-500">Destination</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Quantity:</span>
              <span className="ml-2 font-bold text-lg text-blue-600">
                {total_quantity} units
              </span>
            </div>
            <div>
              <span className="text-gray-600">Products:</span>
              <span className="ml-2 font-medium text-gray-900">{total_items}</span>
            </div>
            <div>
              <span className="text-gray-600">Created:</span>
              <span className="ml-2 font-medium text-gray-900">
                {new Date(created_at).toLocaleDateString()}
              </span>
            </div>
            {approved_at && (
              <div>
                <span className="text-gray-600">Approved:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {new Date(approved_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {transfer_notes && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Notes:</span> {transfer_notes}
              </p>
            </div>
          )}
        </div>

        {/* Items to Transfer */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Items to Transfer ({items.length})
          </h3>
          <div className="border border-gray-200 rounded-lg overflow-hidden max-h-80 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Product</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Quantity</th>
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
                    <td className="px-4 py-3 text-center font-bold text-blue-600">
                      {item.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                <tr>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    Total Units:
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-gray-900 text-lg">
                    {total_quantity}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Action Selection */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Action <span className="text-red-500">*</span>
          </h3>

          {/* Action Buttons */}
          {isApprovalMode ? (
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
                <Check
                  className={`w-6 h-6 mx-auto mb-2 ${
                    action === 'approve' ? 'text-green-600' : 'text-gray-400'
                  }`}
                />
                <p
                  className={`font-medium ${
                    action === 'approve' ? 'text-green-900' : 'text-gray-900'
                  }`}
                >
                  Approve Transfer
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Allow transfer to proceed
                </p>
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
                <X
                  className={`w-6 h-6 mx-auto mb-2 ${
                    action === 'reject' ? 'text-red-600' : 'text-gray-400'
                  }`}
                />
                <p
                  className={`font-medium ${
                    action === 'reject' ? 'text-red-900' : 'text-gray-900'
                  }`}
                >
                  Reject Transfer
                </p>
                <p className="text-xs text-gray-600 mt-1">Cancel this transfer</p>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setAction('complete');
                setErrors({});
              }}
              className={`w-full p-4 rounded-lg border-2 transition-all ${
                action === 'complete'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <TruckIcon
                className={`w-6 h-6 mx-auto mb-2 ${
                  action === 'complete' ? 'text-blue-600' : 'text-gray-400'
                }`}
              />
              <p
                className={`font-medium ${
                  action === 'complete' ? 'text-blue-900' : 'text-gray-900'
                }`}
              >
                Complete Transfer
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Move stock from {from_branch_name} to {to_branch_name}
              </p>
            </button>
          )}

          {errors.action && <p className="text-xs text-red-600">{errors.action}</p>}

          {/* Notes */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {action === 'approve'
                ? 'Approval Notes (Optional)'
                : action === 'reject'
                ? 'Rejection Reason'
                : action === 'complete'
                ? 'Completion Notes (Optional)'
                : 'Notes'}
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
                  ? 'Explain why this transfer is being rejected...'
                  : action === 'complete'
                  ? 'Optional notes about the completion...'
                  : 'Select an action first...'
              }
              disabled={!action}
            />
            {errors.notes && <p className="text-xs text-red-600">{errors.notes}</p>}
          </div>
        </div>

        {/* Warning/Info */}
        {action === 'approve' && (
          <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800">
              Approving this transfer will allow it to be completed. Stock will be moved when the
              transfer is marked as complete.
            </p>
          </div>
        )}

        {action === 'reject' && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">
              Rejecting this transfer will cancel it permanently. No stock will be moved.
            </p>
          </div>
        )}

        {action === 'complete' && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Completing this transfer will:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  Reduce stock at <span className="font-bold">{from_branch_name}</span> by{' '}
                  {total_quantity} units
                </li>
                <li>
                  Increase stock at <span className="font-bold">{to_branch_name}</span> by{' '}
                  {total_quantity} units
                </li>
                <li>Mark this transfer as completed</li>
                <li>Update inventory records</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TransferApprovalModal;
