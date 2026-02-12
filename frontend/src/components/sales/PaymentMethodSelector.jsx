import React from 'react';
import { Wallet, CreditCard, Landmark, Tablet } from 'lucide-react';

const PaymentMethodSelector = ({ selectedMethod, onSelect }) => {
    const methods = [
        { id: 'Cash', name: 'Cash', icon: Wallet, color: 'text-green-600', bg: 'bg-green-50' },
        { id: 'Card', name: 'Card', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50' },
        { id: 'Transfer', name: 'Transfer', icon: Landmark, color: 'text-purple-600', bg: 'bg-purple-50' },
        { id: 'POS', name: 'POS', icon: Tablet, color: 'text-orange-600', bg: 'bg-orange-50' }
    ];

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
                {methods.map((method) => {
                    const Icon = method.icon;
                    const isSelected = selectedMethod === method.id;
                    return (
                        <button
                            key={method.id}
                            type="button"
                            onClick={() => onSelect(method.id)}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                                isSelected 
                                    ? `border-blue-500 ${method.bg}` 
                                    : 'border-gray-100 bg-white hover:border-gray-200'
                            }`}
                        >
                            <Icon className={`w-6 h-6 mb-1 ${method.color}`} />
                            <span className={`text-xs font-semibold ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                                {method.name}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default PaymentMethodSelector;
