import React from 'react';
import { TruckIcon, Warehouse, ArrowRight, Eye, Check, X } from 'lucide-react';

const STATUS_STYLES = {
  pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  approved: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  completed: 'bg-green-500/10 text-green-500 border-green-500/20',
  rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
};
const STATUS_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  completed: 'Completed',
  rejected: 'Rejected',
};

const StockTransferListItem = ({ transferData, onView, onApprove, onReject, onComplete }) => {
  const {
    transfer_number,
    from_branch_name,
    to_branch_name,
    status,
    transfer_reason,
    total_items,
    total_quantity,
    created_at,
    approved_at,
    completed_at,
  } = transferData;

  const canApprove = status === 'pending';
  const canComplete = status === 'approved';

  return (
    <div
      onClick={() => onView(transferData)}
      className="bg-theme-secondary border border-theme rounded-xl p-4 hover:shadow-theme-md transition-shadow cursor-pointer"
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <TruckIcon className="w-5 h-5 text-blue-500" />
        </div>

        {/* Info grid */}
        <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-5 gap-3 items-center">
          {/* Transfer ID + reason */}
          <div className="col-span-2 md:col-span-1 min-w-0">
            <p className="font-semibold text-theme-primary text-sm truncate">{transfer_number}</p>
            {transfer_reason && (
              <p className="text-xs text-theme-muted truncate">{transfer_reason}</p>
            )}
          </div>

          {/* Branch route */}
          <div className="md:col-span-2 flex items-center gap-2 min-w-0">
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <Warehouse className="w-3.5 h-3.5 text-theme-muted flex-shrink-0" />
              <span className="text-xs text-theme-secondary truncate">{from_branch_name}</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-accent-gold flex-shrink-0" />
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <Warehouse className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
              <span className="text-xs text-theme-secondary truncate">{to_branch_name}</span>
            </div>
          </div>

          {/* Qty + status */}
          <div className="md:col-span-1">
            <p className="text-lg font-bold text-blue-500">{total_quantity ?? 0}</p>
            <p className="text-xs text-theme-muted">{total_items ?? 0} product(s)</p>
          </div>

          {/* Status + dates */}
          <div className="md:col-span-1">
            <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded border uppercase mb-1 ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>
              {STATUS_LABELS[status] || status}
            </span>
            <p className="text-[10px] text-theme-muted">
              {new Date(created_at).toLocaleDateString()}
            </p>
            {approved_at && (
              <p className="text-[10px] text-theme-muted">
                Approved: {new Date(approved_at).toLocaleDateString()}
              </p>
            )}
            {completed_at && (
              <p className="text-[10px] text-theme-muted">
                Done: {new Date(completed_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => onView(transferData)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-theme-secondary bg-theme-tertiary border border-theme rounded-lg hover:bg-theme-secondary transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">View</span>
          </button>

          {canApprove && (
            <>
              <button
                onClick={() => onApprove(transferData)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-accent-gold rounded-lg hover:bg-accent-goldDark transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Approve</span>
              </button>
              <button
                onClick={() => onReject(transferData)}
                className="p-1.5 text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {canComplete && (
            <button
              onClick={() => onComplete(transferData)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-accent-gold rounded-lg hover:bg-accent-goldDark transition-colors"
            >
              <TruckIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Complete</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockTransferListItem;
