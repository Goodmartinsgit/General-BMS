import React, { useState } from 'react';
import { Trash2, Plus, Minus, ShoppingCart, ShoppingBag, AlertTriangle, TrendingUp, TrendingDown, Edit3 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useCurrency } from '../../context/CurrencyContext';
import { motion, AnimatePresence } from 'framer-motion';

const POSCartItem = ({ item }) => {
    const { removeFromCart, updateQuantity, updatePrice, updateUnitDiscount } = useCart();
    const { formatCurrency, symbol } = useCurrency();
    const [expanded, setExpanded] = useState(false);

    const productId = item.product.id;
    const variantId = item.variant?.id;
    const categoryId = item.categoryId;
    const costPrice = item.costPrice || 0;
    const unitDiscount = item.unitDiscount || 0;
    const effectivePrice = item.price - unitDiscount;
    const lineTotal = effectivePrice * item.quantity;
    const lineProfit = (effectivePrice - costPrice) * item.quantity;
    const isLoss = effectivePrice < costPrice;
    const isPriceModified = item.price !== item.originalPrice;
    const isBelowCost = item.price < costPrice;
    const maxStock = item.maxStock || 0;
    const atMaxStock = maxStock > 0 && item.quantity >= maxStock;

    return (
        <motion.div
            key={categoryId ? `${productId}-cat-${categoryId}` : variantId ? `${productId}-${variantId}` : productId}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20, scale: 0.95 }}
            layout
            className={`group bg-theme-primary rounded-lg border transition-all relative ${
                isBelowCost
                    ? 'border-rose-500/40 bg-rose-500/5'
                    : isPriceModified
                        ? 'border-amber-500/40 bg-amber-500/5'
                        : 'border-theme hover:border-accent-gold/20'
            }`}
        >
            {/* Main row — tap anywhere to expand/collapse */}
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 cursor-pointer select-none" onClick={() => setExpanded(!expanded)}>
                {/* Product Info */}
                <div className="flex-1 min-w-0">
                    <h5 className="text-xs sm:text-sm font-medium text-theme-primary truncate">
                        {item.product.product_name}
                    </h5>
                    {item.variant && (
                        <span className="inline-flex text-[10px] sm:text-xs text-accent-gold mt-0.5">
                            {item.variant.variant_name}
                        </span>
                    )}
                    {item.categoryName && (
                        <span className="inline-flex text-[10px] sm:text-xs text-accent-gold mt-0.5">
                            {item.categoryName}
                        </span>
                    )}
                    {/* Price status badge */}
                    {isBelowCost && (
                        <div className="flex items-center gap-1 mt-0.5">
                            <AlertTriangle className="w-2.5 h-2.5 text-rose-500" />
                            <span className="text-[9px] sm:text-[10px] font-medium text-rose-500">Below cost!</span>
                        </div>
                    )}
                    {isPriceModified && !isBelowCost && (
                        <div className="flex items-center gap-1 mt-0.5">
                            <Edit3 className="w-2.5 h-2.5 text-amber-500" />
                            <span className="text-[9px] sm:text-[10px] font-medium text-amber-500">Modified</span>
                        </div>
                    )}
                    {maxStock > 0 && (
                        <div className="flex items-center gap-1 mt-0.5">
                            <span className={`text-[9px] sm:text-[10px] font-medium ${atMaxStock ? 'text-amber-500' : 'text-emerald-500'}`}>
                                {atMaxStock ? `At limit (${maxStock})` : `Stock: ${maxStock}`}
                            </span>
                        </div>
                    )}
                </div>

                {/* Right side: total + qty + expand toggle */}
                <div className="flex flex-col items-end gap-1 sm:gap-1.5 shrink-0">
                    <div className="text-xs sm:text-sm font-semibold text-accent-gold">
                        {formatCurrency(lineTotal)}
                    </div>
                    {/* Profit/Loss indicator */}
                    {costPrice > 0 && (
                        <div className={`flex items-center gap-0.5 text-[9px] sm:text-[10px] font-medium ${isLoss ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {isLoss ? <TrendingDown className="w-2.5 h-2.5" /> : <TrendingUp className="w-2.5 h-2.5" />}
                            {isLoss ? 'Loss' : 'Profit'}: {formatCurrency(Math.abs(lineProfit))}
                        </div>
                    )}
                    {/* Quantity controls */}
                    <div className="flex items-center bg-theme-secondary rounded-lg p-0.5 border border-theme" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => updateQuantity(productId, variantId, item.quantity - 1, categoryId)}
                            className="p-0.5 sm:p-1 hover:bg-theme-primary hover:text-rose-500 rounded transition text-theme-muted"
                        >
                            <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        </button>
                        <input
                            type="number"
                            min={1}
                            max={maxStock > 0 ? maxStock : undefined}
                            value={item.quantity || ''}
                            onChange={e => {
                                const v = parseInt(e.target.value);
                                if (e.target.value === '') return;
                                if (!isNaN(v) && v >= 1) updateQuantity(productId, variantId, v, categoryId);
                            }}
                            onBlur={e => {
                                if (!e.target.value || parseInt(e.target.value) < 1) updateQuantity(productId, variantId, 1, categoryId);
                            }}
                            className="w-7 sm:w-8 text-center text-[10px] sm:text-xs font-medium text-theme-primary bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                            onClick={() => updateQuantity(productId, variantId, item.quantity + 1, categoryId)}
                            disabled={atMaxStock}
                            className={`p-0.5 sm:p-1 rounded transition ${atMaxStock ? 'text-theme-muted opacity-30 cursor-not-allowed' : 'hover:bg-theme-primary hover:text-accent-gold text-theme-muted'}`}
                        >
                            <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        </button>
                    </div>
                </div>

                {/* Remove button */}
                <button
                    onClick={e => { e.stopPropagation(); removeFromCart(productId, variantId, categoryId); }}
                    className="absolute -top-1 -right-1 p-0.5 sm:p-1 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                >
                    <Trash2 size={8} className="sm:w-[9px] sm:h-[9px]" />
                </button>
            </div>

            {/* Expanded pricing section */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-2 sm:px-3 pb-2 sm:pb-3 pt-1 border-t border-theme space-y-1.5 sm:space-y-2" onClick={e => e.stopPropagation()}>
                            {/* Sold Price */}
                            <div className="flex items-center justify-between gap-2">
                                <label className="text-[10px] sm:text-xs text-theme-muted whitespace-nowrap">Sold Price</label>
                                <div className="relative flex-1 max-w-[140px] sm:max-w-[160px]">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs text-theme-muted">{symbol}</span>
                                    <input
                                        type="number"
                                        value={item.price || ''}
                                        onChange={e => updatePrice(productId, variantId, e.target.value, categoryId)}
                                        className={`w-full pl-5 sm:pl-6 pr-2 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-medium outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                            isBelowCost
                                                ? 'bg-rose-500/10 border border-rose-500/40 text-rose-600 focus:ring-1 focus:ring-rose-500/30'
                                                : isPriceModified
                                                    ? 'bg-amber-500/10 border border-amber-500/40 text-amber-600 focus:ring-1 focus:ring-amber-500/30'
                                                    : 'bg-theme-secondary border border-theme text-theme-primary focus:ring-1 focus:ring-accent-gold/30 focus:border-accent-gold'
                                        }`}
                                        min={0}
                                        step="any"
                                    />
                                </div>
                            </div>

                            {/* Discount/Unit */}
                            <div className="flex items-center justify-between gap-2">
                                <label className="text-[10px] sm:text-xs text-theme-muted whitespace-nowrap">Discount/Unit</label>
                                <div className="relative flex-1 max-w-[140px] sm:max-w-[160px]">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs text-theme-muted">{symbol}</span>
                                    <input
                                        type="number"
                                        value={unitDiscount || ''}
                                        onChange={e => updateUnitDiscount(productId, variantId, e.target.value, categoryId)}
                                        placeholder="0"
                                        className="w-full pl-5 sm:pl-6 pr-2 py-1 sm:py-1.5 bg-theme-secondary border border-theme rounded-md text-[10px] sm:text-xs font-medium text-theme-primary outline-none focus:ring-1 focus:ring-accent-gold/30 focus:border-accent-gold transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        min={0}
                                        step="any"
                                    />
                                </div>
                            </div>

                            {/* Cost info row */}
                            {costPrice > 0 && (
                                <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-theme-muted pt-0.5">
                                    <span>Cost: {formatCurrency(costPrice)} × {item.quantity} = {formatCurrency(costPrice * item.quantity)}</span>
                                    {item.originalPrice !== item.price && (
                                        <span>Orig: {formatCurrency(item.originalPrice)}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const POSCart = () => {
    const { cartItems, clearCart } = useCart();

    return (
        <div className="flex flex-col h-full overflow-hidden bg-theme-secondary">
            {/* Cart Header */}
            <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-theme flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                    <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent-gold" />
                    <h3 className="font-semibold text-xs sm:text-sm text-theme-primary">Cart</h3>
                    {cartItems.length > 0 && (
                        <span className="px-1 sm:px-1.5 py-0.5 bg-accent-gold/10 text-accent-gold text-[10px] sm:text-xs rounded font-medium">
                            {cartItems.length}
                        </span>
                    )}
                </div>
                {cartItems.length > 0 && (
                    <button
                        onClick={clearCart}
                        title="Clear cart"
                        className="p-1 sm:p-1.5 rounded-lg text-theme-muted hover:text-rose-500 hover:bg-theme-primary border border-theme transition"
                    >
                        <Trash2 size={12} className="sm:w-[13px] sm:h-[13px]" />
                    </button>
                )}
            </div>

            {/* Empty State */}
            {cartItems.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-theme-primary rounded-full flex items-center justify-center text-theme-muted mb-3 sm:mb-4 border border-theme">
                        <ShoppingCart size={20} className="sm:w-7 sm:h-7" />
                    </div>
                    <h4 className="text-xs sm:text-sm font-semibold text-theme-primary">Cart is Empty</h4>
                    <p className="text-theme-muted text-[10px] sm:text-xs mt-1 sm:mt-1.5 max-w-[180px] sm:max-w-[200px]">Select products on the left to add them here</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-2 sm:py-3 space-y-1.5 sm:space-y-2 no-scrollbar">
                    <AnimatePresence initial={false}>
                        {cartItems.map((item) => (
                            <POSCartItem
                                key={item.categoryId ? `${item.product.id}-cat-${item.categoryId}` : item.variant ? `${item.product.id}-${item.variant.id}` : item.product.id}
                                item={item}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default POSCart;
