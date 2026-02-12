import React, { useState, useEffect } from 'react';
import { Package, Search, X, Check, AlertCircle } from 'lucide-react';
import { Badge, LoadingSpinner, EmptyState } from '../ui';

/**
 * VariantSelector Component
 * Selector for choosing product variants (used in sales, transfers, etc.)
 */
const VariantSelector = ({
  productId,
  onSelect,
  selectedVariant = null,
  placeholder = 'Select variant...',
  showStock = true,
  filterActive = true,
  branchId = null,
  className = '',
}) => {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // Fetch variants
  useEffect(() => {
    if (productId && isOpen) {
      fetchVariants();
    }
  }, [productId, isOpen, filterActive, branchId]);

  const fetchVariants = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(
      //   `/api/products/${productId}/variants?is_active=${filterActive}&branch_id=${branchId || ''}`
      // );
      // const data = await response.json();

      // Mock data for now
      const mockData = [
        {
          id: '1',
          variant_name: 'Red - Large',
          sku: 'PRD-001-V1',
          selling_price: 49.99,
          quantity_on_hand: 15,
          reorder_level: 10,
          is_active: true,
          attributes: [
            { name: 'Color', value: 'Red' },
            { name: 'Size', value: 'Large' },
          ],
        },
        {
          id: '2',
          variant_name: 'Blue - Medium',
          sku: 'PRD-001-V2',
          selling_price: 39.99,
          quantity_on_hand: 3,
          reorder_level: 10,
          is_active: true,
          attributes: [
            { name: 'Color', value: 'Blue' },
            { name: 'Size', value: 'Medium' },
          ],
        },
        {
          id: '3',
          variant_name: 'Green - Small',
          sku: 'PRD-001-V3',
          selling_price: 29.99,
          quantity_on_hand: 25,
          reorder_level: 10,
          is_active: true,
          attributes: [
            { name: 'Color', value: 'Green' },
            { name: 'Size', value: 'Small' },
          ],
        },
      ];

      setVariants(mockData);
    } catch (error) {
      console.error('Error fetching variants:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter variants by search
  const filteredVariants = variants.filter(
    (v) =>
      v.variant_name.toLowerCase().includes(search.toLowerCase()) ||
      v.sku?.toLowerCase().includes(search.toLowerCase()) ||
      v.attributes.some(
        (attr) =>
          attr.name.toLowerCase().includes(search.toLowerCase()) ||
          attr.value.toLowerCase().includes(search.toLowerCase())
      )
  );

  const handleSelect = (variant) => {
    onSelect(variant);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = () => {
    onSelect(null);
    setSearch('');
  };

  const handleKeyDown = (e) => {
    if (!isOpen || filteredVariants.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => Math.min(prev + 1, filteredVariants.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredVariants[highlightedIndex]) {
          handleSelect(filteredVariants[highlightedIndex]);
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
    <div className={`relative ${className}`.trim()}>
      {/* Selector Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={!productId}
        className={`
          w-full px-4 py-2 border border-gray-300 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white
          ${!productId ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
        `.trim()}
      >
        <div className="flex items-center justify-between">
          {selectedVariant ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {selectedVariant.variant_name}
                </p>
                {selectedVariant.sku && (
                  <p className="text-xs text-gray-500">{selectedVariant.sku}</p>
                )}
              </div>
              {showStock && (
                <Badge
                  variant={selectedVariant.quantity_on_hand <= selectedVariant.reorder_level ? 'danger' : 'default'}
                  size="sm"
                >
                  {selectedVariant.quantity_on_hand} in stock
                </Badge>
              )}
            </div>
          ) : (
            <span className="text-sm text-gray-500">
              {productId ? placeholder : 'Select a product first'}
            </span>
          )}

          <div className="flex items-center gap-2 ml-2">
            {selectedVariant && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && productId && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-80 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search variants..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
          </div>

          {/* Variant List */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-4 flex justify-center">
                <LoadingSpinner size="sm" />
              </div>
            ) : filteredVariants.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  variant="search"
                  title="No variants found"
                  description={search ? `No variants match "${search}"` : 'This product has no variants'}
                />
              </div>
            ) : (
              <div className="py-1">
                {filteredVariants.map((variant, index) => {
                  const selected = selectedVariant?.id === variant.id;
                  const highlighted = index === highlightedIndex;
                  const lowStock = variant.quantity_on_hand <= variant.reorder_level;

                  return (
                    <button
                      key={variant.id}
                      onClick={() => handleSelect(variant)}
                      className={`
                        w-full px-4 py-3 text-left flex items-center gap-3 transition-colors
                        ${highlighted ? 'bg-blue-50' : 'hover:bg-gray-50'}
                        ${selected ? 'bg-blue-100' : ''}
                      `.trim()}
                    >
                      {/* Variant Icon */}
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5 text-blue-600" />
                      </div>

                      {/* Variant Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 truncate">
                            {variant.variant_name}
                          </p>
                          {selected && <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                        </div>

                        {/* Attributes */}
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          {variant.sku && (
                            <span className="text-xs text-gray-500">{variant.sku}</span>
                          )}
                          {variant.attributes?.map((attr, i) => (
                            <Badge key={i} variant="default" size="sm">
                              {attr.value}
                            </Badge>
                          ))}
                        </div>

                        {/* Stock Badge */}
                        {showStock && (
                          <div className="mt-1">
                            <Badge
                              variant={lowStock ? 'danger' : 'default'}
                              size="sm"
                              icon={lowStock ? AlertCircle : undefined}
                            >
                              {variant.quantity_on_hand} in stock
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Price */}
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-gray-900">
                          ${parseFloat(variant.selling_price).toFixed(2)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default VariantSelector;
