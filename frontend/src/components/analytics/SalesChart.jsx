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
import { BarChart3 } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

const SalesChart = ({
    data = [],
    title = 'Sales Trend',
    height = 300,
    showLegend = true,
    dataKeys = [{ key: 'sales', color: '#d4a843', name: 'Sales' }],
    xAxisKey = 'date',
    formatValue: formatValueProp,
    className = ''
}) => {
    const { symbol } = useCurrency();
    const formatValue = formatValueProp || ((val) => `${symbol}${val.toLocaleString()}`);

    const formatXAxis = (value) => {
        if (!value) return '';
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        return value;
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-theme-secondary p-3 rounded-lg shadow-theme-md border border-theme">
                    <p className="text-sm font-semibold text-theme-primary mb-2">{formatXAxis(label)}</p>
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
            <div className={`bg-theme-secondary rounded-lg border border-theme shadow-theme-sm p-6 ${className}`}>
                <h3 className="text-lg font-semibold text-theme-primary mb-4">{title}</h3>
                <div className="flex flex-col items-center justify-center h-[200px] text-theme-muted gap-3">
                    <div className="p-4 bg-theme-tertiary rounded-full">
                        <BarChart3 size={32} className="opacity-40" />
                    </div>
                    <span className="text-sm">No data available</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-theme-secondary rounded-lg border border-theme shadow-theme-sm p-6 ${className}`}>
            <h3 className="text-lg font-semibold text-theme-primary mb-4">{title}</h3>
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
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" opacity={0.5} />
                    <XAxis
                        dataKey={xAxisKey}
                        tickFormatter={formatXAxis}
                        tick={{ fontSize: 12, fill: 'var(--color-text-muted, #6b7280)' }}
                        axisLine={{ stroke: 'var(--color-border, #e5e7eb)' }}
                        tickLine={{ stroke: 'var(--color-border, #e5e7eb)' }}
                    />
                    <YAxis
                        tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
                        tick={{ fontSize: 12, fill: 'var(--color-text-muted, #6b7280)' }}
                        axisLine={{ stroke: 'var(--color-border, #e5e7eb)' }}
                        tickLine={{ stroke: 'var(--color-border, #e5e7eb)' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {showLegend && (
                        <Legend
                            wrapperStyle={{ fontSize: '12px', color: 'var(--color-text-muted, #6b7280)' }}
                        />
                    )}
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
