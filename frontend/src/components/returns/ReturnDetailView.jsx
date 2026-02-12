import React from 'react';
import {
  RotateCcw,
  DollarSign,
  Package,
  Calendar,
  User,
  FileText,
  Check,
  X,
  Clock,
  AlertCircle,
  Printer,
  Mail,
} from 'lucide-react';
import { Badge, Button } from '../ui';

/**
 * ReturnDetailView Component
 * Complete details view for a return/exchange
 */
const ReturnDetailView = ({
  returnData,
  onApprove,
  onReject,
  onProcess,
  onPrint,
  onEmail,
  showActions = true,
}) => {
  if (!returnData) {
    return (
      <div className="p-8 text-center text-gray-500">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <p>No return data available</p>
      </div>
    );
  }

  const {
    return_number,
    sale_number,
    return_type,
    status,
    reason,
    notes,
    total_amount,
    total_items,
    customer_name,
    customer_email,
    customer_phone,
    created_at,
    created_by_name,
    approved_at,
    approved_by_name,
    approval_notes,
    rejected_at,
    rejected_by_name,
    rejection_reason,
    processed_at,
    processed_by_name,
    processing_notes,
    refund_method,
    restock_branch_name,
    items = [],
    exchange_items = [],
  } = returnData;

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

  const typeConfig = {
    refund: {
      icon: DollarSign,
      label: 'Refund',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    exchange: {
      icon: RotateCcw,
      label: 'Exchange',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  };

  const typeInfo = typeConfig[return_type] || typeConfig.refund;
  const TypeIcon = typeInfo.icon;

  const canApprove = status === 'pending';
  const canProcess = status === 'approved';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className={`w-16 h-16 ${typeInfo.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
            <TypeIcon className={`w-8 h-8 ${typeInfo.color}`} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{return_number}</h2>
            <p className="text-gray-600">Original Sale: {sale_number}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={config.variant}>{config.label}</Badge>
              <Badge variant="primary">{typeInfo.label}</Badge>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="flex items-center gap-2">
            {status === 'completed' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  icon={Printer}
                  onClick={onPrint}
                >
                  Print
                </Button>
                {customer_email && (
                  <Button
                    size="sm"
                    variant="outline"
                    icon={Mail}
                    onClick={onEmail}
                  >
                    Email
                  </Button>
                )}
              </>
            )}

            {canApprove && (
              <>
                <Button
                  size="sm"
                  variant="primary"
                  icon={Check}
                  onClick={() => onApprove(returnData)}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  icon={X}
                  onClick={() => onReject(returnData)}
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
                onClick={() => onProcess(returnData)}
              >
                Process Return
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Return Amount - Prominent */}
      <div className={`p-6 ${typeInfo.bgColor} rounded-lg border-2 ${typeInfo.color.replace('text-', 'border-')}`}>
        <p className="text-sm text-gray-700 mb-2">Return Amount</p>
        <p className={`text-4xl font-bold ${typeInfo.color}`}>
          ${parseFloat(total_amount || 0).toFixed(2)}
        </p>
        <p className="text-sm text-gray-600 mt-2">{total_items} items</p>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Customer & Return Info */}
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Customer Information
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Name:</span>
                <span className="font-medium text-gray-900">
                  {customer_name || 'Walk-in Customer'}
                </span>
              </div>
              {customer_email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium text-gray-900">{customer_email}</span>
                </div>
              )}
              {customer_phone && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium text-gray-900">{customer_phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Return Reason */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Return Reason
            </h3>
            <div className="flex items-start gap-2">
              <FileText className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">{reason}</p>
                {notes && (
                  <p className="text-sm text-gray-600 mt-2">{notes}</p>
                )}
              </div>
            </div>
          </div>

          {/* Refund Method (if refund) */}
          {return_type === 'refund' && refund_method && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                Refund Method
              </h3>
              <div className="flex items-center gap-2">
                {refund_method === 'cash' && <DollarSign className="w-5 h-5 text-green-600" />}
                {refund_method === 'card' && <CreditCard className="w-5 h-5 text-blue-600" />}
                {refund_method === 'credit_note' && <FileText className="w-5 h-5 text-purple-600" />}
                <span className="font-medium text-gray-900 capitalize">
                  {refund_method === 'credit_note' ? 'Store Credit' : refund_method}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Timeline */}
        <div className="space-y-6">
          {/* Timeline */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
              Return Timeline
            </h3>
            <div className="space-y-4">
              {/* Created */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Return Created</p>
                  <p className="text-sm text-gray-600">
                    {new Date(created_at).toLocaleString()}
                  </p>
                  {created_by_name && (
                    <p className="text-xs text-gray-500">by {created_by_name}</p>
                  )}
                </div>
              </div>

              {/* Approved */}
              {approved_at && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Approved</p>
                    <p className="text-sm text-gray-600">
                      {new Date(approved_at).toLocaleString()}
                    </p>
                    {approved_by_name && (
                      <p className="text-xs text-gray-500">by {approved_by_name}</p>
                    )}
                    {approval_notes && (
                      <p className="text-sm text-gray-600 mt-1 italic">{approval_notes}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Rejected */}
              {rejected_at && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <X className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Rejected</p>
                    <p className="text-sm text-gray-600">
                      {new Date(rejected_at).toLocaleString()}
                    </p>
                    {rejected_by_name && (
                      <p className="text-xs text-gray-500">by {rejected_by_name}</p>
                    )}
                    {rejection_reason && (
                      <p className="text-sm text-red-600 mt-1 italic">{rejection_reason}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Processed */}
              {processed_at && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Package className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Processed</p>
                    <p className="text-sm text-gray-600">
                      {new Date(processed_at).toLocaleString()}
                    </p>
                    {processed_by_name && (
                      <p className="text-xs text-gray-500">by {processed_by_name}</p>
                    )}
                    {restock_branch_name && (
                      <p className="text-xs text-gray-500">Restocked to: {restock_branch_name}</p>
                    )}
                    {processing_notes && (
                      <p className="text-sm text-gray-600 mt-1 italic">{processing_notes}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Returned Items */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Returned Items ({items.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Product</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Qty</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Unit Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Reason</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Total</th>
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
                  <td className="px-4 py-3 text-center font-medium text-gray-900">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    ${parseFloat(item.unit_price).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {item.return_reason || '-'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    ${parseFloat(item.quantity * item.unit_price).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-300">
              <tr>
                <td colSpan="4" className="px-4 py-3 text-right font-semibold text-gray-900">
                  Total Return Amount:
                </td>
                <td className="px-4 py-3 text-right font-bold text-gray-900 text-lg">
                  ${parseFloat(total_amount || 0).toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Exchange Items (if exchange) */}
      {return_type === 'exchange' && exchange_items && exchange_items.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Exchange Items ({exchange_items.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Product</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Qty</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Unit Price</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {exchange_items.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{item.product_name}</p>
                        {item.variant_name && (
                          <p className="text-xs text-gray-500">{item.variant_name}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">
                      ${parseFloat(item.unit_price).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      ${parseFloat(item.quantity * item.unit_price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnDetailView;
