import React from 'react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Legend,
    Tooltip
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

/**
 * PaymentBreakdownChart Component
 * Displays payment method distribution as a donut chart
 */
const PaymentBreakdownChart = ({
    data = [],
    title = 'Payment Methods',
    height = 300,
    showLegend = true,
    dataKey = 'value',
    nameKey = 'name',
    formatValue = (val) => `$${val.toLocaleString()}`,
    showPercentage = true,
    innerRadius = 60,
    outerRadius = 100,
    className = ''
}) => {
    const total = data.reduce((sum, item) => sum + (item[dataKey] || 0), 0);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const item = payload[0];
            const percentage = ((item.value / total) * 100).toFixed(1);
            return (
                <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                    <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600">{formatValue(item.value)}</p>
                    <p className="text-sm text-gray-500">{percentage}% of total</p>
                </div>
            );
        }
        return null;
    };

    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
        if (!showPercentage || percent < 0.05) return null;

        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={12}
                fontWeight={600}
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    const CustomLegend = ({ payload }) => (
        <div className="flex flex-wrap justify-center gap-4 mt-4">
            {payload.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm text-gray-600">{entry.value}</span>
                </div>
            ))}
        </div>
    );

    if (data.length === 0) {
        return (
            <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
                <div className="flex items-center justify-center h-[200px] text-gray-400">
                    No data available
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
            <ResponsiveContainer width="100%" height={height}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        innerRadius={innerRadius}
                        outerRadius={outerRadius}
                        paddingAngle={2}
                        dataKey={dataKey}
                        nameKey={nameKey}
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.color || COLORS[index % COLORS.length]}
                                stroke="white"
                                strokeWidth={2}
                            />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    {showLegend && <Legend content={<CustomLegend />} />}
                </PieChart>
            </ResponsiveContainer>
            {/* Center text for donut chart */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ marginTop: -height/2 - 20 }}>
                <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{formatValue(total)}</p>
                    <p className="text-xs text-gray-500">Total</p>
                </div>
            </div>
        </div>
    );
};

export default PaymentBreakdownChart;
