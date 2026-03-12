import React, { useState } from 'react';
import {
  Package, TrendingUp, Warehouse, Star, AlertCircle, AlertTriangle,
  Edit, Trash2, Tag, Calendar, User, BarChart3, CheckCircle, XCircle,
  Eye, ChevronLeft, ChevronRight, Globe, Layers,
} from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

/**
 * ProductDetailView Component
 * Comprehensive themed product detail view for the modal in /product-catalog
 */
const ProductDetailView = ({
  product,
  onEdit,
  onDelete,
  onClose,
  showActions = true,
  className = '',
}) => {
  const { formatCurrency } = useCurrency();

  const {
    product_name,
    product_code,
    product_type,
    description,
    selling_price,
    retail_price,
    cost_price,
    wholesale_base_price,
    quantity_on_hand,
    total_stock,
    reorder_level = 10,
    is_active,
    is_featured,
    image_url,
    product_images = [],
    model_images = [],
    brand_name,
    category_name,
    sub_category_name,
    tags = [],
    track_inventory,
    has_variants,
    has_colors,
    track_serial_numbers,
    track_batches,
    created_at,
    updated_at,
    created_by_name,
    barcode,
    base_unit,
    unit_of_measure,
    is_online_available,
    tax_rate,
    commission_amount,
    weight_per_unit,
    view_count,
    sale_count,
    short_description,
  } = product;

  const price = retail_price || selling_price || 0;
  const stock = total_stock ?? quantity_on_hand ?? 0;
  const isLowStock = stock <= (reorder_level || 10);
  const profitPerUnit = price && cost_price ? price - cost_price : null;
  const profitMargin = profitPerUnit !== null && price
    ? ((profitPerUnit / price) * 100).toFixed(1)
    : null;

  // Collect all images
  const allImages = [
    ...(Array.isArray(product_images) ? product_images.map(img => typeof img === 'object' && img !== null ? img.image_url : img) : []),
    image_url,
    ...(Array.isArray(model_images) ? model_images.map(img => typeof img === 'object' && img !== null ? img.image_url : img) : []),
  ].filter(Boolean);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');

  const typeStyles = {
    physical: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
    service:  'bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700',
    digital:  'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
    bundle:   'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
  };

  const tabs = [
    { key: 'overview',  label: 'Overview' },
    { key: 'pricing',   label: 'Pricing' },
    { key: 'inventory', label: 'Inventory' },
  ];

  const renderStockBadge = () => {
    if (stock <= 0) return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
        <XCircle className="w-3.5 h-3.5" /> Out of Stock
      </span>
    );
    if (isLowStock) return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
        <AlertTriangle className="w-3.5 h-3.5" /> Low Stock
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
        <CheckCircle className="w-3.5 h-3.5" /> In Stock
      </span>
    );
  };

  // ─── Overview Tab ──────────────────────────────────────────────────
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InfoRow icon={Package} label="Product Code" value={
          <span className="font-mono text-sm px-2 py-0.5 rounded bg-accent-gold/10 text-accent-gold border border-accent-gold/30">
            {product_code}
          </span>
        } />
        <InfoRow icon={Tag} label="Product Type" value={
          <span className={`px-2 py-0.5 text-xs font-bold rounded border uppercase ${typeStyles[product_type] || typeStyles.physical}`}>
            {product_type || 'physical'}
          </span>
        } />
        {brand_name && <InfoRow icon={Tag} label="Brand" value={brand_name} />}
        {category_name && <InfoRow icon={Layers} label="Category" value={category_name} />}
        {sub_category_name && <InfoRow icon={Layers} label="Sub-Category" value={sub_category_name} />}
        {barcode && <InfoRow icon={BarChart3} label="Barcode" value={barcode} />}
        {(base_unit || unit_of_measure) && <InfoRow icon={Package} label="Unit" value={unit_of_measure || base_unit} />}
        {weight_per_unit && <InfoRow icon={Package} label="Weight" value={`${weight_per_unit} kg`} />}
        <InfoRow icon={Calendar} label="Created" value={created_at ? new Date(created_at).toLocaleDateString() : '—'} />
        <InfoRow icon={Calendar} label="Updated" value={updated_at ? new Date(updated_at).toLocaleDateString() : '—'} />
        {created_by_name && <InfoRow icon={User} label="Created By" value={created_by_name} />}
      </div>

      {/* Description */}
      {(description || short_description) && (
        <div>
          <h4 className="text-sm font-semibold text-theme-secondary mb-2">Description</h4>
          <p className="text-sm text-theme-muted leading-relaxed whitespace-pre-line">
            {description || short_description}
          </p>
        </div>
      )}

      {/* Tags */}
      {Array.isArray(tags) && tags.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-theme-secondary mb-2">Tags</h4>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, i) => (
              <span key={i} className="px-2.5 py-1 text-xs font-medium rounded-full bg-theme-tertiary text-theme-secondary border border-theme">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Status Flags */}
      <div className="flex flex-wrap gap-2">
        <StatusPill icon={is_active ? CheckCircle : XCircle} label={is_active ? 'Active' : 'Inactive'}
          cls={is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-theme-tertiary text-theme-muted'} />
        {is_featured && (
          <StatusPill icon={Star} label="Featured" cls="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" />
        )}
        {is_online_available && (
          <StatusPill icon={Globe} label="Online" cls="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" />
        )}
        {has_variants && (
          <StatusPill icon={Layers} label="Has Variants" cls="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" />
        )}
        {has_colors && (
          <StatusPill icon={Layers} label="Has Colors" cls="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300" />
        )}
        {track_serial_numbers && (
          <StatusPill icon={BarChart3} label="Serial Numbers" cls="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300" />
        )}
        {track_batches && (
          <StatusPill icon={Package} label="Batch Tracking" cls="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" />
        )}
      </div>
    </div>
  );

  // ─── Pricing Tab ───────────────────────────────────────────────────
  const renderPricing = () => (
    <div className="space-y-6">
      {/* Pricing Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <PriceCard label="Selling Price" value={formatCurrency(price)} accent="text-accent-gold" bg="bg-accent-gold/10 border-accent-gold/20" />
        <PriceCard label="Cost Price" value={cost_price ? formatCurrency(cost_price) : '—'} accent="text-theme-primary" bg="bg-theme-tertiary border-theme" />
        <PriceCard label="Profit / Unit"
          value={profitPerUnit !== null ? formatCurrency(profitPerUnit) : '—'}
          sub={profitMargin ? `${profitMargin}% margin` : null}
          accent={profitPerUnit !== null && profitPerUnit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
          bg={profitPerUnit !== null && profitPerUnit >= 0
            ? 'bg-green-500/10 border-green-500/20'
            : 'bg-red-500/10 border-red-500/20'}
        />
      </div>

      {/* Additional pricing info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {wholesale_base_price && (
          <PriceCard label="Wholesale Price" value={formatCurrency(wholesale_base_price)} accent="text-theme-primary" bg="bg-theme-tertiary border-theme" />
        )}
        {tax_rate > 0 && (
          <PriceCard label="Tax Rate" value={`${tax_rate}%`} accent="text-theme-primary" bg="bg-theme-tertiary border-theme" />
        )}
        {commission_amount > 0 && (
          <PriceCard label="Commission" value={formatCurrency(commission_amount)} accent="text-theme-primary" bg="bg-theme-tertiary border-theme" />
        )}
      </div>

      {/* Profit Breakdown */}
      {profitMargin && (
        <div className="rounded-xl border border-theme bg-theme-secondary p-5">
          <h4 className="text-sm font-semibold text-theme-secondary mb-4">Profit Analysis</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-theme-muted">Selling Price</span>
              <span className="font-medium text-theme-primary">{formatCurrency(price)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-theme-muted">Cost Price</span>
              <span className="font-medium text-theme-primary">-{formatCurrency(cost_price)}</span>
            </div>
            <div className="border-t border-theme pt-3 flex justify-between items-center">
              <span className="text-sm font-semibold text-theme-primary">Profit</span>
              <span className={`font-bold text-lg ${profitPerUnit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(profitPerUnit)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-theme-muted">Margin</span>
              <span className={`font-semibold ${parseFloat(profitMargin) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {profitMargin}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ─── Inventory Tab ─────────────────────────────────────────────────
  const renderInventory = () => (
    <div className="space-y-6">
      {/* Stock Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={`rounded-xl border p-5 ${isLowStock ? 'border-red-400 dark:border-red-600 bg-red-500/5' : 'border-theme bg-theme-secondary'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-theme-muted mb-1">Current Stock</p>
              <p className={`text-3xl font-bold ${isLowStock ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                {stock}
              </p>
              <p className="text-xs text-theme-muted mt-1">{unit_of_measure || base_unit || 'units'}</p>
              {isLowStock && (
                <div className="flex items-center gap-1 mt-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-xs text-red-600 dark:text-red-400 font-medium">Low Stock!</span>
                </div>
              )}
            </div>
            <Warehouse className={`w-10 h-10 ${isLowStock ? 'text-red-400/40' : 'text-theme-muted/30'}`} />
          </div>
        </div>

        <div className="rounded-xl border border-theme bg-theme-secondary p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-theme-muted mb-1">Reorder Level</p>
              <p className="text-3xl font-bold text-theme-primary">{reorder_level || 0}</p>
              <p className="text-xs text-theme-muted mt-1">Alert threshold</p>
            </div>
            <AlertCircle className="w-10 h-10 text-theme-muted/30" />
          </div>
        </div>
      </div>

      {/* Inventory Value */}
      {cost_price && (
        <div className="rounded-xl border border-theme bg-theme-secondary p-5">
          <h4 className="text-sm font-semibold text-theme-secondary mb-4">Inventory Value</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-theme-muted">Units on Hand</span>
              <span className="font-medium text-theme-primary">{stock}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-theme-muted">Cost Per Unit</span>
              <span className="font-medium text-theme-primary">{formatCurrency(cost_price)}</span>
            </div>
            <div className="border-t border-theme pt-3 flex justify-between items-center">
              <span className="text-sm font-semibold text-theme-primary">Total Value</span>
              <span className="font-bold text-accent-gold text-lg">
                {formatCurrency(stock * parseFloat(cost_price))}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tracking Options */}
      <div className="rounded-xl border border-theme bg-theme-secondary p-5">
        <h4 className="text-sm font-semibold text-theme-secondary mb-3">Tracking Options</h4>
        <div className="space-y-2">
          <TrackingRow label="Inventory Tracking" enabled={track_inventory} />
          <TrackingRow label="Serial Numbers" enabled={track_serial_numbers} />
          <TrackingRow label="Batch/Lot Tracking" enabled={track_batches} />
          <TrackingRow label="Product Variants" enabled={has_variants} />
          <TrackingRow label="Color Variants" enabled={has_colors} />
        </div>
      </div>
    </div>
  );

  return (
    <div className={`bg-theme-secondary rounded-2xl overflow-hidden ${className}`.trim()}>
      {/* ── Header ── */}
      <div className="border-b border-theme px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold text-theme-primary truncate">{product_name}</h2>
              {is_featured && <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-0.5 text-xs font-bold rounded border uppercase ${typeStyles[product_type] || typeStyles.physical}`}>
                {product_type || 'physical'}
              </span>
              {!is_active && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-theme-tertiary text-theme-muted border border-theme">
                  Inactive
                </span>
              )}
              {renderStockBadge()}
              {is_online_available && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700">
                  <Globe className="w-3 h-3" /> Online
                </span>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-4 text-center flex-shrink-0">
            <div>
              <div className="flex items-center justify-center gap-1 text-theme-muted mb-0.5">
                <Eye className="w-3 h-3" /><span className="text-[10px]">Views</span>
              </div>
              <p className="text-sm font-bold text-theme-primary">{view_count || 0}</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-theme-muted mb-0.5">
                <BarChart3 className="w-3 h-3" /><span className="text-[10px]">Sales</span>
              </div>
              <p className="text-sm font-bold text-theme-primary">{sale_count || 0}</p>
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => onEdit(product)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-accent-gold rounded-lg hover:bg-accent-goldDark transition-colors">
                <Edit className="w-4 h-4" /> Edit
              </button>
              <button onClick={() => onDelete(product)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Image Gallery ── */}
      {allImages.length > 0 && (
        <div className="px-6 py-5 border-b border-theme">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Main Image */}
            <div className="md:col-span-3">
              <div className="aspect-[16/10] bg-theme-tertiary rounded-xl overflow-hidden">
                <img
                  src={allImages[selectedImage]}
                  alt={product_name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:max-h-[280px]">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`flex-shrink-0 w-16 h-16 md:w-full md:h-auto md:aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === i
                        ? 'border-accent-gold ring-2 ring-accent-gold/30 opacity-100'
                        : 'border-theme opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`${product_name} ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="px-6 pt-4">
        <div className="flex gap-1 border-b border-theme">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-accent-gold text-accent-gold'
                  : 'border-transparent text-theme-muted hover:text-theme-primary hover:border-theme'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="px-6 py-5">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'pricing' && renderPricing()}
        {activeTab === 'inventory' && renderInventory()}
      </div>
    </div>
  );
};

// ── Helper Components ────────────────────────────────────────────────

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3">
    <div className="w-9 h-9 bg-theme-tertiary border border-theme rounded-lg flex items-center justify-center flex-shrink-0">
      <Icon className="w-4 h-4 text-theme-muted" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[11px] text-theme-muted uppercase tracking-wide">{label}</p>
      <div className="text-sm font-medium text-theme-primary truncate">{value}</div>
    </div>
  </div>
);

const StatusPill = ({ icon: Icon, label, cls }) => (
  <div className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold ${cls}`}>
    <Icon className="w-3.5 h-3.5" />
    {label}
  </div>
);

const PriceCard = ({ label, value, sub, accent, bg }) => (
  <div className={`rounded-xl border p-4 ${bg}`}>
    <p className="text-xs text-theme-muted mb-1">{label}</p>
    <p className={`text-xl font-bold ${accent}`}>{value}</p>
    {sub && <p className="text-xs mt-1 text-theme-muted">{sub}</p>}
  </div>
);

const TrackingRow = ({ label, enabled }) => (
  <div className="flex items-center justify-between py-1.5">
    <span className="text-sm text-theme-secondary">{label}</span>
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
      enabled
        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
        : 'bg-theme-tertiary text-theme-muted'
    }`}>
      {enabled ? 'Enabled' : 'Disabled'}
    </span>
  </div>
);

export default ProductDetailView;
