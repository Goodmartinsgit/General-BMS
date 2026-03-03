import React, { useState } from 'react';
import { Check, X, TruckIcon, AlertCircle, Warehouse, ArrowRight } from 'lucide-react';
import Modal from '../ui/Modal';

const inputClass =
  'w-full px-3 py-2.5 bg-theme-primary border border-theme rounded-lg text-sm text-theme-primary placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 transition-all resize-none';

const TransferApprovalModal = ({
  isOpen,
  onClose,
  onApprove,
  onReject,
  onComplete,
  transferData,
  mode = 'approval',
  loading = false,
}) => {
  const [action, setAction] = useState(null);
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
    initiated_by_name,
    approved_at,
    approved_by_name,
    items = [],
  } = transferData;

  const validate = () => {
    const errs = {};
    if (!action) errs.action = 'Please select an action';
    if (action === 'reject' && !notes.trim()) errs.notes = 'Rejection reason is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (action === 'approve') {
      onApprove({ transfer_id: transferData.id, approval_notes: notes });
    } else if (action === 'reject') {
      onReject({ transfer_id: transferData.id, rejection_reason: notes });
    } else if (action === 'complete') {
      onComplete({ transfer_id: transferData.id, completion_notes: notes });
    }
  };

  const handleClose = () => {
    setAction(null);
    setNotes('');
    setErrors({});
    onClose();
  };

  const isApprovalMode = mode === 'approval';

  const actionBtnLabel =
    action === 'approve' ? 'Approve Transfer'
    : action === 'reject' ? 'Reject Transfer'
    : action === 'complete' ? 'Complete Transfer'
    : 'Select Action';

  const actionBtnClass =
    action === 'reject'
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : action
      ? 'bg-accent-gold hover:bg-accent-goldDark text-white'
      : 'bg-theme-tertiary text-theme-muted cursor-not-allowed';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isApprovalMode ? 'Review Stock Transfer' : 'Complete Stock Transfer'}
      size="lg"
      footer={
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-theme-secondary bg-theme-primary hover:bg-theme-tertiary border border-theme rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!action || loading}
            className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${actionBtnClass}`}
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {actionBtnLabel}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Transfer summary */}
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-semibold text-theme-primary">{transfer_number}</p>
              <p className="text-sm text-theme-muted">{transfer_reason}</p>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded border bg-blue-500/10 text-blue-500 border-blue-500/20 uppercase">
              Transfer
            </span>
          </div>

          {/* Branch route */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 text-center p-2 bg-theme-tertiary rounded-lg">
              <Warehouse className="w-4 h-4 mx-auto mb-0.5 text-theme-muted" />
              <p className="text-xs font-medium text-theme-primary">{from_branch_name}</p>
              <p className="text-[10px] text-theme-muted">Source</p>
            </div>
            <ArrowRight className="w-5 h-5 text-accent-gold flex-shrink-0" />
            <div className="flex-1 text-center p-2 bg-theme-tertiary rounded-lg">
              <Warehouse className="w-4 h-4 mx-auto mb-0.5 text-green-500" />
              <p className="text-xs font-medium text-theme-primary">{to_branch_name}</p>
              <p className="text-[10px] text-theme-muted">Destination</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-theme-muted text-xs">Total Quantity:</span>
              <span className="ml-2 font-bold text-blue-500">{total_quantity} units</span>
            </div>
            <div>
              <span className="text-theme-muted text-xs">Products:</span>
              <span className="ml-2 font-medium text-theme-primary">{total_items}</span>
            </div>
            <div>
              <span className="text-theme-muted text-xs">Created:</span>
              <span className="ml-2 font-medium text-theme-primary">
                {new Date(created_at).toLocaleDateString()}
                {initiated_by_name && ` · ${initiated_by_name}`}
              </span>
            </div>
            {approved_at && (
              <div>
                <span className="text-theme-muted text-xs">Approved:</span>
                <span className="ml-2 font-medium text-theme-primary">
                  {new Date(approved_at).toLocaleDateString()}
                  {approved_by_name && ` · ${approved_by_name}`}
                </span>
              </div>
            )}
          </div>

          {transfer_notes && (
            <div className="mt-3 pt-3 border-t border-blue-500/20">
              <p className="text-xs text-theme-muted">
                <span className="font-semibold">Notes:</span> {transfer_notes}
              </p>
            </div>
          )}
        </div>

        {/* Items */}
        {items.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-accent-gold uppercase tracking-wider pb-2 border-b border-theme">
              Items to Transfer ({items.length})
            </h3>
            <div className="border border-theme rounded-lg overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-theme-tertiary border-b border-theme sticky top-0">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-theme-muted uppercase">Product</th>
                    <th className="px-4 py-2.5 text-center text-xs font-medium text-theme-muted uppercase">Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme">
                  {items.map((item, index) => (
                    <tr key={index} className="hover:bg-theme-tertiary transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-theme-primary">{item.product_name}</p>
                        {item.variant_name && (
                          <p className="text-xs text-theme-muted">{item.variant_name}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-blue-500">{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-theme-tertiary border-t-2 border-theme">
                  <tr>
                    <td className="px-4 py-3 text-right font-semibold text-theme-secondary text-sm">Total:</td>
                    <td className="px-4 py-3 text-center font-bold text-accent-gold text-lg">{total_quantity}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Action Selection */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-accent-gold uppercase tracking-wider pb-2 border-b border-theme">
            Action <span className="text-red-500">*</span>
          </h3>

          {isApprovalMode ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { setAction('approve'); setErrors({}); }}
                className={`p-4 rounded-xl border-2 transition-all text-center ${
                  action === 'approve'
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-theme hover:border-green-500/40 bg-theme-tertiary'
                }`}
              >
                <Check className={`w-6 h-6 mx-auto mb-2 ${action === 'approve' ? 'text-green-500' : 'text-theme-muted'}`} />
                <p className={`font-medium text-sm ${action === 'approve' ? 'text-green-500' : 'text-theme-primary'}`}>
                  Approve Transfer
                </p>
                <p className="text-xs text-theme-muted mt-1">Allow transfer to proceed</p>
              </button>

              <button
                type="button"
                onClick={() => { setAction('reject'); setErrors({}); }}
                className={`p-4 rounded-xl border-2 transition-all text-center ${
                  action === 'reject'
                    ? 'border-red-500 bg-red-500/10'
                    : 'border-theme hover:border-red-500/40 bg-theme-tertiary'
                }`}
              >
                <X className={`w-6 h-6 mx-auto mb-2 ${action === 'reject' ? 'text-red-500' : 'text-theme-muted'}`} />
                <p className={`font-medium text-sm ${action === 'reject' ? 'text-red-500' : 'text-theme-primary'}`}>
                  Reject Transfer
                </p>
                <p className="text-xs text-theme-muted mt-1">Cancel this transfer</p>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => { setAction('complete'); setErrors({}); }}
              className={`w-full p-4 rounded-xl border-2 transition-all text-center ${
                action === 'complete'
                  ? 'border-accent-gold bg-accent-gold/10'
                  : 'border-theme hover:border-accent-gold/40 bg-theme-tertiary'
              }`}
            >
              <TruckIcon className={`w-6 h-6 mx-auto mb-2 ${action === 'complete' ? 'text-accent-gold' : 'text-theme-muted'}`} />
              <p className={`font-medium text-sm ${action === 'complete' ? 'text-accent-gold' : 'text-theme-primary'}`}>
                Complete Transfer
              </p>
              <p className="text-xs text-theme-muted mt-1">
                Move stock from {from_branch_name} to {to_branch_name}
              </p>
            </button>
          )}

          {errors.action && <p className="text-xs text-red-500">{errors.action}</p>}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">
              {action === 'approve' ? 'Approval Notes (Optional)'
                : action === 'reject' ? <>Rejection Reason <span className="text-red-500">*</span></>
                : action === 'complete' ? 'Completion Notes (Optional)'
                : 'Notes'}
            </label>
            <textarea
              value={notes}
              onChange={e => {
                setNotes(e.target.value);
                if (errors.notes) setErrors(prev => ({ ...prev, notes: null }));
              }}
              rows={3}
              disabled={!action}
              placeholder={
                action === 'approve' ? 'Optional notes about the approval...'
                : action === 'reject' ? 'Explain why this transfer is being rejected...'
                : action === 'complete' ? 'Optional notes about the completion...'
                : 'Select an action first...'
              }
              className={`${inputClass} ${errors.notes ? 'border-red-500/60' : ''} disabled:opacity-50 disabled:cursor-not-allowed`}
            />
            {errors.notes && <p className="mt-1 text-xs text-red-500">{errors.notes}</p>}
          </div>
        </div>

        {/* Contextual notices */}
        {action === 'approve' && (
          <div className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-500">
              Approving will allow this transfer to be completed. Stock moves when marked complete.
            </p>
          </div>
        )}

        {action === 'reject' && (
          <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-500">
              Rejecting this transfer will cancel it permanently. No stock will be moved.
            </p>
          </div>
        )}

        {action === 'complete' && (
          <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-500">
              <p className="font-semibold mb-1">Completing this transfer will:</p>
              <ul className="list-disc list-inside space-y-0.5 text-xs">
                <li>Reduce stock at <span className="font-bold">{from_branch_name}</span> by {total_quantity} units</li>
                <li>Increase stock at <span className="font-bold">{to_branch_name}</span> by {total_quantity} units</li>
                <li>Mark this transfer as completed</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TransferApprovalModal;
