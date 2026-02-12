import React from 'react';
import { Edit, Trash2, ToggleLeft, ToggleRight, Calendar, Users } from 'lucide-react';
import { Badge, Button } from '../ui';

/**
 * PromotionListItem Component
 * Displays promotion information in a list/table row format
 */
const PromotionListItem = ({
  promotion,
  onEdit,
  onDelete,
  onToggleStatus,
  showActions = true,
  compact = false,
}) => {
  const {
    promotion_name,
    promotion_type,
    description,
    discount_percentage,
    discount_amount,
    buy_quantity,
    get_quantity,
    min_quantity,
    start_date,
    end_date,
    is_active,
    coupon_code,
    usage_limit,
    usage_count = 0,
  } = promotion;

  // Get discount display
  const getDiscountDisplay = () => {
    switch (promotion_type) {
      case 'percentage':
        return `${discount_percentage}% OFF`;
      case 'fixed_amount':
        return `$${parseFloat(discount_amount).toFixed(2)} OFF`;
      case 'bogo':
        return `Buy ${buy_quantity} Get ${get_quantity}`;
      case 'bulk_discount':
        return `${discount_percentage}% OFF at ${min_quantity}+`;
      default:
        return 'N/A';
    }
  };

  const getPromotionTypeLabel = () => {
    switch (promotion_type) {
      case 'percentage':
        return 'Percentage';
      case 'fixed_amount':
        return 'Fixed Amount';
      case 'bogo':
        return 'BOGO';
      case 'bulk_discount':
        return 'Bulk Discount';
      default:
        return promotion_type;
    }
  };

  // Check status
  const now = new Date();
  const isScheduled = start_date && new Date(start_date) > now;
  const isExpired = end_date && new Date(end_date) < now;
  const isLimitReached = usage_limit && usage_count >= usage_limit;

  const getStatusBadge = () => {
    if (!is_active) {
      return <Badge variant="default" size="sm">Inactive</Badge>;
    }
    if (isLimitReached) {
      return <Badge variant="danger" size="sm">Limit Reached</Badge>;
    }
    if (isExpired) {
      return <Badge variant="default" size="sm">Expired</Badge>;
    }
    if (isScheduled) {
      return <Badge variant="info" size="sm">Scheduled</Badge>;
    }
    return <Badge variant="success" size="sm">Active</Badge>;
  };

  const usagePercentage = usage_limit ? (usage_count / usage_limit) * 100 : 0;

  return (
    <div
      className={`
        bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all
        ${!is_active || isExpired || isLimitReached ? 'opacity-60' : ''}
        ${compact ? 'p-3' : 'p-4'}
      `.trim()}
    >
      <div className="flex items-center gap-4">
        {/* Promotion Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-semibold text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}>
              {promotion_name}
            </h3>
            {coupon_code && (
              <Badge variant="warning" size="sm">
                {coupon_code}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            {getStatusBadge()}
            <Badge variant="primary" size="sm">
              {getPromotionTypeLabel()}
            </Badge>
          </div>

          {!compact && description && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-1">
              {description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            {/* Date Range */}
            {(start_date || end_date) && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>
                  {start_date && new Date(start_date).toLocaleDateString()}
                  {start_date && end_date && ' - '}
                  {end_date && new Date(end_date).toLocaleDateString()}
                </span>
              </div>
            )}

            {/* Usage */}
            {usage_limit && (
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>
                  {usage_count}/{usage_limit} used
                </span>
              </div>
            )}
          </div>

          {/* Usage Progress Bar (compact mode) */}
          {usage_limit && !compact && (
            <div className="mt-2 w-full max-w-xs bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  usagePercentage >= 100
                    ? 'bg-red-500'
                    : usagePercentage >= 75
                    ? 'bg-yellow-500'
                    : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* Discount Value */}
        <div className={`text-right ${compact ? 'min-w-24' : 'min-w-32'}`}>
          <p className={`font-bold text-blue-600 ${compact ? 'text-lg' : 'text-2xl'}`}>
            {getDiscountDisplay()}
          </p>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="ghost"
              icon={is_active ? ToggleRight : ToggleLeft}
              onClick={(e) => {
                e.stopPropagation();
                onToggleStatus(promotion);
              }}
              className={is_active ? 'text-green-600' : 'text-gray-400'}
              title={is_active ? 'Deactivate' : 'Activate'}
            />

            <Button
              size="sm"
              variant="ghost"
              icon={Edit}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(promotion);
              }}
              title="Edit Promotion"
            />

            <Button
              size="sm"
              variant="ghost"
              icon={Trash2}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(promotion);
              }}
              className="text-red-600 hover:bg-red-50"
              title="Delete Promotion"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PromotionListItem;
