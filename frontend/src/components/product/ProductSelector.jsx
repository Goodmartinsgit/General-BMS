import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Package, Check } from 'lucide-react';
import { Input, Badge, EmptyState, LoadingSpinner } from '../ui';

/**
 * ProductSelector Component
 * Autocomplete selector for choosing products (used in sales, transfers, etc.)
 */
const ProductSelector = ({
  onSelect,
  selectedProducts = [],
  placeholder = 'Search products...',
  multiple = false,
  showStock = true,
  filterActive = true,
  className = '',
}) => {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const wrapperRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch products based on search
  useEffect(() => {
    const fetchProducts = async () => {
      if (!search.trim()) {
        setProducts([]);
        return;
      }

      setLoading(true);
      try {
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/products?search=${search}&is_active=${filterActive}`);
        // const data = await response.json();

        // Mock data for now
        const mockData = [
          {
            id: '1',
            product_name: 'Sample Product 1',
            product_code: 'PRD-0001',
            selling_price: 29.99,
            quantity_on_hand: 100,
            is_active: true,
          },
          {
            id: '2',
            product_name: 'Sample Product 2',
            product_code: 'PRD-0002',
            selling_price: 49.99,
            quantity_on_hand: 5,
            is_active: true,
          },
        ];

        setProducts(mockData);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(() => {
      fetchProducts();
    }, 300);

    return () => clearTimeout(debounce);
  }, [search, filterActive]);

  const handleSelect = (product) => {
    onSelect(product);

    if (!multiple) {
      setSearch('');
      setProducts([]);
      setIsOpen(false);
    }
  };

  const handleRemove = (productId) => {
    // TODO: Implement remove functionality for multiple selection
  };

  const isSelected = (productId) => {
    return selectedProducts.some((p) => p.id === productId);
  };

  const handleKeyDown = (e) => {
    if (!isOpen || products.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => Math.min(prev + 1, products.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (products[highlightedIndex]) {
          handleSelect(products[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`.trim()}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {search && (
          <button
            onClick={() => {
              setSearch('');
              setProducts([]);
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Selected Products (for multiple selection) */}
      {multiple && selectedProducts.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedProducts.map((product) => (
            <Badge key={product.id} variant="primary" className="flex items-center gap-1">
              {product.product_name}
              <button
                onClick={() => handleRemove(product.id)}
                className="ml-1 hover:text-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && search && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 flex justify-center">
              <LoadingSpinner size="sm" />
            </div>
          ) : products.length === 0 ? (
            <div className="p-4">
              <EmptyState
                variant="search"
                title="No products found"
                description="Try a different search term"
              />
            </div>
          ) : (
            <div className="py-1">
              {products.map((product, index) => {
                const selected = isSelected(product.id);
                const highlighted = index === highlightedIndex;
                const lowStock = product.quantity_on_hand <= product.reorder_level;

                return (
                  <button
                    key={product.id}
                    onClick={() => handleSelect(product)}
                    className={`
                      w-full px-4 py-3 text-left flex items-center gap-3 transition-colors
                      ${highlighted ? 'bg-blue-50' : 'hover:bg-gray-50'}
                      ${selected ? 'bg-blue-100' : ''}
                    `.trim()}
                  >
                    {/* Product Icon */}
                    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                      <Package className="w-5 h-5 text-gray-400" />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 truncate">
                          {product.product_name}
                        </p>
                        {selected && <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500">{product.product_code}</span>
                        {showStock && (
                          <Badge
                            variant={lowStock ? 'danger' : 'default'}
                            size="sm"
                          >
                            {product.quantity_on_hand} in stock
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-gray-900">
                        ${parseFloat(product.selling_price).toFixed(2)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductSelector;
