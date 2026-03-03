import React from 'react';
import { Edit, Trash2, ToggleLeft, ToggleRight, Calendar, Users } from 'lucide-react';

const getDiscountDisplay = (p) => {
  switch (p.promotion_type) {
    case 'percentage':    return `${p.discount_percentage}% OFF`;
    case 'fixed_amount':  return `$${parseFloat(p.discount_amount || 0).toFixed(2)} OFF`;
    case 'bogo':          return `Buy ${p.buy_quantity} Get ${p.get_quantity}`;
    case 'bulk_discount': return `${p.discount_percentage}% OFF at ${p.min_quantity}+`;
    default: return 'N/A';
  }
};

const getTypeLabel = (type) => {
  const labels = { percentage: 'Percentage', fixed_amount: 'Fixed Amount', bogo: 'BOGO', bulk_discount: 'Bulk Discount' };
  return labels[type] || type;
};

const PromotionListItem = ({ promotion, onEdit, onDelete, onToggleStatus, showActions = true, compact = false }) => {
  const {
    promotion_name, promotion_type, description,
    start_date, end_date, is_active, coupon_code,
    usage_limit, usage_count = 0,
  } = promotion;

  const now         = new Date();
  const isScheduled = start_date && new Date(start_date) > now;
  const isExpired   = end_date   && new Date(end_date)   < now;
  const isLimitReached = usage_limit && usage_count >= usage_limit;

  const usagePercent = usage_limit ? Math.min((usage_count / usage_limit) * 100, 100) : 0;

  const statusBadge = () => {
    if (!is_active)     return <span className="px-2 py-0.5 text-[10px] font-bold rounded border uppercase bg-theme-tertiary text-theme-muted border-theme">Inactive</span>;
    if (isLimitReached) return <span className="px-2 py-0.5 text-[10px] font-bold rounded border uppercase bg-red-500/10 text-red-500 border-red-500/20">Limit Reached</span>;
    if (isExpired)      return <span className="px-2 py-0.5 text-[10px] font-bold rounded border uppercase bg-theme-tertiary text-theme-muted border-theme">Expired</span>;
    if (isScheduled)    return <span className="px-2 py-0.5 text-[10px] font-bold rounded border uppercase bg-blue-500/10 text-blue-500 border-blue-500/20">Scheduled</span>;
    return              <span className="px-2 py-0.5 text-[10px] font-bold rounded border uppercase bg-green-500/10 text-green-500 border-green-500/20">Active</span>;
  };

  return (
    <div className={`bg-theme-secondary border border-theme rounded-xl hover:shadow-theme-sm transition-shadow ${(!is_active || isExpired || isLimitReached) ? 'opacity-60' : ''} ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-center gap-4">
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className={`font-semibold text-theme-primary truncate ${compact ? 'text-sm' : 'text-base'}`}>
              {promotion_name}
            </p>
            {coupon_code && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded border uppercase bg-accent-gold/10 text-accent-gold border-accent-gold/20 flex-shrink-0">
                {coupon_code}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            {statusBadge()}
            <span className="px-2 py-0.5 text-[10px] font-bold rounded border uppercase bg-theme-tertiary text-theme-secondary border-theme">
              {getTypeLabel(promotion_type)}
            </span>
          </div>

          {!compact && description && (
            <p className="text-xs text-theme-muted mb-2 line-clamp-1">{description}</p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs text-theme-muted">
            {(start_date || end_date) && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>
                  {start_date && new Date(start_date).toLocaleDateString()}
                  {start_date && end_date && ' – '}
                  {end_date && new Date(end_date).toLocaleDateString()}
                </span>
              </div>
            )}
            {usage_limit && (
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{usage_count}/{usage_limit} used</span>
              </div>
            )}
          </div>

          {usage_limit && !compact && (
            <div className="mt-2 w-full max-w-xs bg-theme-tertiary rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full transition-all ${usagePercent >= 100 ? 'bg-red-500' : usagePercent >= 75 ? 'bg-yellow-500' : 'bg-accent-gold'}`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          )}
        </div>

        {/* Discount value */}
        <div className={`text-right flex-shrink-0 ${compact ? 'min-w-24' : 'min-w-32'}`}>
          <p className={`font-bold text-accent-gold ${compact ? 'text-lg' : 'text-2xl'}`}>
            {getDiscountDisplay(promotion)}
          </p>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => onToggleStatus(promotion)}
              title={is_active ? 'Deactivate' : 'Activate'}
              className={`p-1.5 rounded-lg border transition-colors ${is_active ? 'text-green-500 bg-green-500/10 border-green-500/20 hover:bg-green-500/20' : 'text-theme-muted bg-theme-tertiary border-theme hover:bg-theme-secondary'}`}
            >
              {is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
            </button>
            <button
              onClick={() => onEdit(promotion)}
              title="Edit"
              className="p-1.5 text-theme-secondary bg-theme-tertiary border border-theme rounded-lg hover:bg-theme-secondary hover:text-theme-primary transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(promotion)}
              title="Delete"
              className="p-1.5 text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromotionListItem;
