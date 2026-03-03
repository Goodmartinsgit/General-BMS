import React from 'react';
import { Package } from 'lucide-react';
import ProductCard from './ProductCard';

const ProductGrid = ({
  products = [],
  onEdit,
  onDelete,
  onView,
  showActions = true,
  columns = 4,
  className = '',
}) => {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 bg-theme-tertiary border border-theme rounded-xl flex items-center justify-center mb-3">
          <Package className="w-7 h-7 text-theme-muted opacity-40" />
        </div>
        <p className="text-sm text-theme-muted">No products to display</p>
      </div>
    );
  }

  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6',
  };

  return (
    <div className={`grid ${columnClasses[columns] || columnClasses[4]} gap-4 ${className}`.trim()}>
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
          showActions={showActions}
        />
      ))}
    </div>
  );
};

export default ProductGrid;
