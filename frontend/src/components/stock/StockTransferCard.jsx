import React from 'react';
import { TruckIcon, Warehouse, Package, Calendar, User, Eye, Check, X, ArrowRight } from 'lucide-react';
import { Card, Badge, Button } from '../ui';

/**
 * StockTransferCard Component
 * Display stock transfer in card format
 */
const StockTransferCard = ({
  transferData,
  onView,
  onApprove,
  onReject,
  onComplete,
  showActions = true,
  className = '',
}) => {
  const {
    transfer_number,
    from_branch_name,
    to_branch_name,
    status,
    transfer_reason,
    total_items,
    total_quantity,
    created_at,
    created_by_name,
    approved_at,
    approved_by_name,
    completed_at,
  } = transferData;

  const statusConfig = {
    pending: {
      variant: 'warning',
      label: 'Pending Approval',
      icon: Clock,
      color: 'text-yellow-600',
    },
    approved: {
      variant: 'info',
      label: 'Approved',
      icon: Check,
      color: 'text-blue-600',
    },
    rejected: {
      variant: 'danger',
      label: 'Rejected',
      icon: X,
      color: 'text-red-600',
    },
    completed: {
      variant: 'success',
      label: 'Completed',
      icon: Check,
      color: 'text-green-600',
    },
  };

  const config = statusConfig[status] || statusConfig.pending;
  const StatusIcon = config.icon;

  const canApprove = status === 'pending';
  const canComplete = status === 'approved';

  return (
    <Card
      hoverable
      onClick={() => onView(transferData)}
      className={className}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <TruckIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{transfer_number}</h3>
            <p className="text-sm text-gray-600">{transfer_reason}</p>
          </div>
        </div>

        <Badge variant={config.variant}>{config.label}</Badge>
      </div>

      {/* Branch Transfer Visual */}
      <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex-1 text-center">
          <Warehouse className="w-5 h-5 mx-auto mb-1 text-gray-600" />
          <p className="text-xs font-medium text-gray-900 truncate">{from_branch_name}</p>
          <p className="text-xs text-gray-500">From</p>
        </div>
        <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
        <div className="flex-1 text-center">
          <Warehouse className="w-5 h-5 mx-auto mb-1 text-green-600" />
          <p className="text-xs font-medium text-gray-900 truncate">{to_branch_name}</p>
          <p className="text-xs text-gray-500">To</p>
        </div>
      </div>

      {/* Transfer Summary */}
      <div className="p-3 bg-blue-50 rounded-lg mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-700">Items Transferring</p>
            <p className="text-2xl font-bold text-blue-600">{total_quantity}</p>
            <p className="text-xs text-gray-600">{total_items} product(s)</p>
          </div>
          <Package className="w-10 h-10 text-blue-600 opacity-50" />
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        {/* Created */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-gray-600">
            Created: {new Date(created_at).toLocaleDateString()}
            {created_by_name && ` by ${created_by_name}`}
          </span>
        </div>

        {/* Approved */}
        {approved_at && (
          <div className="flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span className="text-gray-600">
              Approved: {new Date(approved_at).toLocaleDateString()}
              {approved_by_name && ` by ${approved_by_name}`}
            </span>
          </div>
        )}

        {/* Completed */}
        {completed_at && (
          <div className="flex items-center gap-2 text-sm">
            <Package className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span className="text-gray-600">
              Completed: {new Date(completed_at).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
          <Button
            size="sm"
            variant="outline"
            icon={Eye}
            onClick={(e) => {
              e.stopPropagation();
              onView(transferData);
            }}
            className="flex-1"
          >
            View
          </Button>

          {canApprove && (
            <>
              <Button
                size="sm"
                variant="primary"
                icon={Check}
                onClick={(e) => {
                  e.stopPropagation();
                  onApprove(transferData);
                }}
                className="flex-1"
              >
                Approve
              </Button>

              <Button
                size="sm"
                variant="danger"
                icon={X}
                onClick={(e) => {
                  e.stopPropagation();
                  onReject(transferData);
                }}
              >
                Reject
              </Button>
            </>
          )}

          {canComplete && (
            <Button
              size="sm"
              variant="primary"
              icon={TruckIcon}
              onClick={(e) => {
                e.stopPropagation();
                onComplete(transferData);
              }}
              className="flex-1"
            >
              Complete Transfer
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};

export default StockTransferCard;
