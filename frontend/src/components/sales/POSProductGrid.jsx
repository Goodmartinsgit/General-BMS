import React from 'react';
import POSProductCard from './POSProductCard';
import { LoadingSpinner, EmptyState } from '../ui';
import { Search } from 'lucide-react';

const POSProductGrid = ({ 
    products = [], 
    loading = false,
    onProductClick 
}) => {
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl">
                <EmptyState 
                    icon={Search}
                    title="No products found"
                    description="Try searching for something else or adjusting filters."
                />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
            {products.map(product => (
                <POSProductCard 
                    key={product.id} 
                    product={product} 
                />
            ))}
        </div>
    );
};

export default POSProductGrid;
