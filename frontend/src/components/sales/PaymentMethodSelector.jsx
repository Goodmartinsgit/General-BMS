import React from 'react';
import { Wallet, CreditCard, Landmark, Tablet } from 'lucide-react';

const PaymentMethodSelector = ({ selectedMethod, onSelect }) => {
    const methods = [
        { id: 'Cash', name: 'Cash', icon: Wallet },
        { id: 'Card', name: 'Card', icon: CreditCard },
        { id: 'Transfer', name: 'Transfer', icon: Landmark },
        { id: 'POS', name: 'POS', icon: Tablet }
    ];

    return (
        <div className="grid grid-cols-4 gap-1.5">
            {methods.map((method) => {
                const Icon = method.icon;
                const isSelected = selectedMethod === method.id;
                return (
                    <button
                        key={method.id}
                        type="button"
                        onClick={() => onSelect(method.id)}
                        className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg border transition-all ${
                            isSelected
                                ? 'border-accent-gold bg-accent-gold/10 text-accent-gold'
                                : 'border-theme bg-theme-primary text-theme-muted hover:border-accent-gold/40 hover:text-theme-secondary'
                        }`}
                    >
                        <Icon className="w-4 h-4 mb-0.5" />
                        <span className="text-xs font-medium">{method.name}</span>
                    </button>
                );
            })}
        </div>
    );
};

export default PaymentMethodSelector;
