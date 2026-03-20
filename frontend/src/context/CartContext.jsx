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

    const addToCart = (product, variant = null, categoryId = null, categoryName = null, qty = 1) => {
        setCartItems(prev => {
            const matchItem = (item) => {
                if (categoryId) {
                    return item.product.id === product.id && item.categoryId === categoryId;
                }
                if (variant) {
                    return item.product.id === product.id && item.variant?.id === variant.id && !item.categoryId;
                }
                return item.product.id === product.id && !item.variant && !item.categoryId;
            };

            const existingItem = prev.find(matchItem);

            if (existingItem) {
                return prev.map(item =>
                    matchItem(item) ? { ...item, quantity: item.quantity + qty } : item
                );
            }

            return [...prev, {
                product,
                variant,
                categoryId: categoryId || null,
                categoryName: categoryName || null,
                quantity: qty,
                price: variant ? variant.selling_price : (product.effective_price || product.selling_price),
            }];
        });
    };

    const removeFromCart = (productId, variantId = null, categoryId = null) => {
        setCartItems(prev => prev.filter(item => {
            if (categoryId) {
                return !(item.product.id === productId && item.categoryId === categoryId);
            }
            if (variantId) {
                return !(item.product.id === productId && item.variant?.id === variantId && !item.categoryId);
            }
            return !(item.product.id === productId && !item.variant && !item.categoryId);
        }));
    };

    const updateQuantity = (productId, variantId = null, quantity, categoryId = null) => {
        if (quantity <= 0) {
            removeFromCart(productId, variantId, categoryId);
            return;
        }
        setCartItems(prev => prev.map(item => {
            if (categoryId) {
                return (item.product.id === productId && item.categoryId === categoryId)
                    ? { ...item, quantity } : item;
            }
            if (variantId) {
                return (item.product.id === productId && item.variant?.id === variantId && !item.categoryId)
                    ? { ...item, quantity } : item;
            }
            return (item.product.id === productId && !item.variant && !item.categoryId)
                ? { ...item, quantity } : item;
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
        return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
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
