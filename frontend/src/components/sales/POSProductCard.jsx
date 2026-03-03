import React from 'react';
import { Plus, Package, Star } from 'lucide-react';
import { Card, Badge, Button } from '../ui';
import { useCart } from '../../context/CartContext';
import { useCurrency } from '../../context/CurrencyContext';

const POSProductCard = ({ product }) => {
    const { addToCart } = useCart();
    const { formatCurrency } = useCurrency();
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
            className="group relative bg-theme-secondary rounded-lg border border-theme p-1.5 sm:p-2 transition-all hover:shadow-md hover:border-accent-gold/30 cursor-pointer overflow-hidden"
        >
            <div className="relative aspect-square rounded-lg overflow-hidden bg-theme-primary mb-1.5 sm:mb-3">
                {image_url ? (
                    <img
                        src={image_url}
                        alt={product_name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-theme-muted/20">
                        <Package size={32} className="sm:w-12 sm:h-12" />
                    </div>
                )}

                {is_featured && (
                    <div className="absolute top-1 sm:top-2 left-1 sm:left-2">
                        <div className="bg-accent-gold text-white p-0.5 sm:p-1 rounded-md">
                            <Star size={10} className="sm:w-3 sm:h-3" fill="currentColor" />
                        </div>
                    </div>
                )}

                <div className="absolute bottom-1 sm:bottom-2 left-1 sm:left-2 right-1 sm:right-2">
                    <div className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-[9px] sm:text-xs font-medium text-center ${quantity_on_hand > 0 ? 'bg-emerald-500/90 text-white' : 'bg-rose-500/90 text-white'}`}>
                        {quantity_on_hand > 0 ? `${quantity_on_hand} In Stock` : 'Out of Stock'}
                    </div>
                </div>
            </div>

            <div className="px-1 sm:px-2 pb-1 sm:pb-2 space-y-0.5 sm:space-y-1">
                <h4 className="text-[10px] sm:text-sm font-medium text-theme-primary group-hover:text-accent-gold transition-colors line-clamp-2 leading-snug">
                    {product_name}
                </h4>
                <div className="flex items-center justify-between pt-1 sm:pt-2">
                    <div className="text-xs sm:text-sm font-semibold text-accent-gold">
                        {formatCurrency(selling_price || 0)}
                    </div>
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-theme-primary text-accent-gold border border-theme flex items-center justify-center group-hover:bg-accent-gold group-hover:text-white group-hover:border-accent-gold transition-all">
                        <Plus size={14} className="sm:w-[18px] sm:h-[18px]" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default POSProductCard;
