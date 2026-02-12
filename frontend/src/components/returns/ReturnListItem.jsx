import React from 'react';
import { RotateCcw, DollarSign, Package, Calendar, User, Eye, Check, X, FileText } from 'lucide-react';
import { Badge, Button } from '../ui';

/**
 * ReturnListItem Component
 * Compact list view display for returns/exchanges
 */
const ReturnListItem = ({
  returnData,
  onView,
  onApprove,
  onReject,
  onProcess,
  showActions = true,
}) => {
  const {
    return_number,
    sale_number,
    return_type,
    status,
    reason,
    total_amount,
    total_items,
    customer_name,
    created_at,
    created_by_name,
    approved_at,
    processed_at,
  } = returnData;

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

  const typeConfig = {
    refund: {
      icon: DollarSign,
      label: 'Refund',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    exchange: {
      icon: RotateCcw,
      label: 'Exchange',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  };

  const typeInfo = typeConfig[return_type] || typeConfig.refund;
  const TypeIcon = typeInfo.icon;

  const canApprove = status === 'pending';
  const canProcess = status === 'approved';

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onView(returnData)}
    >
      <div className="flex items-center gap-4">
        {/* Type Icon */}
        <div className={`w-10 h-10 ${typeInfo.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <TypeIcon className={`w-5 h-5 ${typeInfo.color}`} />
        </div>

        {/* Return Info */}
        <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-6 gap-3 items-center">
          {/* Return Number & Sale */}
          <div className="md:col-span-1">
            <p className="font-semibold text-gray-900 truncate">{return_number}</p>
            <p className="text-xs text-gray-600 truncate">Sale: {sale_number}</p>
          </div>

          {/* Customer */}
          <div className="md:col-span-1">
            <p className="text-sm text-gray-700 truncate">{customer_name || 'Walk-in Customer'}</p>
            <p className="text-xs text-gray-500">{total_items} items</p>
          </div>

          {/* Reason */}
          <div className="md:col-span-1">
            <p className="text-sm text-gray-700 truncate">{reason}</p>
            <p className="text-xs text-gray-500">
              {new Date(created_at).toLocaleDateString()}
            </p>
          </div>

          {/* Amount */}
          <div className="md:col-span-1 text-right md:text-left">
            <p className={`text-lg font-bold ${typeInfo.color}`}>
              ${parseFloat(total_amount || 0).toFixed(2)}
            </p>
            <Badge variant="primary" size="sm">{typeInfo.label}</Badge>
          </div>

          {/* Status & Timestamps */}
          <div className="md:col-span-1">
            <Badge variant={config.variant} className="mb-1">{config.label}</Badge>
            {approved_at && (
              <p className="text-xs text-gray-500">
                Approved: {new Date(approved_at).toLocaleDateString()}
              </p>
            )}
            {processed_at && (
              <p className="text-xs text-gray-500">
                Processed: {new Date(processed_at).toLocaleDateString()}
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
                  onView(returnData);
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
                      onApprove(returnData);
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
                      onReject(returnData);
                    }}
                  >
                    Reject
                  </Button>
                </>
              )}

              {canProcess && (
                <Button
                  size="sm"
                  variant="primary"
                  icon={Package}
                  onClick={(e) => {
                    e.stopPropagation();
                    onProcess(returnData);
                  }}
                >
                  Process
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReturnListItem;
