import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Cell
} from 'recharts';

/**
 * RevenueBarChart Component
 * Displays revenue comparison as a bar chart
 */
const RevenueBarChart = ({
    data = [],
    title = 'Revenue Comparison',
    height = 300,
    showLegend = true,
    dataKeys = [
        { key: 'revenue', color: '#3b82f6', name: 'Revenue' },
        { key: 'cost', color: '#ef4444', name: 'Cost' }
    ],
    xAxisKey = 'name',
    formatValue = (val) => `$${val.toLocaleString()}`,
    layout = 'vertical', // 'vertical' or 'horizontal'
    className = ''
}) => {
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                    <p className="text-sm font-semibold text-gray-900 mb-2">{label}</p>
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
                <BarChart
                    data={data}
                    layout={layout === 'horizontal' ? 'horizontal' : 'vertical'}
                    margin={{ top: 10, right: 30, left: layout === 'horizontal' ? 0 : 80, bottom: 0 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    {layout === 'horizontal' ? (
                        <>
                            <XAxis
                                dataKey={xAxisKey}
                                tick={{ fontSize: 12, fill: '#6b7280' }}
                                axisLine={{ stroke: '#e5e7eb' }}
                            />
                            <YAxis
                                tickFormatter={(val) => `$${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`}
                                tick={{ fontSize: 12, fill: '#6b7280' }}
                                axisLine={{ stroke: '#e5e7eb' }}
                            />
                        </>
                    ) : (
                        <>
                            <XAxis
                                type="number"
                                tickFormatter={(val) => `$${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`}
                                tick={{ fontSize: 12, fill: '#6b7280' }}
                                axisLine={{ stroke: '#e5e7eb' }}
                            />
                            <YAxis
                                type="category"
                                dataKey={xAxisKey}
                                tick={{ fontSize: 12, fill: '#6b7280' }}
                                axisLine={{ stroke: '#e5e7eb' }}
                                width={80}
                            />
                        </>
                    )}
                    <Tooltip content={<CustomTooltip />} />
                    {showLegend && <Legend />}
                    {dataKeys.map((dk, idx) => (
                        <Bar
                            key={idx}
                            dataKey={dk.key}
                            name={dk.name}
                            fill={dk.color}
                            radius={[4, 4, 0, 0]}
                        />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default RevenueBarChart;
