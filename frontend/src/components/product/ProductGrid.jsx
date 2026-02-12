import React from 'react';
import { Package } from 'lucide-react';
import ProductCard from './ProductCard';
import { LoadingSpinner, EmptyState } from '../ui';

/**
 * ProductGrid Component
 * Grid layout container for displaying products in card format
 */
const ProductGrid = ({
  products = [],
  loading = false,
  onEdit,
  onDelete,
  onView,
  showActions = true,
  emptyMessage = 'No products found',
  emptyDescription = 'Try adjusting your filters or search terms',
  columns = 4,
  className = '',
}) => {
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Empty state
  if (products.length === 0) {
    return (
      <div className="py-12">
        <EmptyState
          icon={Package}
          title={emptyMessage}
          description={emptyDescription}
        />
      </div>
    );
  }

  // Grid column classes
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6',
  };

  return (
    <div
      className={`grid ${columnClasses[columns] || columnClasses[4]} gap-6 ${className}`.trim()}
    >
      {products.map((product) => (
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
