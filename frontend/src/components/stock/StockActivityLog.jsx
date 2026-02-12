import React from 'react';
import {
  Package,
  TruckIcon,
  ShoppingCart,
  RotateCcw,
  AlertTriangle,
  Plus,
  Minus,
  ArrowRight,
  Calendar,
  User,
} from 'lucide-react';
import { Badge } from '../ui';

/**
 * StockActivityLog Component
 * Display stock movement history
 */
const StockActivityLog = ({ activities = [], loading = false }) => {
  const activityTypeConfig = {
    sale: {
      icon: ShoppingCart,
      label: 'Sale',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      badge: 'info',
      sign: '-',
    },
    purchase: {
      icon: Plus,
      label: 'Purchase',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      badge: 'success',
      sign: '+',
    },
    return: {
      icon: RotateCcw,
      label: 'Return',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      badge: 'primary',
      sign: '+',
    },
    transfer_out: {
      icon: TruckIcon,
      label: 'Transfer Out',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      badge: 'warning',
      sign: '-',
    },
    transfer_in: {
      icon: TruckIcon,
      label: 'Transfer In',
      color: 'text-teal-600',
      bgColor: 'bg-teal-100',
      badge: 'info',
      sign: '+',
    },
    damage: {
      icon: AlertTriangle,
      label: 'Damage',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      badge: 'danger',
      sign: '-',
    },
    adjustment: {
      icon: Package,
      label: 'Adjustment',
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      badge: 'default',
      sign: '±',
    },
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-gray-100 rounded-lg p-4 h-24" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <p className="text-gray-500">No stock activity recorded</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity, index) => {
        const {
          id,
          activity_type,
          product_name,
          variant_name,
          quantity,
          branch_name,
          related_branch_name,
          reference_number,
          created_at,
          created_by_name,
          notes,
        } = activity;

        const config = activityTypeConfig[activity_type] || activityTypeConfig.adjustment;
        const Icon = config.icon;

        return (
          <div
            key={id || index}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className={`w-12 h-12 ${config.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-6 h-6 ${config.color}`} />
              </div>

              {/* Activity Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 truncate">{product_name}</h4>
                      <Badge variant={config.badge} size="sm">{config.label}</Badge>
                    </div>
                    {variant_name && (
                      <p className="text-sm text-gray-600 mb-1">{variant_name}</p>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className={`text-2xl font-bold ${config.color}`}>
                      {config.sign}{quantity}
                    </p>
                    <p className="text-xs text-gray-500">units</p>
                  </div>
                </div>

                {/* Branch Info */}
                <div className="flex items-center gap-2 mb-2">
                  {activity_type === 'transfer_out' || activity_type === 'transfer_in' ? (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">{branch_name}</span>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{related_branch_name}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-sm">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{branch_name}</span>
                    </div>
                  )}
                </div>

                {/* Reference & Date */}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {reference_number && (
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs">{reference_number}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(created_at).toLocaleString()}</span>
                  </div>
                  {created_by_name && (
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{created_by_name}</span>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {notes && (
                  <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-200">
                    <p className="line-clamp-2">{notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StockActivityLog;
