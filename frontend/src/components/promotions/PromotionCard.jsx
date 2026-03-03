import React from 'react';
import { Tag, Percent, DollarSign, Gift, TrendingUp, Calendar, Edit, Trash2, ToggleLeft, ToggleRight, Users } from 'lucide-react';

const TYPE_CONFIG = {
  percentage:    { icon: Percent,    label: 'Percentage Off', color: 'text-blue-500',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20' },
  fixed_amount:  { icon: DollarSign, label: 'Fixed Amount',   color: 'text-green-500',  bg: 'bg-green-500/10',  border: 'border-green-500/20' },
  bogo:          { icon: Gift,       label: 'BOGO',           color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  bulk_discount: { icon: TrendingUp, label: 'Bulk Discount',  color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
};

const getDiscountValue = (p) => {
  switch (p.promotion_type) {
    case 'percentage':    return `${p.discount_percentage}% OFF`;
    case 'fixed_amount':  return `$${parseFloat(p.discount_amount || 0).toFixed(2)} OFF`;
    case 'bogo':          return `Buy ${p.buy_quantity} Get ${p.get_quantity}`;
    case 'bulk_discount': return `${p.discount_percentage}% OFF at ${p.min_quantity}+`;
    default: return 'N/A';
  }
};

const PromotionCard = ({ promotion, onEdit, onDelete, onToggleStatus, showActions = true }) => {
  const {
    promotion_name, promotion_type, description,
    start_date, end_date, is_active, coupon_code,
    usage_limit, usage_count = 0, applies_to,
    min_purchase_amount,
  } = promotion;

  const cfg     = TYPE_CONFIG[promotion_type] || { icon: Tag, label: 'Discount', color: 'text-theme-muted', bg: 'bg-theme-tertiary', border: 'border-theme' };
  const TypeIcon = cfg.icon;

  const now         = new Date();
  const isScheduled = start_date && new Date(start_date) > now;
  const isExpired   = end_date   && new Date(end_date)   < now;
  const isLimitReached = usage_limit && usage_count >= usage_limit;

  const usagePercent = usage_limit ? Math.min((usage_count / usage_limit) * 100, 100) : 0;

  const statusBadge = () => {
    if (!is_active)      return <span className="px-2 py-0.5 text-[10px] font-bold rounded border uppercase bg-theme-tertiary text-theme-muted border-theme">Inactive</span>;
    if (isLimitReached)  return <span className="px-2 py-0.5 text-[10px] font-bold rounded border uppercase bg-red-500/10 text-red-500 border-red-500/20">Limit Reached</span>;
    if (isExpired)       return <span className="px-2 py-0.5 text-[10px] font-bold rounded border uppercase bg-theme-tertiary text-theme-muted border-theme">Expired</span>;
    if (isScheduled)     return <span className="px-2 py-0.5 text-[10px] font-bold rounded border uppercase bg-blue-500/10 text-blue-500 border-blue-500/20">Scheduled</span>;
    return               <span className="px-2 py-0.5 text-[10px] font-bold rounded border uppercase bg-green-500/10 text-green-500 border-green-500/20">Active</span>;
  };

  const appliesToLabel = applies_to === 'all' ? 'All Products' : applies_to === 'products' ? 'Specific Products' : 'Specific Categories';

  return (
    <div className={`bg-theme-secondary border border-theme rounded-xl p-4 flex flex-col gap-3 hover:shadow-theme-md transition-shadow ${(!is_active || isExpired || isLimitReached) ? 'opacity-60' : ''}`}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 ${cfg.bg} border ${cfg.border} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <TypeIcon className={`w-5 h-5 ${cfg.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-theme-primary text-sm leading-tight truncate">{promotion_name}</p>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            {statusBadge()}
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded border uppercase ${cfg.bg} ${cfg.color} ${cfg.border}`}>
              {cfg.label}
            </span>
            {coupon_code && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded border uppercase bg-accent-gold/10 text-accent-gold border-accent-gold/20">
                {coupon_code}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Discount Value */}
      <div className={`py-3 px-4 ${cfg.bg} border ${cfg.border} rounded-lg text-center`}>
        <p className={`text-2xl font-bold ${cfg.color}`}>{getDiscountValue(promotion)}</p>
      </div>

      {/* Description */}
      {description && (
        <p className="text-xs text-theme-muted line-clamp-2">{description}</p>
      )}

      {/* Details */}
      <div className="space-y-1.5 text-xs text-theme-secondary">
        {(start_date || end_date) && (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-theme-muted flex-shrink-0" />
            <span>
              {start_date && new Date(start_date).toLocaleDateString()}
              {start_date && end_date && ' – '}
              {end_date && new Date(end_date).toLocaleDateString()}
            </span>
          </div>
        )}
        {min_purchase_amount && (
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-theme-muted flex-shrink-0" />
            <span>Min. purchase: ${parseFloat(min_purchase_amount).toFixed(2)}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-theme-muted flex-shrink-0" />
          <span>Applies to: {appliesToLabel}</span>
        </div>
        {usage_limit && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-theme-muted flex-shrink-0" />
                <span>Usage:</span>
              </div>
              <span className="font-medium text-theme-primary">{usage_count} / {usage_limit}</span>
            </div>
            <div className="w-full bg-theme-tertiary rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full transition-all ${usagePercent >= 100 ? 'bg-red-500' : usagePercent >= 75 ? 'bg-yellow-500' : 'bg-accent-gold'}`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Warnings */}
      {isExpired && is_active && (
        <div className="px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-xs text-yellow-600">This promotion has expired. Consider deactivating it.</p>
        </div>
      )}
      {isLimitReached && is_active && (
        <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-xs text-red-500">Usage limit reached. This promotion can no longer be applied.</p>
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-2 pt-2 border-t border-theme" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => onToggleStatus(promotion)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors flex-1 justify-center ${is_active ? 'text-green-500 border-green-500/30 bg-green-500/10 hover:bg-green-500/20' : 'text-theme-muted border-theme bg-theme-tertiary hover:bg-theme-secondary'}`}
          >
            {is_active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
            {is_active ? 'Active' : 'Inactive'}
          </button>
          <button
            onClick={() => onEdit(promotion)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-theme-secondary bg-theme-tertiary border border-theme rounded-lg hover:bg-theme-secondary hover:text-theme-primary transition-colors flex-1 justify-center"
          >
            <Edit className="w-3.5 h-3.5" /> Edit
          </button>
          <button
            onClick={() => onDelete(promotion)}
            className="p-1.5 text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default PromotionCard;
