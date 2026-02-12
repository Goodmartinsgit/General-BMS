import React from 'react';
import { Tag, Percent, DollarSign, Gift, TrendingUp, Calendar, Edit, Trash2, ToggleLeft, ToggleRight, Users, TrendingDown } from 'lucide-react';
import { Card, Badge, Button } from '../ui';

/**
 * PromotionCard Component
 * Displays promotion information in a card format
 */
const PromotionCard = ({
  promotion,
  onEdit,
  onDelete,
  onToggleStatus,
  showActions = true,
  className = '',
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
    min_purchase_amount,
    start_date,
    end_date,
    is_active,
    coupon_code,
    usage_limit,
    usage_count = 0,
    applies_to,
  } = promotion;

  // Get promotion type icon and display
  const getPromotionTypeInfo = () => {
    switch (promotion_type) {
      case 'percentage':
        return {
          icon: Percent,
          label: 'Percentage Off',
          value: `${discount_percentage}% OFF`,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
        };
      case 'fixed_amount':
        return {
          icon: DollarSign,
          label: 'Fixed Amount',
          value: `$${parseFloat(discount_amount).toFixed(2)} OFF`,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
        };
      case 'bogo':
        return {
          icon: Gift,
          label: 'BOGO',
          value: `Buy ${buy_quantity} Get ${get_quantity}`,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100',
        };
      case 'bulk_discount':
        return {
          icon: TrendingUp,
          label: 'Bulk Discount',
          value: `${discount_percentage}% OFF at ${min_quantity}+`,
          color: 'text-orange-600',
          bgColor: 'bg-orange-100',
        };
      default:
        return {
          icon: Tag,
          label: 'Discount',
          value: 'N/A',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
        };
    }
  };

  const typeInfo = getPromotionTypeInfo();
  const TypeIcon = typeInfo.icon;

  // Check if promotion is currently valid
  const now = new Date();
  const isScheduled = start_date && new Date(start_date) > now;
  const isExpired = end_date && new Date(end_date) < now;
  const isLimitReached = usage_limit && usage_count >= usage_limit;

  const getStatusBadge = () => {
    if (!is_active) {
      return <Badge variant="default">Inactive</Badge>;
    }
    if (isLimitReached) {
      return <Badge variant="danger">Limit Reached</Badge>;
    }
    if (isExpired) {
      return <Badge variant="default">Expired</Badge>;
    }
    if (isScheduled) {
      return <Badge variant="info">Scheduled</Badge>;
    }
    return <Badge variant="success">Active</Badge>;
  };

  const usagePercentage = usage_limit ? (usage_count / usage_limit) * 100 : 0;

  return (
    <Card
      hoverable
      className={`${!is_active || isExpired || isLimitReached ? 'opacity-60' : ''} ${className}`.trim()}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          <div className={`w-12 h-12 ${typeInfo.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
            <TypeIcon className={`w-6 h-6 ${typeInfo.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 mb-1">{promotion_name}</h3>
            <div className="flex flex-wrap items-center gap-2">
              {getStatusBadge()}
              <Badge variant="primary" size="sm">{typeInfo.label}</Badge>
              {coupon_code && (
                <Badge variant="warning" size="sm">Code: {coupon_code}</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Discount Value - Prominent Display */}
      <div className={`p-4 ${typeInfo.bgColor} rounded-lg mb-4`}>
        <p className={`text-3xl font-bold ${typeInfo.color} text-center`}>
          {typeInfo.value}
        </p>
      </div>

      {/* Description */}
      {description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {description}
        </p>
      )}

      {/* Details */}
      <div className="space-y-2 mb-4">
        {/* Date Range */}
        {(start_date || end_date) && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-600">
              {start_date && new Date(start_date).toLocaleDateString()}
              {start_date && end_date && ' - '}
              {end_date && new Date(end_date).toLocaleDateString()}
              {!start_date && end_date && `Until ${new Date(end_date).toLocaleDateString()}`}
              {start_date && !end_date && `From ${new Date(start_date).toLocaleDateString()}`}
            </span>
          </div>
        )}

        {/* Minimum Purchase */}
        {min_purchase_amount && (
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-600">
              Min. purchase: ${parseFloat(min_purchase_amount).toFixed(2)}
            </span>
          </div>
        )}

        {/* Applies To */}
        <div className="flex items-center gap-2 text-sm">
          <Tag className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-gray-600">
            Applies to: {applies_to === 'all' ? 'All Products' : applies_to === 'products' ? 'Specific Products' : 'Specific Categories'}
          </span>
        </div>

        {/* Usage Stats */}
        {usage_limit && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-600">Usage:</span>
              </div>
              <span className="font-medium text-gray-900">
                {usage_count} / {usage_limit}
              </span>
            </div>
            {/* Usage Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
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
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
          <Button
            size="sm"
            variant="outline"
            icon={is_active ? ToggleRight : ToggleLeft}
            onClick={(e) => {
              e.stopPropagation();
              onToggleStatus(promotion);
            }}
            className={is_active ? 'text-green-600 border-green-600' : ''}
          >
            {is_active ? 'Active' : 'Inactive'}
          </Button>

          <Button
            size="sm"
            variant="outline"
            icon={Edit}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(promotion);
            }}
            className="flex-1"
          >
            Edit
          </Button>

          <Button
            size="sm"
            variant="ghost"
            icon={Trash2}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(promotion);
            }}
            className="text-red-600 hover:bg-red-50"
          />
        </div>
      )}

      {/* Warning Messages */}
      {isExpired && is_active && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            This promotion has expired. Consider deactivating it.
          </p>
        </div>
      )}

      {isLimitReached && is_active && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            Usage limit reached. This promotion can no longer be applied.
          </p>
        </div>
      )}
    </Card>
  );
};

export default PromotionCard;
