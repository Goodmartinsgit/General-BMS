import React from 'react';
import { DollarSign, CreditCard, FileText, Check } from 'lucide-react';
import { Badge } from '../ui';

/**
 * RefundMethodSelector Component
 * Select refund method (cash, card, store credit)
 */
const RefundMethodSelector = ({
  selected,
  onSelect,
  amount,
  originalPaymentMethod = null,
  className = '',
}) => {
  const refundMethods = [
    {
      value: 'cash',
      label: 'Cash Refund',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-600',
      description: 'Return money in cash',
      availability: 'Always available',
    },
    {
      value: 'card',
      label: 'Card Refund',
      icon: CreditCard,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-600',
      description: 'Refund to original payment card',
      availability: originalPaymentMethod === 'card' ? 'Available' : 'Original payment was not by card',
    },
    {
      value: 'credit_note',
      label: 'Store Credit',
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-600',
      description: 'Issue credit note for future purchases',
      availability: 'Always available',
    },
  ];

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {refundMethods.map((method) => {
          const Icon = method.icon;
          const isSelected = selected === method.value;
          const isDisabled = method.value === 'card' && originalPaymentMethod !== 'card';

          return (
            <button
              key={method.value}
              type="button"
              onClick={() => !isDisabled && onSelect(method.value)}
              disabled={isDisabled}
              className={`
                relative p-5 rounded-lg border-2 transition-all text-left
                ${isSelected
                  ? `${method.borderColor} ${method.bgColor}`
                  : 'border-gray-200 hover:border-gray-300 bg-white'
                }
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {/* Selected Indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <div className={`w-6 h-6 ${method.bgColor} ${method.borderColor} border-2 rounded-full flex items-center justify-center`}>
                    <Check className={`w-4 h-4 ${method.color}`} />
                  </div>
                </div>
              )}

              {/* Icon */}
              <div className={`w-12 h-12 ${method.bgColor} rounded-lg flex items-center justify-center mb-3`}>
                <Icon className={`w-6 h-6 ${method.color}`} />
              </div>

              {/* Label */}
              <h4 className={`font-semibold mb-1 ${
                isSelected ? method.color : 'text-gray-900'
              }`}>
                {method.label}
              </h4>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-2">{method.description}</p>

              {/* Amount */}
              <div className="mb-2">
                <p className={`text-xl font-bold ${
                  isSelected ? method.color : 'text-gray-900'
                }`}>
                  ${parseFloat(amount || 0).toFixed(2)}
                </p>
              </div>

              {/* Availability */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className={`text-xs ${
                  isDisabled ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {method.availability}
                </p>
              </div>

              {/* Recommended Badge */}
              {method.value === 'cash' && !isDisabled && (
                <div className="mt-2">
                  <Badge variant="success" size="sm">Recommended</Badge>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Additional Info */}
      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Note:</span>{' '}
          {selected === 'cash' && 'Ensure sufficient cash is available in the register.'}
          {selected === 'card' && 'Card refunds may take 3-5 business days to process.'}
          {selected === 'credit_note' && 'A credit note will be generated and can be used for future purchases.'}
          {!selected && 'Select a refund method to proceed.'}
        </p>
      </div>
    </div>
  );
};

export default RefundMethodSelector;
