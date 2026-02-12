import React from 'react';
import { Edit, Trash2, Star, Package, AlertCircle } from 'lucide-react';
import { Card, Badge, Button, Dropdown } from '../ui';

/**
 * ProductCard Component
 * Displays product information in a card format (grid view)
 */
const ProductCard = ({
  product,
  onEdit,
  onDelete,
  onView,
  showActions = true,
  className = '',
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

  const dropdownItems = [
    { label: 'Edit', icon: Edit, onClick: () => onEdit(product) },
    { label: 'View Details', icon: Package, onClick: () => onView(product) },
    { divider: true },
    { label: 'Delete', icon: Trash2, onClick: () => onDelete(product), danger: true },
  ];

  return (
    <Card
      hoverable
      onClick={() => onView(product)}
      className={`h-full ${!is_active ? 'opacity-60' : ''} ${className}`.trim()}
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
        {image_url ? (
          <img
            src={image_url}
            alt={product_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-16 h-16 text-gray-300" />
          </div>
        )}

        {/* Badges overlay */}
        <div className="absolute top-2 left-2 flex flex-col gap-2">
          {is_featured && (
            <Badge variant="warning" size="sm" icon={Star}>
              Featured
            </Badge>
          )}
          {isLowStock && (
            <Badge variant="danger" size="sm" icon={AlertCircle}>
              Low Stock
            </Badge>
          )}
          {!is_active && (
            <Badge variant="default" size="sm">
              Inactive
            </Badge>
          )}
        </div>

        {/* Actions dropdown */}
        {showActions && (
          <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
            <Dropdown
              items={dropdownItems}
              align="right"
              trigger={
                <button className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
              }
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Header */}
        <div>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 line-clamp-2">{product_name}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{product_code}</span>
            <Badge variant={productTypeColors[product_type] || 'default'} size="sm">
              {product_type}
            </Badge>
          </div>
        </div>

        {/* Brand */}
        {brand_name && (
          <p className="text-sm text-gray-600">
            <span className="font-medium">Brand:</span> {brand_name}
          </p>
        )}

        {/* Pricing */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Price:</span>
            <span className="text-lg font-bold text-gray-900">
              ${parseFloat(selling_price || 0).toFixed(2)}
            </span>
          </div>
          {profitMargin && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Margin:</span>
              <span className="text-green-600 font-medium">{profitMargin}%</span>
            </div>
          )}
        </div>

        {/* Stock */}
        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Stock:</span>
            <span className={`font-medium ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
              {quantity_on_hand || 0} units
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProductCard;
