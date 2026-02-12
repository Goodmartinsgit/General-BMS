import React, { useState } from 'react';
import {
  Package,
  DollarSign,
  TrendingUp,
  Warehouse,
  Star,
  AlertCircle,
  Edit,
  Trash2,
  Tag,
  Calendar,
  User,
  MapPin,
  BarChart3,
} from 'lucide-react';
import { Card, Badge, Button, Tabs } from '../ui';

/**
 * ProductDetailView Component
 * Comprehensive detailed view of a product with all information
 */
const ProductDetailView = ({
  product,
  onEdit,
  onDelete,
  onClose,
  showActions = true,
  className = '',
}) => {
  const {
    product_name,
    product_code,
    product_type,
    description,
    selling_price,
    cost_price,
    quantity_on_hand,
    reorder_level,
    is_active,
    is_featured,
    image_url,
    model_images = [],
    brand_name,
    category_name,
    tags = [],
    track_inventory,
    has_variants,
    track_serial_numbers,
    track_batches,
    created_at,
    updated_at,
    created_by_name,
  } = product;

  const isLowStock = quantity_on_hand <= reorder_level;
  const profitMargin = selling_price && cost_price
    ? (((selling_price - cost_price) / selling_price) * 100).toFixed(1)
    : null;
  const profitAmount = selling_price && cost_price
    ? (selling_price - cost_price).toFixed(2)
    : null;

  const productTypeColors = {
    physical: 'primary',
    service: 'info',
    digital: 'purple',
    bundle: 'warning',
  };

  const allImages = [image_url, ...model_images].filter(Boolean);
  const [selectedImage, setSelectedImage] = useState(0);

  // Tabs for detailed information
  const tabs = [
    {
      label: 'Overview',
      content: (
        <div className="space-y-6">
          {/* Main Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <InfoItem
                icon={Package}
                label="Product Code"
                value={product_code}
              />
              <InfoItem
                icon={Tag}
                label="Product Type"
                value={
                  <Badge variant={productTypeColors[product_type] || 'default'}>
                    {product_type}
                  </Badge>
                }
              />
              {brand_name && (
                <InfoItem
                  icon={Tag}
                  label="Brand"
                  value={brand_name}
                />
              )}
              {category_name && (
                <InfoItem
                  icon={Tag}
                  label="Category"
                  value={category_name}
                />
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <InfoItem
                icon={Calendar}
                label="Created"
                value={new Date(created_at).toLocaleDateString()}
              />
              <InfoItem
                icon={Calendar}
                label="Last Updated"
                value={new Date(updated_at).toLocaleDateString()}
              />
              {created_by_name && (
                <InfoItem
                  icon={User}
                  label="Created By"
                  value={created_by_name}
                />
              )}
            </div>
          </div>

          {/* Description */}
          {description && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {description}
              </p>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <Badge key={index} variant="default" size="sm">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Status Flags */}
          <div className="flex flex-wrap gap-3">
            <StatusFlag
              icon={is_active ? Package : AlertCircle}
              label={is_active ? 'Active' : 'Inactive'}
              variant={is_active ? 'success' : 'default'}
            />
            {is_featured && (
              <StatusFlag
                icon={Star}
                label="Featured"
                variant="warning"
              />
            )}
            {track_inventory && (
              <StatusFlag
                icon={Warehouse}
                label="Inventory Tracked"
                variant="info"
              />
            )}
            {has_variants && (
              <StatusFlag
                icon={Package}
                label="Has Variants"
                variant="primary"
              />
            )}
            {track_serial_numbers && (
              <StatusFlag
                icon={BarChart3}
                label="Serial Numbers Tracked"
                variant="purple"
              />
            )}
            {track_batches && (
              <StatusFlag
                icon={Package}
                label="Batches Tracked"
                variant="purple"
              />
            )}
          </div>
        </div>
      ),
    },
    {
      label: 'Pricing',
      content: (
        <div className="space-y-6">
          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PricingCard
              icon={DollarSign}
              label="Selling Price"
              value={`$${parseFloat(selling_price || 0).toFixed(2)}`}
              variant="primary"
            />
            <PricingCard
              icon={DollarSign}
              label="Cost Price"
              value={cost_price ? `$${parseFloat(cost_price).toFixed(2)}` : 'Not set'}
              variant="default"
            />
            <PricingCard
              icon={TrendingUp}
              label="Profit Per Unit"
              value={profitAmount ? `$${profitAmount}` : 'N/A'}
              variant="success"
              subValue={profitMargin ? `${profitMargin}% margin` : null}
            />
          </div>

          {/* Profit Breakdown */}
          {profitMargin && (
            <Card>
              <h4 className="text-sm font-medium text-gray-700 mb-4">Profit Analysis</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Selling Price</span>
                  <span className="font-medium text-gray-900">
                    ${parseFloat(selling_price).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Cost Price</span>
                  <span className="font-medium text-gray-900">
                    -${parseFloat(cost_price).toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">Profit</span>
                  <span className="font-bold text-green-600 text-lg">
                    ${profitAmount}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Profit Margin</span>
                  <span className="font-semibold text-green-600">{profitMargin}%</span>
                </div>
              </div>
            </Card>
          )}
        </div>
      ),
    },
    {
      label: 'Inventory',
      content: (
        <div className="space-y-6">
          {/* Stock Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className={isLowStock ? 'border-red-300 bg-red-50' : ''}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Current Stock</p>
                  <p className={`text-3xl font-bold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                    {quantity_on_hand || 0}
                  </p>
                  {isLowStock && (
                    <div className="flex items-center gap-1 mt-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-600 font-medium">Low Stock!</span>
                    </div>
                  )}
                </div>
                <Warehouse className={`w-12 h-12 ${isLowStock ? 'text-red-400' : 'text-gray-300'}`} />
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Reorder Level</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {reorder_level || 0}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">Alert threshold</p>
                </div>
                <AlertCircle className="w-12 h-12 text-gray-300" />
              </div>
            </Card>
          </div>

          {/* Inventory Value */}
          {cost_price && (
            <Card>
              <h4 className="text-sm font-medium text-gray-700 mb-4">Inventory Value</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Units on Hand</span>
                  <span className="font-medium text-gray-900">{quantity_on_hand || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Cost Per Unit</span>
                  <span className="font-medium text-gray-900">
                    ${parseFloat(cost_price).toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">Total Value</span>
                  <span className="font-bold text-blue-600 text-lg">
                    ${((quantity_on_hand || 0) * parseFloat(cost_price)).toFixed(2)}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Stock Tracking Options */}
          <Card>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Tracking Options</h4>
            <div className="space-y-2">
              <TrackingOption
                label="Inventory Tracking"
                enabled={track_inventory}
              />
              <TrackingOption
                label="Serial Numbers"
                enabled={track_serial_numbers}
              />
              <TrackingOption
                label="Batch/Lot Tracking"
                enabled={track_batches}
              />
              <TrackingOption
                label="Product Variants"
                enabled={has_variants}
              />
            </div>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div className={`bg-white rounded-lg ${className}`.trim()}>
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{product_name}</h2>
              {is_featured && <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={productTypeColors[product_type] || 'default'}>
                {product_type}
              </Badge>
              {!is_active && <Badge variant="default">Inactive</Badge>}
              {isLowStock && (
                <Badge variant="danger" icon={AlertCircle}>
                  Low Stock
                </Badge>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {showActions && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                icon={Edit}
                onClick={() => onEdit(product)}
              >
                Edit
              </Button>
              <Button
                variant="danger"
                icon={Trash2}
                onClick={() => onDelete(product)}
              >
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Image Gallery */}
      {allImages.length > 0 && (
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Main Image */}
            <div className="md:col-span-2">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={allImages[selectedImage]}
                  alt={product_name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Thumbnail Gallery */}
            <div className="space-y-2">
              {allImages.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`
                    w-full aspect-square bg-gray-100 rounded-lg overflow-hidden transition-all
                    ${selectedImage === index
                      ? 'ring-2 ring-blue-600 opacity-100'
                      : 'opacity-60 hover:opacity-100'
                    }
                  `.trim()}
                >
                  <img
                    src={img}
                    alt={`${product_name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content Tabs */}
      <div className="p-6">
        <Tabs tabs={tabs} />
      </div>
    </div>
  );
};

// Helper Components

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
      <Icon className="w-5 h-5 text-gray-600" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <div className="text-sm font-medium text-gray-900">{value}</div>
    </div>
  </div>
);

const StatusFlag = ({ icon: Icon, label, variant = 'default' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    primary: 'bg-blue-100 text-blue-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-cyan-100 text-cyan-700',
    purple: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className={`px-3 py-2 rounded-lg flex items-center gap-2 ${variants[variant]}`.trim()}>
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
};

const PricingCard = ({ icon: Icon, label, value, variant = 'default', subValue }) => {
  const variants = {
    default: 'bg-gray-50 text-gray-900',
    primary: 'bg-blue-50 text-blue-900',
    success: 'bg-green-50 text-green-900',
  };

  return (
    <Card className={variants[variant]}>
      <div className="flex items-center gap-3 mb-2">
        <Icon className="w-5 h-5" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {subValue && <p className="text-sm mt-1 opacity-75">{subValue}</p>}
    </Card>
  );
};

const TrackingOption = ({ label, enabled }) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm text-gray-700">{label}</span>
    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
      enabled
        ? 'bg-green-100 text-green-700'
        : 'bg-gray-100 text-gray-500'
    }`}>
      {enabled ? 'Enabled' : 'Disabled'}
    </div>
  </div>
);

export default ProductDetailView;
