import React from 'react';
import { TruckIcon, Warehouse, Package, Calendar, Check, X, ArrowRight, Eye } from 'lucide-react';

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

const StockTransferCard = ({ transferData, onView, onApprove, onReject, onComplete }) => {
  const {
    transfer_number,
    from_branch_name,
    to_branch_name,
    status,
    transfer_reason,
    total_items,
    total_quantity,
    created_at,
    initiated_by_name,
    approved_at,
    approved_by_name,
    completed_at,
  } = transferData;

  const canApprove = status === 'pending';
  const canComplete = status === 'approved';

  return (
    <div
      onClick={() => onView(transferData)}
      className="bg-theme-secondary border border-theme rounded-xl shadow-theme-sm hover:shadow-theme-md transition-shadow cursor-pointer p-4 flex flex-col gap-3"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <TruckIcon className="w-5 h-5 text-blue-500" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-theme-primary text-sm leading-tight">{transfer_number}</p>
            {transfer_reason && (
              <p className="text-xs text-theme-muted mt-0.5 line-clamp-1">{transfer_reason}</p>
            )}
          </div>
        </div>
        <span className={`flex-shrink-0 px-2 py-0.5 text-[10px] font-bold rounded border uppercase whitespace-nowrap ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>
          {STATUS_LABELS[status] || status}
        </span>
      </div>

      {/* Branch route */}
      <div className="flex items-center gap-2 p-2.5 bg-theme-tertiary rounded-lg">
        <div className="flex-1 text-center min-w-0">
          <Warehouse className="w-4 h-4 mx-auto mb-0.5 text-theme-muted" />
          <p className="text-[10px] text-theme-muted">From</p>
          <p className="text-xs font-semibold text-theme-primary truncate">{from_branch_name}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-accent-gold flex-shrink-0" />
        <div className="flex-1 text-center min-w-0">
          <Warehouse className="w-4 h-4 mx-auto mb-0.5 text-green-500" />
          <p className="text-[10px] text-theme-muted">To</p>
          <p className="text-xs font-semibold text-theme-primary truncate">{to_branch_name}</p>
        </div>
      </div>

      {/* Quantity summary */}
      <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-between">
        <div>
          <p className="text-xs text-theme-muted">Units Transferring</p>
          <p className="text-2xl font-bold text-blue-500">{total_quantity ?? 0}</p>
          <p className="text-[10px] text-theme-muted">{total_items ?? 0} product(s)</p>
        </div>
        <Package className="w-8 h-8 text-blue-500 opacity-30" />
      </div>

      {/* Meta */}
      <div className="space-y-1 text-xs text-theme-muted">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">
            Created: {new Date(created_at).toLocaleDateString()}
            {initiated_by_name && ` · ${initiated_by_name}`}
          </span>
        </div>
        {approved_at && (
          <div className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
            <span className="truncate">
              Approved: {new Date(approved_at).toLocaleDateString()}
              {approved_by_name && ` · ${approved_by_name}`}
            </span>
          </div>
        )}
        {completed_at && (
          <div className="flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
            <span>Completed: {new Date(completed_at).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-theme" onClick={e => e.stopPropagation()}>
        <button
          onClick={() => onView(transferData)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-theme-secondary bg-theme-tertiary border border-theme rounded-lg hover:bg-theme-secondary hover:text-theme-primary transition-colors"
        >
          <Eye className="w-3.5 h-3.5" /> View
        </button>

        {canApprove && (
          <>
            <button
              onClick={() => onApprove(transferData)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-white bg-accent-gold rounded-lg hover:bg-accent-goldDark transition-colors"
            >
              <Check className="w-3.5 h-3.5" /> Approve
            </button>
            <button
              onClick={() => onReject(transferData)}
              className="flex items-center justify-center py-1.5 px-2.5 text-xs font-semibold text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        )}

        {canComplete && (
          <button
            onClick={() => onComplete(transferData)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-white bg-accent-gold rounded-lg hover:bg-accent-goldDark transition-colors"
          >
            <TruckIcon className="w-3.5 h-3.5" /> Complete
          </button>
        )}
      </div>
    </div>
  );
};

export default StockTransferCard;
