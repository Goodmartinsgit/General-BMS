import React from 'react';
import {
  Package, TruckIcon, ShoppingCart, RotateCcw,
  AlertTriangle, Plus, ArrowRight, Calendar, User, Warehouse,
} from 'lucide-react';

const TYPE_CONFIG = {
  sale: {
    icon: ShoppingCart,
    label: 'Sale',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  receipt: {
    icon: Plus,
    label: 'Receipt',
    color: 'text-green-500',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
  },
  return: {
    icon: RotateCcw,
    label: 'Return',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
  transfer_out: {
    icon: TruckIcon,
    label: 'Transfer Out',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
  },
  transfer_in: {
    icon: TruckIcon,
    label: 'Transfer In',
    color: 'text-teal-500',
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/20',
  },
  damage: {
    icon: AlertTriangle,
    label: 'Damage',
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
  },
  adjustment: {
    icon: Package,
    label: 'Adjustment',
    color: 'text-accent-gold',
    bg: 'bg-accent-gold/10',
    border: 'border-accent-gold/20',
  },
};

const DEFAULT_CONFIG = TYPE_CONFIG.adjustment;

const StockActivityLog = ({ activities = [] }) => {
  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-10 h-10 mx-auto mb-2 text-theme-muted opacity-40" />
        <p className="text-theme-muted text-sm">No stock activity recorded</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity, index) => {
        const {
          id,
          movement_type,
          product_name,
          product_code,
          quantity,
          branch_name,
          related_branch_name,
          notes,
          performed_by_name,
          created_at,
        } = activity;

        const cfg = TYPE_CONFIG[movement_type] || DEFAULT_CONFIG;
        const Icon = cfg.icon;

        const qty = quantity ?? 0;
        const isPositive = qty >= 0;
        const qtyDisplay = isPositive ? `+${qty}` : `${qty}`;
        const qtyColor = isPositive ? 'text-green-500' : 'text-red-500';

        const isTransfer = movement_type === 'transfer_in' || movement_type === 'transfer_out';

        return (
          <div
            key={id ?? index}
            className="bg-theme-primary border border-theme rounded-xl p-4 hover:shadow-theme-sm transition-shadow"
          >
            <div className="flex items-start gap-3 sm:gap-4">
              {/* Type icon */}
              <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center flex-shrink-0 border ${cfg.bg} ${cfg.border}`}>
                <Icon className={`w-5 h-5 ${cfg.color}`} />
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                {/* Product + type badge + quantity */}
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-theme-primary text-sm leading-tight truncate">
                        {product_name}
                      </p>
                      <span className={`flex-shrink-0 px-2 py-0.5 text-[10px] font-bold rounded border uppercase ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                        {cfg.label}
                      </span>
                    </div>
                    {product_code && (
                      <p className="text-xs font-mono text-theme-muted mt-0.5">{product_code}</p>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="text-right flex-shrink-0">
                    <p className={`text-xl sm:text-2xl font-bold leading-tight ${qtyColor}`}>
                      {qtyDisplay}
                    </p>
                    <p className="text-[10px] text-theme-muted">units</p>
                  </div>
                </div>

                {/* Branch info */}
                <div className="flex items-center gap-1.5 mb-1.5 text-xs text-theme-secondary">
                  {isTransfer && related_branch_name ? (
                    <>
                      <Warehouse className="w-3.5 h-3.5 text-theme-muted flex-shrink-0" />
                      <span className="truncate">{branch_name}</span>
                      <ArrowRight className="w-3 h-3 text-accent-gold flex-shrink-0" />
                      <Warehouse className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      <span className="truncate">{related_branch_name}</span>
                    </>
                  ) : (
                    <>
                      <Warehouse className="w-3.5 h-3.5 text-theme-muted flex-shrink-0" />
                      <span className="truncate">{branch_name}</span>
                    </>
                  )}
                </div>

                {/* Meta: date + user */}
                <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-theme-muted">
                  {created_at && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      <span>{new Date(created_at).toLocaleString()}</span>
                    </div>
                  )}
                  {performed_by_name && (
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3 flex-shrink-0" />
                      <span>{performed_by_name}</span>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {notes && (
                  <div className="mt-2 px-2.5 py-1.5 bg-theme-tertiary border border-theme rounded-lg text-xs text-theme-secondary line-clamp-2">
                    {notes}
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
