import React from 'react';
import { FileText, Calendar, Package, User, MapPin, Eye, Edit, Trash2, Check, X } from 'lucide-react';
import { Card, Badge, Button } from '../ui';

/**
 * PurchaseOrderCard Component
 * Displays purchase order information in a card format
 */
const PurchaseOrderCard = ({
  purchaseOrder,
  onView,
  onEdit,
  onDelete,
  onApprove,
  onCancel,
  showActions = true,
  className = '',
}) => {
  const {
    po_number,
    supplier_name,
    branch_name,
    status,
    total_amount,
    total_items,
    expected_delivery_date,
    created_at,
    created_by_name,
  } = purchaseOrder;

  const statusConfig = {
    draft: {
      variant: 'default',
      label: 'Draft',
    },
    confirmed: {
      variant: 'info',
      label: 'Confirmed',
    },
    partially_received: {
      variant: 'warning',
      label: 'Partially Received',
    },
    received: {
      variant: 'success',
      label: 'Received',
    },
    cancelled: {
      variant: 'danger',
      label: 'Cancelled',
    },
  };

  const config = statusConfig[status] || statusConfig.draft;

  const canEdit = status === 'draft';
  const canApprove = status === 'draft';
  const canCancel = ['draft', 'confirmed'].includes(status);

  return (
    <Card
      hoverable
      onClick={() => onView(purchaseOrder)}
      className={className}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-theme-primary">{po_number}</h3>
            <p className="text-sm text-theme-secondary">{supplier_name}</p>
          </div>
        </div>

        <Badge variant={config.variant}>{config.label}</Badge>
      </div>

      {/* Details */}
      <div className="space-y-3 mb-4">
        <DetailRow
          icon={MapPin}
          label="Destination"
          value={branch_name}
        />

        <DetailRow
          icon={Package}
          label="Items"
          value={`${total_items} items`}
        />

        {expected_delivery_date && (
          <DetailRow
            icon={Calendar}
            label="Expected Delivery"
            value={new Date(expected_delivery_date).toLocaleDateString()}
          />
        )}

        <DetailRow
          icon={User}
          label="Created By"
          value={created_by_name}
        />

        <DetailRow
          icon={Calendar}
          label="Created"
          value={new Date(created_at).toLocaleDateString()}
        />
      </div>

      {/* Total Amount */}
      <div className="pt-4 border-t border-theme mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-theme-secondary">Total Amount</span>
          <span className="text-xl font-bold text-theme-primary">
            ${parseFloat(total_amount || 0).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-2 pt-4 border-t border-theme">
          <Button
            size="sm"
            variant="outline"
            icon={Eye}
            onClick={(e) => {
              e.stopPropagation();
              onView(purchaseOrder);
            }}
            className="flex-1"
          >
            View
          </Button>

          {canEdit && (
            <Button
              size="sm"
              variant="outline"
              icon={Edit}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(purchaseOrder);
              }}
              className="flex-1"
            >
              Edit
            </Button>
          )}

          {canApprove && (
            <Button
              size="sm"
              variant="primary"
              icon={Check}
              onClick={(e) => {
                e.stopPropagation();
                onApprove(purchaseOrder);
              }}
              className="flex-1"
            >
              Confirm
            </Button>
          )}

          {canCancel && (
            <Button
              size="sm"
              variant="danger"
              icon={X}
              onClick={(e) => {
                e.stopPropagation();
                onCancel(purchaseOrder);
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};

// Helper Component
const DetailRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-2 text-sm">
    <Icon className="w-4 h-4 text-theme-secondary flex-shrink-0" />
    <span className="text-theme-secondary">{label}:</span>
    <span className="font-medium text-theme-primary">{value}</span>
  </div>
);

export default PurchaseOrderCard;
