import React from 'react';
import { Edit, Trash2, Package, Barcode, TrendingUp, AlertCircle } from 'lucide-react';
import { Badge, Button } from '../ui';

/**
 * VariantListItem Component
 * Displays product variant information in a list/table row format
 */
const VariantListItem = ({
  variant,
  onEdit,
  onDelete,
  showActions = true,
  showStock = true,
  compact = false,
}) => {
  const {
    variant_name,
    sku,
    barcode,
    selling_price,
    cost_price,
    quantity_on_hand = 0,
    reorder_level = 0,
    is_active,
    attributes = [],
  } = variant;

  const isLowStock = quantity_on_hand <= reorder_level;
  const profitMargin = selling_price && cost_price
    ? (((selling_price - cost_price) / selling_price) * 100).toFixed(1)
    : null;

  return (
    <div
      className={`
        bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all
        ${!is_active ? 'opacity-60' : ''}
        ${compact ? 'p-3' : 'p-4'}
      `.trim()}
    >
      <div className="flex items-center gap-4">
        {/* Variant Icon */}
        <div className={`flex-shrink-0 ${compact ? 'w-10 h-10' : 'w-12 h-12'} bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center`}>
          <Package className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} text-blue-600`} />
        </div>

        {/* Variant Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-1">
            <h3 className={`font-semibold text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}>
              {variant_name}
            </h3>
            {!is_active && (
              <Badge variant="default" size="sm">
                Inactive
              </Badge>
            )}
            {isLowStock && showStock && (
              <Badge variant="danger" size="sm" icon={AlertCircle}>
                Low Stock
              </Badge>
            )}
          </div>

          {/* Attributes */}
          {attributes.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {attributes.map((attr, index) => (
                <Badge key={index} variant="default" size="sm">
                  {attr.name}: {attr.value}
                </Badge>
              ))}
            </div>
          )}

          {/* SKU and Barcode */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            {sku && (
              <div className="flex items-center gap-1">
                <Package className="w-3 h-3" />
                <span>{sku}</span>
              </div>
            )}
            {barcode && (
              <div className="flex items-center gap-1">
                <Barcode className="w-3 h-3" />
                <span>{barcode}</span>
              </div>
            )}
          </div>
        </div>

        {/* Price & Stock */}
        <div className={`flex-shrink-0 text-right ${compact ? 'space-y-1' : 'space-y-2'}`}>
          <div>
            <p className={`font-bold text-gray-900 ${compact ? 'text-base' : 'text-lg'}`}>
              ${parseFloat(selling_price || 0).toFixed(2)}
            </p>
            {profitMargin && !compact && (
              <div className="flex items-center justify-end gap-1 text-xs text-green-600">
                <TrendingUp className="w-3 h-3" />
                <span>{profitMargin}% margin</span>
              </div>
            )}
          </div>

          {showStock && (
            <div className="text-sm">
              <span className="text-gray-600">Stock: </span>
              <span className={`font-medium ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                {quantity_on_hand}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex-shrink-0 flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              icon={Edit}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(variant);
              }}
              title="Edit Variant"
            />
            <Button
              size="sm"
              variant="ghost"
              icon={Trash2}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(variant);
              }}
              className="text-red-600 hover:bg-red-50"
              title="Delete Variant"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default VariantListItem;
