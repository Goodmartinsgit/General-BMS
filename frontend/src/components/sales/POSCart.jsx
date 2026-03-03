import React from 'react';
import { Trash2, Plus, Minus, ShoppingCart, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useCurrency } from '../../context/CurrencyContext';
import { motion, AnimatePresence } from 'framer-motion';

const POSCart = () => {
    const {
        cartItems,
        removeFromCart,
        updateQuantity,
        clearCart
    } = useCart();
    const { formatCurrency } = useCurrency();

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
                            <motion.div
                                key={item.variant ? `${item.product.id}-${item.variant.id}` : item.product.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20, scale: 0.95 }}
                                layout
                                className="group flex items-center gap-2 sm:gap-3 bg-theme-primary p-2 sm:p-3 rounded-lg border border-theme hover:border-accent-gold/20 transition-all relative"
                            >
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
                                    <div className="flex items-center gap-1 sm:gap-1.5 mt-0.5 sm:mt-1">
                                        <span className="text-[10px] sm:text-xs text-theme-muted">
                                            {formatCurrency(item.price)} × {item.quantity}
                                        </span>
                                    </div>
                                </div>

                                {/* Quantity controls & Price */}
                                <div className="flex flex-col items-end gap-1 sm:gap-1.5 shrink-0">
                                    <div className="text-xs sm:text-sm font-semibold text-accent-gold">
                                        {formatCurrency(item.price * item.quantity)}
                                    </div>
                                    <div className="flex items-center bg-theme-secondary rounded-lg p-0.5 border border-theme">
                                        <button
                                            onClick={() => updateQuantity(item.product.id, item.variant?.id, item.quantity - 1)}
                                            className="p-0.5 sm:p-1 hover:bg-theme-primary hover:text-rose-500 rounded transition text-theme-muted"
                                        >
                                            <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                        </button>
                                        <span className="w-5 sm:w-6 text-center text-[10px] sm:text-xs font-medium text-theme-primary">
                                            {item.quantity}
                                        </span>
                                        <button
                                            onClick={() => updateQuantity(item.product.id, item.variant?.id, item.quantity + 1)}
                                            className="p-0.5 sm:p-1 hover:bg-theme-primary hover:text-accent-gold rounded transition text-theme-muted"
                                        >
                                            <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                        </button>
                                    </div>
                                </div>

                                {/* Remove button */}
                                <button
                                    onClick={() => removeFromCart(item.product.id, item.variant?.id)}
                                    className="absolute -top-1 -right-1 p-0.5 sm:p-1 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                                >
                                    <Trash2 size={8} className="sm:w-[9px] sm:h-[9px]" />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default POSCart;
