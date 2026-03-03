import React from 'react';
import { User, TrendingUp, TrendingDown } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

const TopCustomersTable = ({
    data = [],
    title = 'Top Customers',
    limit = 5,
    showRank = true,
    showContact = false,
    formatValue: formatValueProp,
    className = ''
}) => {
    const { symbol } = useCurrency();
    const formatValue = formatValueProp || ((val) => `${symbol}${val.toLocaleString()}`);
    const displayData = data.slice(0, limit);

    if (displayData.length === 0) {
        return (
            <div className={`bg-theme-secondary rounded-lg border border-theme shadow-theme-sm p-6 ${className}`}>
                <h3 className="text-lg font-semibold text-theme-primary mb-4">{title}</h3>
                <div className="flex flex-col items-center justify-center py-12 text-theme-muted gap-3">
                    <div className="p-4 bg-theme-tertiary rounded-full">
                        <User size={32} className="opacity-40" />
                    </div>
                    <p className="text-sm">No customer data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-theme-secondary rounded-lg border border-theme shadow-theme-sm p-6 ${className}`}>
            <h3 className="text-lg font-semibold text-theme-primary mb-4">{title}</h3>
            <div className="space-y-3">
                {displayData.map((customer, index) => (
                    <div
                        key={customer.id || index}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-theme-primary transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            {showRank && (
                                <span className={`
                                    inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold
                                    ${index === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' : ''}
                                    ${index === 1 ? 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300' : ''}
                                    ${index === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' : ''}
                                    ${index > 2 ? 'bg-theme-tertiary text-theme-muted' : ''}
                                `}>
                                    {index + 1}
                                </span>
                            )}
                            {customer.avatar ? (
                                <img
                                    src={customer.avatar}
                                    alt={customer.name}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-accent-gold/10 flex items-center justify-center">
                                    <span className="text-accent-gold font-semibold text-sm">
                                        {customer.name?.charAt(0)?.toUpperCase() || 'C'}
                                    </span>
                                </div>
                            )}
                            <div>
                                <p className="font-medium text-theme-primary text-sm">{customer.name}</p>
                                <div className="flex items-center gap-3 text-xs text-theme-muted">
                                    <span>{customer.orders_count || 0} orders</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-semibold text-theme-primary text-sm">
                                {formatValue(customer.total_spent || 0)}
                            </p>
                            {customer.trend !== undefined && (
                                <span className={`
                                    inline-flex items-center gap-1 text-xs font-medium
                                    ${customer.trend >= 0
                                        ? 'text-green-600 dark:text-green-400'
                                        : 'text-red-600 dark:text-red-400'
                                    }
                                `}>
                                    {customer.trend >= 0 ? (
                                        <TrendingUp className="w-3 h-3" />
                                    ) : (
                                        <TrendingDown className="w-3 h-3" />
                                    )}
                                    {Math.abs(customer.trend)}%
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TopCustomersTable;
