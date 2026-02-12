import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

/**
 * SalesChart Component
 * Displays sales trends over time as an area chart
 */
const SalesChart = ({
    data = [],
    title = 'Sales Trend',
    height = 300,
    showLegend = true,
    dataKeys = [{ key: 'sales', color: '#3b82f6', name: 'Sales' }],
    xAxisKey = 'date',
    formatValue = (val) => `$${val.toLocaleString()}`,
    className = ''
}) => {
    const formatXAxis = (value) => {
        if (!value) return '';
        // Try to format as date
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        return value;
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                    <p className="text-sm font-semibold text-gray-900 mb-2">{formatXAxis(label)}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: {formatValue(entry.value)}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

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
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        {dataKeys.map((dk, idx) => (
                            <linearGradient key={idx} id={`gradient-${dk.key}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={dk.color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={dk.color} stopOpacity={0} />
                            </linearGradient>
                        ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        dataKey={xAxisKey}
                        tickFormatter={formatXAxis}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis
                        tickFormatter={(val) => `$${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {showLegend && <Legend />}
                    {dataKeys.map((dk, idx) => (
                        <Area
                            key={idx}
                            type="monotone"
                            dataKey={dk.key}
                            name={dk.name}
                            stroke={dk.color}
                            strokeWidth={2}
                            fill={`url(#gradient-${dk.key})`}
                        />
                    ))}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default SalesChart;
