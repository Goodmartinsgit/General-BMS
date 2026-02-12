import React, { useState, useEffect } from 'react';
import { Tag, Search, X, Check, AlertCircle, Sparkles } from 'lucide-react';
import { Badge, LoadingSpinner, EmptyState, Input } from '../ui';

/**
 * PromotionSelector Component
 * Select and apply promotions at POS
 */
const PromotionSelector = ({
  onSelect,
  selectedPromotion = null,
  cartTotal = 0,
  cartItems = [],
  placeholder = 'Search promotions or enter coupon code...',
  className = '',
}) => {
  const [search, setSearch] = useState('');
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [validationMessage, setValidationMessage] = useState('');

  // Fetch active promotions
  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/promotions?is_active=true&include_valid=true');
      // const data = await response.json();

      // Mock data for now
      const mockData = [
        {
          id: '1',
          promotion_name: 'Summer Sale 2026',
          promotion_type: 'percentage',
          discount_percentage: 20,
          coupon_code: 'SUMMER20',
          min_purchase_amount: 50,
          is_active: true,
          start_date: '2026-01-01',
          end_date: '2026-12-31',
          usage_limit: 100,
          usage_count: 25,
        },
        {
          id: '2',
          promotion_name: 'Buy 2 Get 1 Free',
          promotion_type: 'bogo',
          buy_quantity: 2,
          get_quantity: 1,
          is_active: true,
          applies_to: 'all',
        },
        {
          id: '3',
          promotion_name: '$10 Off',
          promotion_type: 'fixed_amount',
          discount_amount: 10,
          min_purchase_amount: 30,
          is_active: true,
        },
        {
          id: '4',
          promotion_name: 'Bulk Discount',
          promotion_type: 'bulk_discount',
          min_quantity: 5,
          discount_percentage: 15,
          is_active: true,
        },
      ];

      setPromotions(mockData);
    } catch (error) {
      console.error('Error fetching promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter promotions by search
  const filteredPromotions = promotions.filter(
    (p) =>
      p.promotion_name.toLowerCase().includes(search.toLowerCase()) ||
      p.coupon_code?.toLowerCase().includes(search.toLowerCase())
  );

  // Validate promotion against cart
  const validatePromotion = (promo) => {
    const errors = [];

    // Check minimum purchase amount
    if (promo.min_purchase_amount && cartTotal < promo.min_purchase_amount) {
      errors.push(`Minimum purchase of $${promo.min_purchase_amount} required`);
    }

    // Check minimum quantity for bulk discounts
    if (promo.promotion_type === 'bulk_discount') {
      const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      if (totalQuantity < promo.min_quantity) {
        errors.push(`Buy ${promo.min_quantity} or more items to qualify`);
      }
    }

    // Check BOGO requirements
    if (promo.promotion_type === 'bogo') {
      const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      const requiredQty = promo.buy_quantity + promo.get_quantity;
      if (totalQuantity < requiredQty) {
        errors.push(`Need ${requiredQty} items for BOGO offer`);
      }
    }

    // Check usage limit
    if (promo.usage_limit && promo.usage_count >= promo.usage_limit) {
      errors.push('Promotion usage limit reached');
    }

    // Check date validity
    const now = new Date();
    if (promo.start_date && new Date(promo.start_date) > now) {
      errors.push('Promotion not yet started');
    }
    if (promo.end_date && new Date(promo.end_date) < now) {
      errors.push('Promotion has expired');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const handleSelect = (promo) => {
    const validation = validatePromotion(promo);

    if (validation.isValid) {
      onSelect(promo);
      setSearch('');
      setIsOpen(false);
      setValidationMessage('');
    } else {
      setValidationMessage(validation.errors[0]);
      setTimeout(() => setValidationMessage(''), 3000);
    }
  };

  const handleClear = () => {
    onSelect(null);
    setSearch('');
    setValidationMessage('');
  };

  const handleKeyDown = (e) => {
    if (!isOpen || filteredPromotions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => Math.min(prev + 1, filteredPromotions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredPromotions[highlightedIndex]) {
          handleSelect(filteredPromotions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  // Get discount display
  const getDiscountDisplay = (promo) => {
    switch (promo.promotion_type) {
      case 'percentage':
        return `${promo.discount_percentage}% OFF`;
      case 'fixed_amount':
        return `$${parseFloat(promo.discount_amount).toFixed(2)} OFF`;
      case 'bogo':
        return `Buy ${promo.buy_quantity} Get ${promo.get_quantity}`;
      case 'bulk_discount':
        return `${promo.discount_percentage}% OFF at ${promo.min_quantity}+`;
      default:
        return 'Discount';
    }
  };

  return (
    <div className={`relative ${className}`.trim()}>
      {/* Selector Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {selectedPromotion ? (
            <Sparkles className="h-5 w-5 text-yellow-500" />
          ) : (
            <Tag className="h-5 w-5 text-gray-400" />
          )}
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
          placeholder={selectedPromotion ? selectedPromotion.promotion_name : placeholder}
          className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            selectedPromotion
              ? 'border-yellow-400 bg-yellow-50'
              : 'border-gray-300'
          }`}
        />

        {selectedPromotion && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-red-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Selected Promotion Display */}
      {selectedPromotion && (
        <div className="mt-2 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-300 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {selectedPromotion.promotion_name}
                </p>
                <p className="text-xs text-gray-600">
                  {getDiscountDisplay(selectedPromotion)}
                  {selectedPromotion.coupon_code && ` • Code: ${selectedPromotion.coupon_code}`}
                </p>
              </div>
            </div>
            <button
              onClick={handleClear}
              className="text-red-600 hover:bg-red-100 p-1 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Validation Message */}
      {validationMessage && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{validationMessage}</p>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && search && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 flex justify-center">
              <LoadingSpinner size="sm" />
            </div>
          ) : filteredPromotions.length === 0 ? (
            <div className="p-4">
              <EmptyState
                variant="search"
                title="No promotions found"
                description={`No active promotions match "${search}"`}
              />
            </div>
          ) : (
            <div className="py-1">
              {filteredPromotions.map((promo, index) => {
                const highlighted = index === highlightedIndex;
                const selected = selectedPromotion?.id === promo.id;
                const validation = validatePromotion(promo);

                return (
                  <button
                    key={promo.id}
                    onClick={() => handleSelect(promo)}
                    className={`
                      w-full px-4 py-3 text-left flex items-center gap-3 transition-colors
                      ${highlighted ? 'bg-blue-50' : 'hover:bg-gray-50'}
                      ${selected ? 'bg-yellow-50' : ''}
                      ${!validation.isValid ? 'opacity-60' : ''}
                    `.trim()}
                  >
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      validation.isValid ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <Tag className={`w-5 h-5 ${validation.isValid ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900 truncate">
                          {promo.promotion_name}
                        </p>
                        {selected && <Check className="w-4 h-4 text-yellow-600 flex-shrink-0" />}
                      </div>

                      <div className="flex flex-wrap items-center gap-1 mb-1">
                        {promo.coupon_code && (
                          <Badge variant="warning" size="sm">
                            {promo.coupon_code}
                          </Badge>
                        )}
                        <span className="text-xs text-gray-600">
                          {getDiscountDisplay(promo)}
                        </span>
                      </div>

                      {!validation.isValid && (
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {validation.errors[0]}
                        </p>
                      )}
                    </div>

                    {/* Discount Badge */}
                    {validation.isValid && (
                      <div className="text-right flex-shrink-0">
                        <Badge variant="success" size="sm">
                          Valid
                        </Badge>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
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

export default PromotionSelector;
