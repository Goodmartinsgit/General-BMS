import React from 'react';
import { TruckIcon, Warehouse, ArrowRight, Eye, Check, X } from 'lucide-react';
import { Badge, Button } from '../ui';

/**
 * StockTransferListItem Component
 * Compact list view for stock transfers
 */
const StockTransferListItem = ({
  transferData,
  onView,
  onApprove,
  onReject,
  onComplete,
  showActions = true,
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
    approved_at,
    completed_at,
  } = transferData;

  const statusConfig = {
    pending: {
      variant: 'warning',
      label: 'Pending Approval',
    },
    approved: {
      variant: 'info',
      label: 'Approved',
    },
    rejected: {
      variant: 'danger',
      label: 'Rejected',
    },
    completed: {
      variant: 'success',
      label: 'Completed',
    },
  };

  const config = statusConfig[status] || statusConfig.pending;

  const canApprove = status === 'pending';
  const canComplete = status === 'approved';

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onView(transferData)}
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <TruckIcon className="w-5 h-5 text-blue-600" />
        </div>

        {/* Transfer Info */}
        <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-6 gap-3 items-center">
          {/* Transfer Number */}
          <div className="md:col-span-1">
            <p className="font-semibold text-gray-900 truncate">{transfer_number}</p>
            <p className="text-xs text-gray-600 truncate">{transfer_reason}</p>
          </div>

          {/* Branch Route */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <Warehouse className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700 truncate">{from_branch_name}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <Warehouse className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-sm text-gray-700 truncate">{to_branch_name}</span>
              </div>
            </div>
          </div>

          {/* Quantity */}
          <div className="md:col-span-1 text-center md:text-left">
            <p className="text-lg font-bold text-blue-600">{total_quantity}</p>
            <p className="text-xs text-gray-500">{total_items} product(s)</p>
          </div>

          {/* Status & Dates */}
          <div className="md:col-span-1">
            <Badge variant={config.variant} className="mb-1">{config.label}</Badge>
            <p className="text-xs text-gray-500">
              Created: {new Date(created_at).toLocaleDateString()}
            </p>
            {approved_at && (
              <p className="text-xs text-gray-500">
                Approved: {new Date(approved_at).toLocaleDateString()}
              </p>
            )}
            {completed_at && (
              <p className="text-xs text-gray-500">
                Completed: {new Date(completed_at).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Actions */}
          {showActions && (
            <div className="md:col-span-1 flex items-center gap-2 justify-end">
              <Button
                size="sm"
                variant="outline"
                icon={Eye}
                onClick={(e) => {
                  e.stopPropagation();
                  onView(transferData);
                }}
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
                >
                  Complete
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockTransferListItem;
