import React from 'react';
import { Plus, Package, Star } from 'lucide-react';
import { Card, Badge, Button } from '../ui';
import { useCart } from '../../context/CartContext';

/**
 * POSProductCard Component
 * Compact version of ProductCard for use in POS grid
 */
const POSProductCard = ({ product }) => {
    const { addToCart } = useCart();
    const { 
        product_name, 
        selling_price, 
        image_url, 
        is_featured, 
        quantity_on_hand,
        has_variants
    } = product;

    const handleAdd = (e) => {
        e.stopPropagation();
        addToCart(product);
    };

    return (
        <div 
            onClick={handleAdd}
            className="group relative bg-white rounded-[2rem] border border-gray-100 p-2 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-100 hover:-translate-y-1 cursor-pointer overflow-hidden"
        >
            <div className="relative aspect-square rounded-[1.5rem] overflow-hidden bg-gray-50 mb-3">
                {image_url ? (
                    <img 
                        src={image_url} 
                        alt={product_name} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-200">
                        <Package size={48} className="opacity-20 group-hover:scale-110 transition-transform duration-700" />
                    </div>
                )}
                
                {/* Featured Badge */}
                {is_featured && (
                    <div className="absolute top-3 left-3">
                        <div className="bg-amber-400 text-white p-1.5 rounded-xl shadow-lg shadow-amber-200">
                            <Star size={12} fill="currentColor" />
                        </div>
                    </div>
                )}
                
                {/* Stock Indicator */}
                <div className="absolute bottom-3 left-3 right-3">
                    <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest backdrop-blur-md border border-white/20 shadow-sm ${quantity_on_hand > 0 ? 'bg-white/80 text-emerald-600' : 'bg-rose-500/80 text-white'}`}>
                        {quantity_on_hand > 0 ? `${quantity_on_hand} In Stock` : 'Out of Stock'}
                    </div>
                </div>
            </div>
            
            <div className="px-3 pb-3 space-y-1">
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate">General Asset</div>
                <h4 className="text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {product_name}
                </h4>
                <div className="flex items-center justify-between pt-2">
                    <div className="text-lg font-black text-blue-600 tracking-tighter">
                        ₦{parseFloat(selling_price || 0).toLocaleString()}
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                        <Plus size={18} />
                    </div>
                </div>
            </div>
            
            {/* Quick action overlay on hover */}
            <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
        </div>
    );
};

export default POSProductCard;
