import React from 'react';
import { Edit, Trash2, Eye, Star, AlertCircle, Package } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

const TYPE_BADGE = {
  physical: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  service:  'bg-sky-500/10 text-sky-500 border-sky-500/20',
  digital:  'bg-purple-500/10 text-purple-500 border-purple-500/20',
  bundle:   'bg-orange-500/10 text-orange-500 border-orange-500/20',
};

const ProductListItem = ({ product, onEdit, onDelete, onView, showActions = true, compact = false }) => {
  const { formatCurrency } = useCurrency();
  const {
    product_name, product_code, product_type, cost_price,
    reorder_level, is_active, is_featured, image_url, brand_name, product_images,
  } = product;

  const stockQty     = product.total_stock ?? product.quantity_on_hand ?? 0;
  const displayPrice = product.effective_price || product.retail_price || product.selling_price || 0;
  const isLowStock   = stockQty <= (reorder_level ?? 0);
  const hasPriceRange = product.price_min && product.price_max && product.price_min !== product.price_max;
  const profitMargin = !hasPriceRange && displayPrice && cost_price
    ? (((displayPrice - cost_price) / displayPrice) * 100).toFixed(1)
    : null;

  const typeBadgeCls = TYPE_BADGE[product_type] || 'bg-theme-tertiary text-theme-muted border-theme';

  const displayImage = (() => {
    if (product_images && Array.isArray(product_images) && product_images.length > 0) {
      const firstImage = product_images[0];
      return typeof firstImage === 'object' && firstImage !== null ? firstImage.image_url : firstImage;
    }
    if (image_url) return image_url;
    // Fallback to category assignment images
    if (product.category_assignments && product.category_assignments.length > 0) {
      const withImage = product.category_assignments.find(a => a.image_url);
      if (withImage) return withImage.image_url;
    }
    return null;
  })();

  return (
    <div className={`bg-theme-secondary border border-theme rounded-xl hover:shadow-theme-sm transition-shadow ${!is_active ? 'opacity-60' : ''} ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-center gap-4">
        {/* Image */}
        <div className={`flex-shrink-0 ${compact ? 'w-10 h-10' : 'w-14 h-14'} bg-theme-tertiary rounded-lg overflow-hidden`}>
          {displayImage ? (
            <img src={displayImage} alt={product_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className={`${compact ? 'w-5 h-5' : 'w-7 h-7'} text-theme-muted opacity-40`} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className={`font-semibold text-theme-primary truncate ${compact ? 'text-sm' : 'text-base'}`}>
              {product_name}
            </p>
            {is_featured && <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className="text-[10px] font-mono text-theme-muted">{product_code}</span>
            <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded border uppercase ${typeBadgeCls}`}>
              {product_type}
            </span>
            {!is_active && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded border uppercase bg-theme-tertiary text-theme-muted border-theme">
                Inactive
              </span>
            )}
            {isLowStock && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded border uppercase bg-red-500/10 text-red-500 border-red-500/20">
                <AlertCircle className="w-2.5 h-2.5" /> Low Stock
              </span>
            )}
          </div>

          {!compact && brand_name && (
            <p className="text-xs text-theme-muted">Brand: <span className="text-theme-secondary">{brand_name}</span></p>
          )}
        </div>

        {/* Price & Stock */}
        <div className={`flex-shrink-0 text-right ${compact ? 'space-y-0.5' : 'space-y-1'}`}>
          <p className={`font-bold text-accent-gold ${compact ? 'text-base' : 'text-lg'}`}>
            {hasPriceRange ? `${formatCurrency(product.price_min)} – ${formatCurrency(product.price_max)}` : formatCurrency(displayPrice)}
          </p>
          {profitMargin && !compact && (
            <p className="text-[10px] text-green-500">{profitMargin}% margin</p>
          )}
          <p className={`text-xs font-medium ${isLowStock ? 'text-red-500' : 'text-theme-secondary'}`}>
            Stock: {stockQty}
          </p>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex-shrink-0 flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
            <button onClick={() => onView(product)} title="View"
              className="p-1.5 text-theme-muted hover:text-theme-primary hover:bg-theme-tertiary rounded-lg border border-theme transition-colors">
              <Eye className="w-4 h-4" />
            </button>
            <button onClick={() => onEdit(product)} title="Edit"
              className="p-1.5 text-theme-muted hover:text-theme-primary hover:bg-theme-tertiary rounded-lg border border-theme transition-colors">
              <Edit className="w-4 h-4" />
            </button>
            <button onClick={() => onDelete(product)} title="Delete"
              className="p-1.5 text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductListItem;
