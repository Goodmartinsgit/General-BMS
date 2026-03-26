import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ArrowLeft, ShoppingCart, Package, Minus, Plus, Check, ChevronDown, ChevronUp, X } from 'lucide-react';
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

    // Category attribute selection (hierarchical level-by-level)
    const [selectedByLevel, setSelectedByLevel] = useState({});
    const [extraSelections, setExtraSelections] = useState([]);
    const [catQuantities, setCatQuantities] = useState({});
    const [showAddVariety, setShowAddVariety] = useState(false);

    // Fetch product details (includes variants, colors, images, assignments)
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setSelectedVariant(null);
        setSelectedColorId(null);
        setQuantity(1);
        setSelectedByLevel({});
        setExtraSelections([]);
        setCatQuantities({});
        setShowAddVariety(false);
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

    // ── Category assignments hierarchy (level-by-level like the store) ──
    const selectionLevels = useMemo(() => {
        if (!product?.category_assignments?.length) return [];
        const assignments = product.category_assignments;

        // Group by level
        const grouped = {};
        assignments.forEach(a => {
            const lvl = a.cat_level || a.level || 1;
            if (!grouped[lvl]) grouped[lvl] = [];
            grouped[lvl].push(a);
        });

        const sorted = Object.entries(grouped)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([level, items]) => ({ level: Number(level), items }));

        // Skip root listing level (first level)
        if (sorted.length <= 1) return [];
        return sorted.slice(1);
    }, [product]);

    // Get level label from items
    const getLevelLabel = useCallback((items) => {
        if (!items.length) return 'Select Option';
        const unit = items[0]?.unit_of_measure;
        if (unit) return unit.charAt(0).toUpperCase() + unit.slice(1);
        const parentId = items[0]?.parent_category_id;
        if (parentId && items.every(i => i.parent_category_id === parentId)) {
            const parent = product?.category_assignments?.find(a => a.category_id === parentId);
            if (parent) return parent.category_name;
        }
        return 'Select Option';
    }, [product]);

    // Auto-select first in-stock item at each level on product load
    useEffect(() => {
        if (selectionLevels.length === 0) return;
        const initial = {};
        for (const { level, items } of selectionLevels) {
            const parentSelected = initial[level - 1];
            const visible = parentSelected
                ? items.filter(i => i.parent_category_id === parentSelected)
                : items;
            const best = visible.find(i => parseInt(i.stock_allocated) > 0) || visible[0];
            if (best) initial[level] = best.category_id;
        }
        setSelectedByLevel(initial);
        setExtraSelections([]);
        setCatQuantities({});
    }, [selectionLevels]);

    // Primary leaf = deepest level selection
    const primaryLeafId = useMemo(() => {
        if (selectionLevels.length === 0) return null;
        const deepest = selectionLevels[selectionLevels.length - 1];
        return selectedByLevel[deepest.level] ?? null;
    }, [selectedByLevel, selectionLevels]);

    // All selected leaf IDs (primary + extras)
    const allLeafIds = useMemo(() => {
        const ids = new Set();
        if (primaryLeafId) ids.add(primaryLeafId);
        extraSelections.forEach(id => ids.add(id));
        return ids;
    }, [primaryLeafId, extraSelections]);

    // Ensure every leaf has quantity 1 by default, clean up removed
    useEffect(() => {
        setCatQuantities(prev => {
            const updated = { ...prev };
            let changed = false;
            for (const id of allLeafIds) {
                if (!(id in updated)) { updated[id] = 1; changed = true; }
            }
            for (const key of Object.keys(updated)) {
                if (!allLeafIds.has(Number(key))) { delete updated[Number(key)]; changed = true; }
            }
            return changed ? updated : prev;
        });
    }, [allLeafIds]);

    // Build leafSelections array for cart integration (compatible with handleAddToCart)
    const leafSelections = useMemo(() => {
        const assignments = product?.category_assignments || [];
        const result = [];
        for (const id of allLeafIds) {
            const a = assignments.find(x => x.category_id === id);
            if (a) {
                result.push({
                    categoryId: a.category_id,
                    name: a.category_name,
                    quantity: catQuantities[id] ?? 1,
                    price: parseFloat(a.price_override) || parseFloat(product?.retail_price) || 0,
                    costPrice: parseFloat(a.cost_price_override) || parseFloat(product?.cost_price) || 0,
                    stock: parseInt(a.stock_allocated) || 0,
                });
            }
        }
        return result;
    }, [allLeafIds, catQuantities, product]);

    // Build breadcrumb path for a leaf
    const buildLeafPath = useCallback((leaf) => {
        const assignments = product?.category_assignments || [];
        const parts = [leaf.category_name];
        let current = leaf;
        while (current.parent_category_id) {
            const parent = assignments.find(a => a.category_id === current.parent_category_id);
            if (!parent || (parent.cat_level || parent.level || 1) <= 1) break;
            parts.unshift(parent.category_name);
            current = parent;
        }
        return parts.join(' / ');
    }, [product]);

    // Handle selecting a category at a level (single-select, clears deeper levels)
    const handleLevelSelect = useCallback((level, catId) => {
        setSelectedByLevel(prev => {
            if (prev[level] === catId) return prev;
            const updated = { ...prev, [level]: catId };
            // Auto-select defaults for deeper levels
            for (const sl of selectionLevels) {
                if (sl.level > level) {
                    const parentId = updated[sl.level - 1];
                    if (parentId) {
                        const children = sl.items.filter(i => i.parent_category_id === parentId);
                        const best = children.find(i => parseInt(i.stock_allocated) > 0) || children[0];
                        updated[sl.level] = best ? best.category_id : 0;
                    } else {
                        delete updated[sl.level];
                    }
                }
            }
            return updated;
        });
        setExtraSelections([]);
        setShowAddVariety(false);
    }, [selectionLevels]);

    // Available varieties for "Add another variety" picker
    const availableVarieties = useMemo(() => {
        if (selectionLevels.length === 0) return [];
        const deepest = selectionLevels[selectionLevels.length - 1];
        return deepest.items.filter(
            item => !allLeafIds.has(item.category_id) && (parseInt(item.stock_allocated) > 0 || item.price_override)
        );
    }, [selectionLevels, allLeafIds]);

    // ── Price computation ──
    const currentPrice = useMemo(() => {
        if (leafSelections.length === 1) return leafSelections[0].price;
        if (selectedVariant) return parseFloat(selectedVariant.selling_price) || parseFloat(product?.retail_price) || 0;
        return parseFloat(product?.effective_price) || parseFloat(product?.retail_price) || 0;
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
    const setCatQuantity = useCallback((catId, qty) => {
        if (qty < 0) return;
        setCatQuantities(prev => ({ ...prev, [catId]: qty }));
    }, []);

    const removeExtra = useCallback((catId) => {
        setExtraSelections(prev => prev.filter(id => id !== catId));
    }, []);

    const addVariety = useCallback((catId) => {
        if (allLeafIds.has(catId)) return;
        setExtraSelections(prev => [...prev, catId]);
        setShowAddVariety(false);
    }, [allLeafIds]);

    const handleAddToCart = () => {
        if (!product) return;

        if (leafSelections.length > 0) {
            // Add each selection as a separate cart item with full category path
            leafSelections.forEach(sel => {
                const assignment = product.category_assignments?.find(a => a.category_id === sel.categoryId);
                const fullPath = assignment ? buildLeafPath(assignment) : sel.name;
                addToCart(
                    { ...product, effective_price: sel.price, retail_price: sel.price, effective_cost_price: sel.costPrice, cost_price: sel.costPrice },
                    selectedVariant,
                    sel.categoryId,
                    fullPath,
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
    const hasCategoryAssignments = selectionLevels.length > 0;

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

                    {/* Category attribute picker — hierarchical level-by-level */}
                    {hasCategoryAssignments && (
                        <div className="space-y-3">
                            {/* Level pickers — single select buttons per level */}
                            {selectionLevels.map(({ level, items }) => {
                                const parentLevel = level - 1;
                                const parentSelected = selectedByLevel[parentLevel];
                                const currentSelected = selectedByLevel[level];

                                const visibleItems = parentSelected
                                    ? items.filter(i => i.parent_category_id === parentSelected)
                                    : items.filter(i => {
                                        const isTopLevel = selectionLevels[0]?.level === level;
                                        return isTopLevel || !i.parent_category_id;
                                    });

                                if (visibleItems.length === 0) return null;

                                return (
                                    <div key={level}>
                                        <p className="text-xs font-medium text-theme-secondary mb-1.5">
                                            {getLevelLabel(visibleItems)}
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {visibleItems.map(item => {
                                                const isSelected = currentSelected === item.category_id;
                                                const stock = parseInt(item.stock_allocated) || 0;
                                                const isOOS = stock <= 0 && !item.price_override;
                                                const displayPrice = parseFloat(item.price_override) || parseFloat(product.retail_price) || 0;

                                                return (
                                                    <button
                                                        key={item.category_id}
                                                        onClick={() => !isOOS && handleLevelSelect(level, item.category_id)}
                                                        disabled={isOOS}
                                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                                            isSelected
                                                                ? 'bg-accent-gold text-white border-accent-gold shadow-sm'
                                                                : isOOS
                                                                    ? 'bg-theme-secondary border-theme text-theme-muted opacity-40 cursor-not-allowed line-through'
                                                                    : 'bg-theme-primary border-theme text-theme-secondary hover:border-accent-gold/50'
                                                        }`}
                                                    >
                                                        {item.image_url && (
                                                            <img src={item.image_url} alt="" className="w-5 h-5 rounded object-cover shrink-0" />
                                                        )}
                                                        <div>
                                                            <span>{item.category_name}</span>
                                                            {item.price_override && parseFloat(item.price_override) !== parseFloat(product.retail_price) && (
                                                                <span className={`block text-[10px] mt-0.5 ${isSelected ? 'text-white/70' : 'text-theme-muted'}`}>
                                                                    {formatCurrency(displayPrice)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Quantity rows for selected leaves */}
                            {primaryLeafId && (
                                <div className="space-y-2">
                                    {/* Primary selection */}
                                    {(() => {
                                        const a = product.category_assignments.find(x => x.category_id === primaryLeafId);
                                        if (!a) return null;
                                        const stock = parseInt(a.stock_allocated) || 0;
                                        const price = parseFloat(a.price_override) || parseFloat(product.retail_price) || 0;
                                        const qty = catQuantities[primaryLeafId] ?? 1;
                                        return (
                                            <div className="flex items-center gap-3 rounded-lg px-3 py-2 bg-theme-secondary">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-theme-primary truncate">{buildLeafPath(a)}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] text-accent-gold font-semibold">{formatCurrency(price)}</span>
                                                        {stock > 0 && <span className="text-[10px] text-emerald-500">{stock} in stock</span>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button onClick={() => setCatQuantity(primaryLeafId, qty - 1)} disabled={qty <= 1}
                                                        className="p-1 rounded bg-theme-primary border border-theme text-theme-muted hover:text-theme-primary disabled:opacity-30 disabled:cursor-not-allowed">
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <input type="number" min={1} max={stock > 0 ? stock : undefined} value={qty || ''}
                                                        onChange={e => { const v = parseInt(e.target.value); if (e.target.value === '') setCatQuantity(primaryLeafId, 0); else if (!isNaN(v) && v >= 1 && (!stock || v <= stock)) setCatQuantity(primaryLeafId, v); }}
                                                        onBlur={e => { if (!e.target.value || parseInt(e.target.value) < 1) setCatQuantity(primaryLeafId, 1); }}
                                                        className="w-8 text-center text-xs font-medium text-theme-primary bg-transparent outline-none border border-theme rounded [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                    <button onClick={() => setCatQuantity(primaryLeafId, qty + 1)} disabled={stock > 0 && qty >= stock}
                                                        className={`p-1 rounded bg-theme-primary border border-theme ${stock > 0 && qty >= stock ? 'opacity-30 cursor-not-allowed' : 'text-theme-muted hover:text-theme-primary'}`}>
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Extra variety quantities */}
                                    {extraSelections.map(catId => {
                                        const a = product.category_assignments.find(x => x.category_id === catId);
                                        if (!a) return null;
                                        const stock = parseInt(a.stock_allocated) || 0;
                                        const price = parseFloat(a.price_override) || parseFloat(product.retail_price) || 0;
                                        const qty = catQuantities[catId] ?? 1;
                                        return (
                                            <div key={catId} className="flex items-center gap-3 rounded-lg px-3 py-2 bg-theme-secondary">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-theme-primary truncate">{buildLeafPath(a)}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] text-accent-gold font-semibold">{formatCurrency(price)}</span>
                                                        {stock > 0 && <span className="text-[10px] text-emerald-500">{stock} in stock</span>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button onClick={() => setCatQuantity(catId, qty - 1)} disabled={qty <= 1}
                                                        className="p-1 rounded bg-theme-primary border border-theme text-theme-muted hover:text-theme-primary disabled:opacity-30 disabled:cursor-not-allowed">
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <input type="number" min={1} max={stock > 0 ? stock : undefined} value={qty || ''}
                                                        onChange={e => { const v = parseInt(e.target.value); if (e.target.value === '') setCatQuantity(catId, 0); else if (!isNaN(v) && v >= 1 && (!stock || v <= stock)) setCatQuantity(catId, v); }}
                                                        onBlur={e => { if (!e.target.value || parseInt(e.target.value) < 1) setCatQuantity(catId, 1); }}
                                                        className="w-8 text-center text-xs font-medium text-theme-primary bg-transparent outline-none border border-theme rounded [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                    <button onClick={() => setCatQuantity(catId, qty + 1)} disabled={stock > 0 && qty >= stock}
                                                        className={`p-1 rounded bg-theme-primary border border-theme ${stock > 0 && qty >= stock ? 'opacity-30 cursor-not-allowed' : 'text-theme-muted hover:text-theme-primary'}`}>
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>
                                                <button onClick={() => removeExtra(catId)} className="p-1 text-theme-muted hover:text-rose-500 shrink-0" title="Remove">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        );
                                    })}

                                    {/* Add another variety */}
                                    {availableVarieties.length > 0 && (
                                        <div>
                                            {!showAddVariety ? (
                                                <button
                                                    onClick={() => setShowAddVariety(true)}
                                                    className="text-xs text-accent-gold hover:text-accent-gold/80 font-medium flex items-center gap-1 mt-1"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                    Add another variety
                                                </button>
                                            ) : (
                                                <div className="bg-theme-secondary border border-theme rounded-lg p-2.5">
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <p className="text-xs font-medium text-theme-secondary">Select a variety to add</p>
                                                        <button onClick={() => setShowAddVariety(false)} className="p-0.5 text-theme-muted hover:text-theme-primary">
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {availableVarieties.map(item => {
                                                            const parentPath = buildLeafPath(item);
                                                            const hasParent = parentPath !== item.category_name;
                                                            return (
                                                                <button
                                                                    key={item.category_id}
                                                                    onClick={() => addVariety(item.category_id)}
                                                                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-theme-primary text-theme-secondary border border-theme hover:border-accent-gold/50 transition-all text-left"
                                                                >
                                                                    {hasParent && (
                                                                        <span className="block text-[10px] text-theme-muted mb-0.5">
                                                                            {parentPath.replace(` / ${item.category_name}`, '')}
                                                                        </span>
                                                                    )}
                                                                    {item.category_name}
                                                                    {item.price_override && parseFloat(item.price_override) !== parseFloat(product.retail_price) && (
                                                                        <span className="block text-[10px] text-theme-muted">
                                                                            {formatCurrency(parseFloat(item.price_override))}
                                                                        </span>
                                                                    )}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
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
                                <input
                                    type="number"
                                    min={1}
                                    value={quantity || ''}
                                    onChange={e => {
                                        const v = e.target.value === '' ? '' : parseInt(e.target.value);
                                        if (v === '' || (v >= 1 && !isNaN(v))) setQuantity(v || 1);
                                    }}
                                    className="w-10 text-center text-sm font-medium text-theme-primary bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
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
