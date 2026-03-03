import React from 'react';
import { FileText, Calendar, Package, Warehouse, Eye, Edit, Check, X, Truck } from 'lucide-react';

const STATUS_STYLES = {
  draft:              'bg-theme-tertiary text-theme-muted border-theme',
  confirmed:          'bg-blue-500/10 text-blue-500 border-blue-500/20',
  partially_received: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  received:           'bg-green-500/10 text-green-500 border-green-500/20',
  cancelled:          'bg-red-500/10 text-red-500 border-red-500/20',
};

const STATUS_LABELS = {
  draft:              'Draft',
  confirmed:          'Confirmed',
  partially_received: 'Part. Received',
  received:           'Received',
  cancelled:          'Cancelled',
};

const PurchaseOrderCard = ({
  purchaseOrder,
  formatCurrency,
  onView,
  onEdit,
  onApprove,
  onReceive,
  onCancel,
}) => {
  const {
    po_number,
    supplier_name,
    branch_name,
    status,
    total_amount,
    item_count,
    total_quantity,
    expected_delivery_date,
    created_at,
    created_by_name,
  } = purchaseOrder;

  const canEdit    = status === 'draft';
  const canApprove = status === 'draft';
  const canReceive = status === 'confirmed' || status === 'partially_received';
  const canCancel  = status === 'draft' || status === 'confirmed';

  const fmt = formatCurrency || (v => `$${parseFloat(v || 0).toFixed(2)}`);

  return (
    <div
      onClick={() => onView(purchaseOrder)}
      className="bg-theme-secondary border border-theme rounded-xl p-4 flex flex-col gap-3 hover:shadow-theme-md transition-shadow cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 bg-accent-gold/10 border border-accent-gold/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-accent-gold" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-theme-primary text-sm leading-tight truncate">{po_number}</p>
            <p className="text-xs text-theme-muted truncate mt-0.5">{supplier_name}</p>
          </div>
        </div>
        <span className={`flex-shrink-0 px-2 py-0.5 text-[10px] font-bold rounded border uppercase whitespace-nowrap ${STATUS_STYLES[status] || STATUS_STYLES.draft}`}>
          {STATUS_LABELS[status] || status}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-1.5 text-xs text-theme-secondary">
        <div className="flex items-center gap-1.5">
          <Warehouse className="w-3.5 h-3.5 text-theme-muted flex-shrink-0" />
          <span className="truncate">{branch_name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Package className="w-3.5 h-3.5 text-theme-muted flex-shrink-0" />
          <span>{item_count ?? 0} item{Number(item_count) !== 1 ? 's' : ''}{total_quantity ? ` · ${total_quantity} units` : ''}</span>
        </div>
        {expected_delivery_date && (
          <div className="flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-theme-muted flex-shrink-0" />
            <span>Expected: {new Date(expected_delivery_date).toLocaleDateString()}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-theme-muted flex-shrink-0" />
          <span className="truncate">
            Created: {new Date(created_at).toLocaleDateString()}
            {created_by_name ? ` · ${created_by_name}` : ''}
          </span>
        </div>
      </div>

      {/* Total */}
      <div className="px-3 py-2 bg-accent-gold/10 border border-accent-gold/20 rounded-lg flex items-center justify-between">
        <p className="text-xs text-theme-muted">Total Amount</p>
        <p className="text-lg font-bold text-accent-gold">{fmt(total_amount)}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-theme" onClick={e => e.stopPropagation()}>
        <button
          onClick={() => onView(purchaseOrder)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-theme-secondary bg-theme-tertiary border border-theme rounded-lg hover:bg-theme-secondary hover:text-theme-primary transition-colors"
        >
          <Eye className="w-3.5 h-3.5" /> View
        </button>

        {canEdit && (
          <button
            onClick={() => onEdit(purchaseOrder)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-theme-secondary bg-theme-tertiary border border-theme rounded-lg hover:bg-theme-secondary hover:text-theme-primary transition-colors"
          >
            <Edit className="w-3.5 h-3.5" /> Edit
          </button>
        )}

        {canApprove && (
          <button
            onClick={() => onApprove(purchaseOrder)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-white bg-accent-gold rounded-lg hover:bg-accent-goldDark transition-colors"
          >
            <Check className="w-3.5 h-3.5" /> Confirm
          </button>
        )}

        {canReceive && (
          <button
            onClick={() => onReceive(purchaseOrder)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-white bg-accent-gold rounded-lg hover:bg-accent-goldDark transition-colors"
          >
            <Truck className="w-3.5 h-3.5" /> Receive
          </button>
        )}

        {canCancel && (
          <button
            onClick={() => onCancel(purchaseOrder)}
            className="p-1.5 text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default PurchaseOrderCard;
