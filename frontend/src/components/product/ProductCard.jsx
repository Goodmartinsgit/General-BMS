import React from 'react';
import { Edit, Trash2, Eye, Star, AlertCircle, Package } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import usePermissions from '../../hooks/usePermissions';

const TYPE_BADGE = {
  physical: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  service:  'bg-sky-500/10 text-sky-500 border-sky-500/20',
  digital:  'bg-purple-500/10 text-purple-500 border-purple-500/20',
  bundle:   'bg-orange-500/10 text-orange-500 border-orange-500/20',
};

const ProductCard = ({ product, onEdit, onDelete, onView, showActions = true }) => {
  const { formatCurrency } = useCurrency();
  const { canViewFinancials } = usePermissions();
  const {
    product_name, product_code, product_type, cost_price,
    reorder_level, is_active, is_featured, image_url, brand_name, product_images
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
    <div
      onClick={() => onView(product)}
      className={`bg-theme-secondary border border-theme rounded-xl overflow-hidden hover:shadow-theme-md transition-shadow cursor-pointer flex flex-col ${!is_active ? 'opacity-60' : ''}`}
    >
      {/* Image */}
      <div className="relative aspect-square bg-theme-tertiary">
        {displayImage ? (
          <img src={displayImage} alt={product_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-14 h-14 text-theme-muted opacity-40" />
          </div>
        )}

        {/* Overlay badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5">
          {is_featured && (
            <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded border uppercase bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
              <Star className="w-2.5 h-2.5" /> Featured
            </span>
          )}
          {isLowStock && (
            <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded border uppercase bg-red-500/10 text-red-500 border-red-500/20">
              <AlertCircle className="w-2.5 h-2.5" /> Low Stock
            </span>
          )}
          {!is_active && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded border uppercase bg-theme-tertiary text-theme-muted border-theme">
              Inactive
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div>
          <p className="font-semibold text-theme-primary text-sm line-clamp-2 leading-tight mb-1">{product_name}</p>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-theme-muted">{product_code}</span>
            <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded border uppercase ${typeBadgeCls}`}>
              {product_type}
            </span>
          </div>
        </div>

        {brand_name && (
          <p className="text-xs text-theme-muted truncate">Brand: <span className="text-theme-secondary">{brand_name}</span></p>
        )}

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-theme">
          <div>
            <p className="text-lg font-bold text-accent-gold">
              {hasPriceRange ? `${formatCurrency(product.price_min)} – ${formatCurrency(product.price_max)}` : formatCurrency(displayPrice)}
            </p>
            {canViewFinancials && profitMargin && <p className="text-[10px] text-green-500">{profitMargin}% margin</p>}
          </div>
          <div className="text-right">
            <p className={`text-sm font-medium ${isLowStock ? 'text-red-500' : 'text-theme-secondary'}`}>
              {stockQty} units
            </p>
            <p className="text-[10px] text-theme-muted">In stock</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex items-center border-t border-theme" onClick={e => e.stopPropagation()}>
          <button onClick={() => onView(product)}
            className="flex-1 flex items-center justify-center gap-1 py-2 text-xs text-theme-muted hover:text-theme-primary hover:bg-theme-tertiary transition-colors">
            <Eye className="w-3.5 h-3.5" /> View
          </button>
          <div className="w-px h-4 bg-theme" />
          <button onClick={() => onEdit(product)}
            className="flex-1 flex items-center justify-center gap-1 py-2 text-xs text-theme-muted hover:text-theme-primary hover:bg-theme-tertiary transition-colors">
            <Edit className="w-3.5 h-3.5" /> Edit
          </button>
          <div className="w-px h-4 bg-theme" />
          <button onClick={() => onDelete(product)}
            className="flex-1 flex items-center justify-center gap-1 py-2 text-xs text-red-500 hover:bg-red-500/10 transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductCard;
