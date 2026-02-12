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

    const addToCart = (product, variant = null) => {
        setCartItems(prev => {
            const itemKey = variant ? `${product.id}-${variant.id}` : product.id;
            const existingItem = prev.find(item => 
                variant ? (item.product.id === product.id && item.variant?.id === variant.id) : (item.product.id === product.id && !item.variant)
            );

            if (existingItem) {
                return prev.map(item => 
                    (variant ? (item.product.id === product.id && item.variant?.id === variant.id) : (item.product.id === product.id && !item.variant))
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
                );
            }

            return [...prev, { product, variant, quantity: 1, price: variant ? variant.selling_price : product.selling_price }];
        });
    };

    const removeFromCart = (productId, variantId = null) => {
        setCartItems(prev => prev.filter(item => 
            !(item.product.id === productId && (variantId ? item.variant?.id === variantId : !item.variant))
        ));
    };

    const updateQuantity = (productId, variantId = null, quantity) => {
        if (quantity <= 0) {
            removeFromCart(productId, variantId);
            return;
        }
        setCartItems(prev => prev.map(item => 
            (item.product.id === productId && (variantId ? item.variant?.id === variantId : !item.variant))
            ? { ...item, quantity }
            : item
        ));
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
