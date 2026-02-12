import React from 'react';
import { TrendingUp, TrendingDown, Package } from 'lucide-react';

/**
 * TopProductsTable Component
 * Displays top selling products in a table format
 */
const TopProductsTable = ({
    data = [],
    title = 'Top Selling Products',
    limit = 5,
    showRank = true,
    showTrend = true,
    formatValue = (val) => `$${val.toLocaleString()}`,
    className = ''
}) => {
    const displayData = data.slice(0, limit);

    if (displayData.length === 0) {
        return (
            <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <Package className="w-12 h-12 mb-2 opacity-50" />
                    <p>No product data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200">
                            {showRank && (
                                <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">
                                    #
                                </th>
                            )}
                            <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Product
                            </th>
                            <th className="text-right py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Units Sold
                            </th>
                            <th className="text-right py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Revenue
                            </th>
                            {showTrend && (
                                <th className="text-right py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">
                                    Trend
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {displayData.map((product, index) => (
                            <tr key={product.id || index} className="hover:bg-gray-50 transition-colors">
                                {showRank && (
                                    <td className="py-3 px-2">
                                        <span className={`
                                            inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                                            ${index === 0 ? 'bg-yellow-100 text-yellow-700' : ''}
                                            ${index === 1 ? 'bg-gray-100 text-gray-700' : ''}
                                            ${index === 2 ? 'bg-orange-100 text-orange-700' : ''}
                                            ${index > 2 ? 'bg-gray-50 text-gray-500' : ''}
                                        `}>
                                            {index + 1}
                                        </span>
                                    </td>
                                )}
                                <td className="py-3 px-2">
                                    <div className="flex items-center gap-3">
                                        {product.image ? (
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                className="w-10 h-10 rounded-lg object-cover"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                                <Package className="w-5 h-5 text-gray-400" />
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                                            {product.sku && (
                                                <p className="text-xs text-gray-500">{product.sku}</p>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="py-3 px-2 text-right">
                                    <span className="font-medium text-gray-900">
                                        {product.units_sold?.toLocaleString() || 0}
                                    </span>
                                </td>
                                <td className="py-3 px-2 text-right">
                                    <span className="font-semibold text-gray-900">
                                        {formatValue(product.revenue || 0)}
                                    </span>
                                </td>
                                {showTrend && (
                                    <td className="py-3 px-2 text-right">
                                        {product.trend !== undefined && (
                                            <span className={`
                                                inline-flex items-center gap-1 text-xs font-medium
                                                ${product.trend >= 0 ? 'text-green-600' : 'text-red-600'}
                                            `}>
                                                {product.trend >= 0 ? (
                                                    <TrendingUp className="w-3 h-3" />
                                                ) : (
                                                    <TrendingDown className="w-3 h-3" />
                                                )}
                                                {Math.abs(product.trend)}%
                                            </span>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TopProductsTable;
