import React from 'react';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { Button, EmptyState } from '../ui';

const POSCart = () => {
    const { 
        cartItems, 
        removeFromCart, 
        updateQuantity, 
        getCartSubtotal 
    } = useCart();

    if (cartItems.length === 0) {
        return (
            <div className="flex-grow flex flex-col items-center justify-center p-12 text-center">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-6 border border-gray-100 shadow-inner">
                    <ShoppingCart size={40} />
                </div>
                <h4 className="text-lg font-black text-gray-900 tracking-tight">Basket is Empty</h4>
                <p className="text-gray-400 text-xs mt-2 max-w-[200px] leading-relaxed font-bold uppercase tracking-widest">Select assets from the catalog to initiate a terminal sale</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-grow overflow-hidden px-4">
            <div className="flex-grow overflow-y-auto py-4 space-y-4 no-scrollbar">
                {cartItems.map((item) => (
                    <div 
                        key={item.variant ? `${item.product.id}-${item.variant.id}` : item.product.id}
                        className="flex items-center gap-4 bg-white p-4 rounded-[1.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden"
                    >
                        {/* Status bar */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        
                        {/* Product Info */}
                        <div className="flex-grow min-w-0">
                            <h5 className="text-sm font-black text-gray-900 truncate tracking-tight">
                                {item.product.product_name}
                            </h5>
                            {item.variant && (
                                <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest mt-0.5">
                                    {item.variant.variant_name}
                                </p>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                                <span className="text-xs font-black text-gray-900">
                                    ₦{parseFloat(item.price).toLocaleString()}
                                </span>
                                <span className="text-[10px] text-gray-400 font-bold">×</span>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{item.quantity} UNIT{item.quantity > 1 ? 'S' : ''}</span>
                            </div>
                        </div>

                        {/* Quantity controls & Price */}
                        <div className="flex flex-col items-end gap-3 shrink-0">
                            <div className="text-sm font-black text-blue-600 tracking-tighter">
                                ₦{(item.price * item.quantity).toLocaleString()}
                            </div>
                            
                            <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
                                <button 
                                    onClick={() => updateQuantity(item.product.id, item.variant?.id, item.quantity - 1)}
                                    className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-400 hover:text-red-500"
                                >
                                    <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-8 text-center text-xs font-black text-gray-900">
                                    {item.quantity}
                                </span>
                                <button 
                                    onClick={() => updateQuantity(item.product.id, item.variant?.id, item.quantity + 1)}
                                    className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-400 hover:text-blue-500"
                                >
                                    <Plus className="w-3 h-3" />
                                </button>
                            </div>
                        </div>

                        {/* Remove button - floating on hover */}
                        <button 
                            onClick={() => removeFromCart(item.product.id, item.variant?.id)}
                            className="absolute -top-2 -right-2 p-2 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg shadow-rose-200"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Cart Summary Header */}
            <div className="mt-auto pt-6 pb-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Running Subtotal</div>
                    <div className="text-2xl font-black text-gray-900 tracking-tighter">
                        ₦{getCartSubtotal().toLocaleString()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default POSCart;
