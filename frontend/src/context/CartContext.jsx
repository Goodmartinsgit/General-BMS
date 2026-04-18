import React, { createContext, useState, useEffect, useContext } from 'react';

const CartContext = createContext({});

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [customer, setCustomer] = useState(null);
    const [referrer, setReferrer] = useState(null);
    const [discount, setDiscount] = useState(0);

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('pos_cart');
        if (savedCart) {
            try {
                setCartItems(JSON.parse(savedCart));
            } catch (e) {
                console.error("Failed to parse saved cart", e);
            }
        }
    }, []);

    // Save cart to localStorage on changes
    useEffect(() => {
        localStorage.setItem('pos_cart', JSON.stringify(cartItems));
    }, [cartItems]);

    const _matchItem = (item, productId, variantId, categoryId) => {
        if (categoryId) {
            return item.product.id === productId && item.categoryId === categoryId;
        }
        if (variantId) {
            return item.product.id === productId && item.variant?.id === variantId && !item.categoryId;
        }
        return item.product.id === productId && !item.variant && !item.categoryId;
    };

    const addToCart = (product, variant = null, categoryId = null, categoryName = null, qty = 1) => {
        setCartItems(prev => {
            const matchItem = (item) => _matchItem(item, product.id, variant?.id, categoryId);

            // Determine max stock for this specific item
            let maxStock = 0;
            if (categoryId) {
                const catAssign = product.category_assignments?.find(a => a.category_id === categoryId);
                maxStock = parseInt(catAssign?.stock_allocated) || 0;
            } else if (variant) {
                maxStock = parseInt(variant.quantity_on_hand) || 0;
            } else {
                maxStock = parseInt(product.total_stock ?? product.quantity_on_hand) || 0;
            }

            const existingItem = prev.find(matchItem);

            if (existingItem) {
                const newQty = existingItem.quantity + qty;
                const safeQty = maxStock > 0 ? Math.min(newQty, maxStock) : newQty;
                return prev.map(item =>
                    matchItem(item) ? { ...item, quantity: safeQty, maxStock } : item
                );
            }

            const sellingPrice = variant
                ? variant.selling_price
                : (product.effective_price || product.retail_price || 0);
            const costPrice = variant
                ? (variant.cost_price || product.cost_price || 0)
                : (product.effective_cost_price || product.cost_price || 0);

            return [...prev, {
                product,
                variant,
                categoryId: categoryId || null,
                categoryName: categoryName || null,
                quantity: maxStock > 0 ? Math.min(qty, maxStock) : qty,
                price: sellingPrice,
                originalPrice: sellingPrice,
                costPrice: costPrice,
                unitDiscount: 0,
                maxStock,
            }];
        });
    };

    const removeFromCart = (productId, variantId = null, categoryId = null) => {
        setCartItems(prev => prev.filter(item => {
            return !_matchItem(item, productId, variantId, categoryId);
        }));
    };

    const updateQuantity = (productId, variantId = null, quantity, categoryId = null) => {
        if (quantity <= 0) {
            removeFromCart(productId, variantId, categoryId);
            return;
        }
        setCartItems(prev => prev.map(item => {
            if (_matchItem(item, productId, variantId, categoryId)) {
                const max = item.maxStock || 0;
                const safeQty = max > 0 ? Math.min(quantity, max) : quantity;
                return { ...item, quantity: safeQty };
            }
            return item;
        }));
    };

    const updatePrice = (productId, variantId = null, newPrice, categoryId = null) => {
        const price = parseFloat(newPrice) || 0;
        if (price < 0) return;
        setCartItems(prev => prev.map(item => {
            if (_matchItem(item, productId, variantId, categoryId)) {
                return { ...item, price };
            }
            return item;
        }));
    };

    const updateUnitDiscount = (productId, variantId = null, newDiscount, categoryId = null) => {
        const unitDiscount = parseFloat(newDiscount) || 0;
        if (unitDiscount < 0) return;
        setCartItems(prev => prev.map(item => {
            if (_matchItem(item, productId, variantId, categoryId)) {
                if (unitDiscount >= item.price) return item; // discount can't exceed price
                return { ...item, unitDiscount };
            }
            return item;
        }));
    };

    const clearCart = () => {
        setCartItems([]);
        setCustomer(null);
        setReferrer(null);
        setDiscount(0);
        localStorage.removeItem('pos_cart');
    };

    const getCartSubtotal = () => {
        return cartItems.reduce((total, item) => total + ((item.price - (item.unitDiscount || 0)) * item.quantity), 0);
    };

    const getCartTotal = () => {
        const subtotal = getCartSubtotal();
        return Math.max(0, subtotal - discount);
    };

    return (
        <CartContext.Provider value={{
            cartItems,
            customer,
            setCustomer,
            referrer,
            setReferrer,
            discount,
            setDiscount,
            addToCart,
            removeFromCart,
            updateQuantity,
            updatePrice,
            updateUnitDiscount,
            clearCart,
            getCartSubtotal,
            getCartTotal
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);

export default CartContext;
