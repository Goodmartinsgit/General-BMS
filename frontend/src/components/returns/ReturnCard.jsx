import React from 'react';
import { RotateCcw, DollarSign, Package, Calendar, User, Eye, Check, X, FileText } from 'lucide-react';
import { Card, Badge, Button } from '../ui';

/**
 * ReturnCard Component
 * Displays return/exchange information in a card format
 */
const ReturnCard = ({
  returnData,
  onView,
  onApprove,
  onReject,
  onProcess,
  showActions = true,
  className = '',
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
    approved_by_name,
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
    <Card
      hoverable
      onClick={() => onView(returnData)}
      className={className}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className={`w-12 h-12 ${typeInfo.bgColor} rounded-lg flex items-center justify-center`}>
            <TypeIcon className={`w-6 h-6 ${typeInfo.color}`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{return_number}</h3>
            <p className="text-sm text-gray-600">Sale: {sale_number}</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Badge variant={config.variant}>{config.label}</Badge>
          <Badge variant="primary" size="sm">{typeInfo.label}</Badge>
        </div>
      </div>

      {/* Return Amount - Prominent Display */}
      <div className={`p-4 ${typeInfo.bgColor} rounded-lg mb-4`}>
        <p className="text-sm text-gray-700 mb-1">Return Amount</p>
        <p className={`text-3xl font-bold ${typeInfo.color}`}>
          ${parseFloat(total_amount || 0).toFixed(2)}
        </p>
        <p className="text-xs text-gray-600 mt-1">{total_items} items</p>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        {/* Customer */}
        {customer_name && (
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-600">Customer:</span>
            <span className="font-medium text-gray-900">{customer_name}</span>
          </div>
        )}

        {/* Reason */}
        <div className="flex items-start gap-2 text-sm">
          <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="text-gray-600">Reason:</span>
            <p className="font-medium text-gray-900 mt-0.5">{reason}</p>
          </div>
        </div>

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

        {/* Processed */}
        {processed_at && (
          <div className="flex items-center gap-2 text-sm">
            <Package className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span className="text-gray-600">
              Processed: {new Date(processed_at).toLocaleDateString()}
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
              onView(returnData);
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
                  onApprove(returnData);
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
              className="flex-1"
            >
              Process Return
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};

export default ReturnCard;
