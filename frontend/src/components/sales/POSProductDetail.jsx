import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, ShoppingCart, Package, Minus, Plus, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useCurrency } from '../../context/CurrencyContext';
import { productAPI } from '../../api/products';
import { LoadingSpinner } from '../ui';

/**
 * POS Product Detail — mimics the store's single product page.
 * Supports: image gallery, variants, category-attribute picking, add-to-cart.
 */
const POSProductDetail = ({ productId, onBack }) => {
    const { addToCart } = useCart();
    const { formatCurrency } = useCurrency();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    // Selection state
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [selectedColorId, setSelectedColorId] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [added, setAdded] = useState(false);

    // Category attribute selection (multi-level hierarchy)
    const [leafSelections, setLeafSelections] = useState([]);

    // Fetch product details (includes variants, colors, images, assignments)
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setSelectedVariant(null);
        setSelectedColorId(null);
        setQuantity(1);
        setLeafSelections([]);
        setActiveImageIndex(0);
        setAdded(false);

        (async () => {
            try {
                const prod = await productAPI.getProduct(productId);
                if (cancelled) return;
                setProduct(prod);
                // Auto-select first variant
                if (prod.variants?.length > 0) setSelectedVariant(prod.variants[0]);
            } catch (err) {
                console.error('Failed to load product detail', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [productId]);

    // ── Images ──
    const allImages = useMemo(() => {
        if (!product) return [];
        const imgs = [];
        if (product.images?.length) {
            product.images.forEach(img => {
                const url = typeof img === 'object' ? img.image_url : img;
                if (url) imgs.push({ url, colorId: img.color_id || null });
            });
        }
        if (product.image_url && !imgs.find(i => i.url === product.image_url)) {
            imgs.push({ url: product.image_url, colorId: null });
        }
        if (imgs.length === 0 && product.category_assignments?.length) {
            product.category_assignments.forEach(a => {
                if (a.image_url) imgs.push({ url: a.image_url, colorId: null });
            });
        }
        return imgs;
    }, [product]);

    const filteredImages = useMemo(() => {
        if (!selectedColorId) return allImages;
        const colored = allImages.filter(i => i.colorId === selectedColorId);
        return colored.length > 0 ? colored : allImages;
    }, [allImages, selectedColorId]);

    // ── Category assignments hierarchy ──
    const categoryTree = useMemo(() => {
        if (!product?.category_assignments?.length) return null;
        const assignments = product.category_assignments;

        // Group by level
        const levels = {};
        assignments.forEach(a => {
            const lvl = a.cat_level || a.level || 1;
            if (!levels[lvl]) levels[lvl] = [];
            levels[lvl].push(a);
        });

        const sortedLevels = Object.keys(levels).sort((a, b) => a - b);
        // If there's only one level, those are the leaves
        if (sortedLevels.length <= 1) {
            return { type: 'flat', items: assignments };
        }

        // Multi-level: last level items are leaves
        const lastLevel = sortedLevels[sortedLevels.length - 1];
        return {
            type: 'hierarchical',
            levels: levels,
            sortedLevels,
            lastLevel,
        };
    }, [product]);

    const leafItems = useMemo(() => {
        if (!categoryTree) return [];
        if (categoryTree.type === 'flat') return categoryTree.items;
        return categoryTree.levels[categoryTree.lastLevel] || [];
    }, [categoryTree]);

    // ── Price computation ──
    const currentPrice = useMemo(() => {
        if (leafSelections.length === 1) return leafSelections[0].price;
        if (selectedVariant) return parseFloat(selectedVariant.selling_price) || parseFloat(product?.selling_price) || 0;
        return parseFloat(product?.effective_price) || parseFloat(product?.selling_price) || 0;
    }, [product, selectedVariant, leafSelections]);

    const priceRange = useMemo(() => {
        if (leafSelections.length > 1) {
            const prices = leafSelections.map(s => s.price);
            return { min: Math.min(...prices), max: Math.max(...prices) };
        }
        if (product?.price_min && product?.price_max && product.price_min !== product.price_max) {
            return { min: parseFloat(product.price_min), max: parseFloat(product.price_max) };
        }
        return null;
    }, [product, leafSelections]);

    // ── Stock ──
    const stockQty = useMemo(() => {
        if (selectedVariant?.quantity_on_hand !== undefined) return selectedVariant.quantity_on_hand;
        return product?.total_stock ?? product?.quantity_on_hand ?? 0;
    }, [product, selectedVariant]);

    // ── Handlers ──
    const handleToggleLeaf = (item) => {
        setLeafSelections(prev => {
            const exists = prev.find(s => s.categoryId === item.category_id);
            if (exists) {
                return prev.filter(s => s.categoryId !== item.category_id);
            }
            return [...prev, {
                categoryId: item.category_id,
                name: item.category_name,
                quantity: 1,
                price: parseFloat(item.price_override) || parseFloat(product?.selling_price) || 0,
                stock: parseInt(item.stock_allocated) || 0,
            }];
        });
    };

    const handleLeafQtyChange = (categoryId, newQty) => {
        if (newQty < 1) return;
        setLeafSelections(prev =>
            prev.map(s => s.categoryId === categoryId ? { ...s, quantity: newQty } : s)
        );
    };

    const handleAddToCart = () => {
        if (!product) return;

        if (leafSelections.length > 0) {
            // Add each selection as a separate cart item
            leafSelections.forEach(sel => {
                addToCart(
                    { ...product, effective_price: sel.price, selling_price: sel.price },
                    selectedVariant,
                    sel.categoryId,
                    sel.name,
                    sel.quantity
                );
            });
        } else {
            // Simple or variant-based product
            addToCart(product, selectedVariant, null, null, quantity);
        }
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
    };

    // ── Loading / error states ──
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-theme-muted">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-xs sm:text-sm">Loading product details...</p>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-theme-muted">
                <Package className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">Product not found</p>
                <button onClick={onBack} className="mt-3 text-xs text-accent-gold hover:underline">Go back</button>
            </div>
        );
    }

    const totalLeafQty = leafSelections.reduce((s, l) => s + l.quantity, 0);
    const isOutOfStock = stockQty <= 0 && leafSelections.length === 0;
    const displayImage = filteredImages[activeImageIndex]?.url || null;
    const hasColors = product.colors?.length > 0;
    const variants = product.variants || [];
    const hasVariants = variants.length > 0;
    const hasCategoryAssignments = leafItems.length > 0;

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Top bar */}
            <div className="shrink-0 flex items-center gap-2 px-3 py-2 bg-theme-secondary border-b border-theme">
                <button
                    onClick={onBack}
                    className="p-1.5 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-theme-primary border border-theme transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <h3 className="text-sm font-semibold text-theme-primary truncate flex-1">
                    {product.product_name}
                </h3>
                <div className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                    isOutOfStock ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'
                }`}>
                    {isOutOfStock ? 'Out of Stock' : `${stockQty} in stock`}
                </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-3 sm:p-4 space-y-4">

                    {/* Image gallery */}
                    <div className="flex gap-3">
                        {/* Main image */}
                        <div className="flex-1 aspect-square rounded-xl overflow-hidden bg-theme-primary border border-theme">
                            {displayImage ? (
                                <img src={displayImage} alt={product.product_name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-theme-muted/20">
                                    <Package className="w-16 h-16" />
                                </div>
                            )}
                        </div>
                        {/* Thumbnails (if > 1 image) */}
                        {filteredImages.length > 1 && (
                            <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[280px] w-14 sm:w-16">
                                {filteredImages.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImageIndex(idx)}
                                        className={`w-full aspect-square rounded-lg overflow-hidden border-2 transition shrink-0 ${
                                            idx === activeImageIndex
                                                ? 'border-accent-gold'
                                                : 'border-theme hover:border-accent-gold/50'
                                        }`}
                                    >
                                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Price + name */}
                    <div>
                        <h2 className="text-base sm:text-lg font-bold text-theme-primary mb-1">
                            {product.product_name}
                        </h2>
                        <div className="flex items-baseline gap-2">
                            <span className="text-lg sm:text-xl font-bold text-accent-gold">
                                {priceRange && leafSelections.length !== 1
                                    ? `${formatCurrency(priceRange.min)} – ${formatCurrency(priceRange.max)}`
                                    : formatCurrency(currentPrice)
                                }
                            </span>
                            {product.compare_at_price && parseFloat(product.compare_at_price) > currentPrice && (
                                <span className="text-sm text-theme-muted line-through">
                                    {formatCurrency(product.compare_at_price)}
                                </span>
                            )}
                            {leafSelections.length > 1 && (
                                <span className="text-xs text-accent-gold bg-accent-gold/10 px-2 py-0.5 rounded-full font-medium">
                                    {leafSelections.length} varieties
                                </span>
                            )}
                        </div>
                        {product.sku && (
                            <p className="text-[10px] text-theme-muted mt-1">SKU: {product.sku}</p>
                        )}
                    </div>

                    {/* Color swatches */}
                    {hasColors && (
                        <div>
                            <p className="text-xs font-medium text-theme-secondary mb-1.5">
                                Color{selectedColorId ? `: ${product.colors.find(c => c.id === selectedColorId)?.color_name || ''}` : ''}
                            </p>
                            <div className="flex gap-2 flex-wrap">
                                {product.colors.map(color => {
                                    const isActive = selectedColorId === color.id;
                                    return (
                                        <button
                                            key={color.id}
                                            onClick={() => setSelectedColorId(isActive ? null : color.id)}
                                            className={`w-7 h-7 rounded-full ring-2 transition-all relative ${
                                                isActive ? 'ring-accent-gold ring-offset-2' : 'ring-gray-300 hover:ring-accent-gold/50'
                                            }`}
                                            style={{ backgroundColor: color.color_code || '#ccc' }}
                                            title={color.color_name}
                                        >
                                            {isActive && (
                                                <Check className="absolute inset-0 m-auto text-white drop-shadow-md" size={14} strokeWidth={3} />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Variant selector */}
                    {hasVariants && (
                        <div>
                            <p className="text-xs font-medium text-theme-secondary mb-1.5">
                                Variant
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {variants.map(v => {
                                    const isActive = selectedVariant?.id === v.id;
                                    const inStock = v.quantity_on_hand > 0 || v.is_active;
                                    return (
                                        <button
                                            key={v.id}
                                            onClick={() => { setSelectedVariant(v); setQuantity(1); }}
                                            disabled={!inStock}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                                isActive
                                                    ? 'bg-accent-gold text-white border-accent-gold shadow-sm'
                                                    : inStock
                                                        ? 'bg-theme-primary border-theme text-theme-secondary hover:border-accent-gold/50'
                                                        : 'bg-theme-primary border-theme text-theme-muted opacity-50 cursor-not-allowed line-through'
                                            }`}
                                        >
                                            {v.variant_name}
                                            {v.selling_price && (
                                                <span className="ml-1 opacity-75">
                                                    {formatCurrency(v.selling_price)}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Category attribute picker */}
                    {hasCategoryAssignments && (
                        <div>
                            <p className="text-xs font-medium text-theme-secondary mb-1.5">
                                Select options
                            </p>
                            <div className="space-y-1.5">
                                {leafItems.map(item => {
                                    const sel = leafSelections.find(s => s.categoryId === item.category_id);
                                    const stock = parseInt(item.stock_allocated) || 0;
                                    const price = parseFloat(item.price_override) || parseFloat(product.selling_price) || 0;
                                    return (
                                        <div
                                            key={item.category_id}
                                            className={`flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer ${
                                                sel
                                                    ? 'border-accent-gold bg-accent-gold/5'
                                                    : 'border-theme bg-theme-primary hover:border-accent-gold/30'
                                            }`}
                                            onClick={() => handleToggleLeaf(item)}
                                        >
                                            {/* Checkbox */}
                                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                                                sel ? 'bg-accent-gold border-accent-gold' : 'border-theme'
                                            }`}>
                                                {sel && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                            </div>

                                            {/* Image (if available) */}
                                            {item.image_url && (
                                                <img src={item.image_url} alt="" className="w-10 h-10 rounded-md object-cover shrink-0" />
                                            )}

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-theme-primary truncate">{item.category_name}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] text-accent-gold font-semibold">{formatCurrency(price)}</span>
                                                    <span className={`text-[10px] ${stock > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                        {stock > 0 ? `${stock} available` : 'Out of stock'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Quantity controls (if selected) */}
                                            {sel && (
                                                <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => handleLeafQtyChange(item.category_id, sel.quantity - 1)}
                                                        className="p-1 rounded bg-theme-secondary border border-theme text-theme-muted hover:text-theme-primary"
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <span className="w-6 text-center text-xs font-medium text-theme-primary">{sel.quantity}</span>
                                                    <button
                                                        onClick={() => handleLeafQtyChange(item.category_id, sel.quantity + 1)}
                                                        className="p-1 rounded bg-theme-secondary border border-theme text-theme-muted hover:text-theme-primary"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Quantity selector (simple / variant products without category assignments) */}
                    {!hasCategoryAssignments && (
                        <div>
                            <p className="text-xs font-medium text-theme-secondary mb-1.5">Quantity</p>
                            <div className="inline-flex items-center bg-theme-secondary rounded-lg border border-theme">
                                <button
                                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                    className="p-2 text-theme-muted hover:text-theme-primary transition"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-10 text-center text-sm font-medium text-theme-primary">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(q => q + 1)}
                                    className="p-2 text-theme-muted hover:text-theme-primary transition"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Description (collapsed) */}
                    {product.description && (
                        <details className="group">
                            <summary className="text-xs font-medium text-theme-secondary cursor-pointer list-none flex items-center gap-1 hover:text-theme-primary">
                                Description
                                <ChevronDown className="w-3.5 h-3.5 group-open:hidden" />
                                <ChevronUp className="w-3.5 h-3.5 hidden group-open:block" />
                            </summary>
                            <div
                                className="mt-2 text-xs text-theme-muted leading-relaxed prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: product.description }}
                            />
                        </details>
                    )}
                </div>
            </div>

            {/* Bottom bar — add to cart */}
            <div className="shrink-0 px-3 py-2.5 bg-theme-secondary border-t border-theme flex items-center gap-3">
                <div className="flex-1 min-w-0">
                    <span className="text-lg font-bold text-accent-gold">
                        {leafSelections.length > 0
                            ? formatCurrency(leafSelections.reduce((s, l) => s + l.price * l.quantity, 0))
                            : formatCurrency(currentPrice * quantity)
                        }
                    </span>
                    {(leafSelections.length > 0 || quantity > 1) && (
                        <span className="text-[10px] text-theme-muted ml-1">
                            ({leafSelections.length > 0 ? totalLeafQty : quantity} {totalLeafQty === 1 || quantity === 1 ? 'item' : 'items'})
                        </span>
                    )}
                </div>
                <button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock || (hasCategoryAssignments && leafSelections.length === 0)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                        added
                            ? 'bg-emerald-500 text-white'
                            : 'bg-accent-gold text-white hover:bg-accent-gold/90 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                >
                    {added ? (
                        <>
                            <Check className="w-4 h-4" />
                            Added!
                        </>
                    ) : isOutOfStock ? (
                        'Out of Stock'
                    ) : (
                        <>
                            <ShoppingCart className="w-4 h-4" />
                            Add to Cart
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default POSProductDetail;
