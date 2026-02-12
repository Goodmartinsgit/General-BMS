import React from 'react';
import { Edit, Trash2, Eye, Star, AlertCircle, Package } from 'lucide-react';
import { Badge, Button } from '../ui';

/**
 * ProductListItem Component
 * Displays product information in a list/table row format
 */
const ProductListItem = ({
  product,
  onEdit,
  onDelete,
  onView,
  showActions = true,
  compact = false,
}) => {
  const {
    product_name,
    product_code,
    product_type,
    selling_price,
    cost_price,
    quantity_on_hand,
    reorder_level,
    is_active,
    is_featured,
    image_url,
    brand_name,
  } = product;

  const isLowStock = quantity_on_hand <= reorder_level;
  const profitMargin = selling_price && cost_price
    ? (((selling_price - cost_price) / selling_price) * 100).toFixed(1)
    : null;

  const productTypeColors = {
    physical: 'primary',
    service: 'info',
    digital: 'purple',
    bundle: 'warning',
  };

  return (
    <div
      className={`
        bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all
        ${!is_active ? 'opacity-60' : ''}
        ${compact ? 'p-3' : 'p-4'}
      `.trim()}
    >
      <div className="flex items-center gap-4">
        {/* Image */}
        <div className={`flex-shrink-0 ${compact ? 'w-12 h-12' : 'w-16 h-16'} bg-gray-100 rounded-lg overflow-hidden`}>
          {image_url ? (
            <img src={image_url} alt={product_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} text-gray-300`} />
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-1">
            <h3 className={`font-semibold text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}>
              {product_name}
            </h3>
            {is_featured && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs text-gray-500">{product_code}</span>
            <Badge variant={productTypeColors[product_type] || 'default'} size="sm">
              {product_type}
            </Badge>
            {!is_active && (
              <Badge variant="default" size="sm">
                Inactive
              </Badge>
            )}
            {isLowStock && (
              <Badge variant="danger" size="sm" icon={AlertCircle}>
                Low Stock
              </Badge>
            )}
          </div>

          {!compact && brand_name && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Brand:</span> {brand_name}
            </p>
          )}
        </div>

        {/* Price & Stock */}
        <div className={`flex-shrink-0 text-right ${compact ? 'space-y-1' : 'space-y-2'}`}>
          <div>
            <p className={`font-bold text-gray-900 ${compact ? 'text-base' : 'text-lg'}`}>
              ${parseFloat(selling_price || 0).toFixed(2)}
            </p>
            {profitMargin && !compact && (
              <p className="text-xs text-green-600">{profitMargin}% margin</p>
            )}
          </div>

          <div className="text-sm">
            <span className="text-gray-600">Stock: </span>
            <span className={`font-medium ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
              {quantity_on_hand || 0}
            </span>
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex-shrink-0 flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              icon={Eye}
              onClick={(e) => {
                e.stopPropagation();
                onView(product);
              }}
              title="View Details"
            />
            <Button
              size="sm"
              variant="ghost"
              icon={Edit}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(product);
              }}
              title="Edit Product"
            />
            <Button
              size="sm"
              variant="ghost"
              icon={Trash2}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(product);
              }}
              className="text-red-600 hover:bg-red-50"
              title="Delete Product"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductListItem;
