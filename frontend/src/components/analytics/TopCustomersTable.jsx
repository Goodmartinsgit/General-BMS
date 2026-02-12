import React from 'react';
import { User, TrendingUp, TrendingDown, Mail, Phone } from 'lucide-react';

/**
 * TopCustomersTable Component
 * Displays top customers by purchase value
 */
const TopCustomersTable = ({
    data = [],
    title = 'Top Customers',
    limit = 5,
    showRank = true,
    showContact = false,
    formatValue = (val) => `$${val.toLocaleString()}`,
    className = ''
}) => {
    const displayData = data.slice(0, limit);

    if (displayData.length === 0) {
        return (
            <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <User className="w-12 h-12 mb-2 opacity-50" />
                    <p>No customer data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
            <div className="space-y-4">
                {displayData.map((customer, index) => (
                    <div
                        key={customer.id || index}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            {showRank && (
                                <span className={`
                                    inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold
                                    ${index === 0 ? 'bg-yellow-100 text-yellow-700' : ''}
                                    ${index === 1 ? 'bg-gray-100 text-gray-700' : ''}
                                    ${index === 2 ? 'bg-orange-100 text-orange-700' : ''}
                                    ${index > 2 ? 'bg-gray-50 text-gray-500' : ''}
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
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <span className="text-blue-600 font-semibold text-sm">
                                        {customer.name?.charAt(0)?.toUpperCase() || 'C'}
                                    </span>
                                </div>
                            )}
                            <div>
                                <p className="font-medium text-gray-900">{customer.name}</p>
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <span>{customer.orders_count || 0} orders</span>
                                    {showContact && customer.email && (
                                        <span className="flex items-center gap-1">
                                            <Mail className="w-3 h-3" />
                                            {customer.email}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-semibold text-gray-900">
                                {formatValue(customer.total_spent || 0)}
                            </p>
                            {customer.trend !== undefined && (
                                <span className={`
                                    inline-flex items-center gap-1 text-xs font-medium
                                    ${customer.trend >= 0 ? 'text-green-600' : 'text-red-600'}
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
