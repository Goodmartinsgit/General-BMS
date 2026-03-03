import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

const RevenueBarChart = ({
    data = [],
    title = 'Revenue Comparison',
    height = 300,
    showLegend = true,
    dataKeys = [
        { key: 'revenue', color: '#d4a843', name: 'Revenue' },
        { key: 'cost', color: '#ef4444', name: 'Cost' }
    ],
    xAxisKey = 'name',
    formatValue: formatValueProp,
    layout = 'vertical',
    className = ''
}) => {
    const { symbol } = useCurrency();
    const formatValue = formatValueProp || ((val) => `${symbol}${val.toLocaleString()}`);
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-theme-secondary p-3 rounded-lg shadow-theme-md border border-theme">
                    <p className="text-sm font-semibold text-theme-primary mb-2">{label}</p>
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
                <BarChart
                    data={data}
                    layout={layout === 'horizontal' ? 'horizontal' : 'vertical'}
                    margin={{ top: 10, right: 30, left: layout === 'horizontal' ? 0 : 80, bottom: 0 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" opacity={0.5} />
                    {layout === 'horizontal' ? (
                        <>
                            <XAxis
                                dataKey={xAxisKey}
                                tick={{ fontSize: 12, fill: 'var(--color-text-muted, #6b7280)' }}
                                axisLine={{ stroke: 'var(--color-border, #e5e7eb)' }}
                                tickLine={{ stroke: 'var(--color-border, #e5e7eb)' }}
                            />
                            <YAxis
                                tickFormatter={(val) => `${symbol}${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`}
                                tick={{ fontSize: 12, fill: 'var(--color-text-muted, #6b7280)' }}
                                axisLine={{ stroke: 'var(--color-border, #e5e7eb)' }}
                                tickLine={{ stroke: 'var(--color-border, #e5e7eb)' }}
                            />
                        </>
                    ) : (
                        <>
                            <XAxis
                                type="number"
                                tickFormatter={(val) => `${symbol}${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`}
                                tick={{ fontSize: 12, fill: 'var(--color-text-muted, #6b7280)' }}
                                axisLine={{ stroke: 'var(--color-border, #e5e7eb)' }}
                                tickLine={{ stroke: 'var(--color-border, #e5e7eb)' }}
                            />
                            <YAxis
                                type="category"
                                dataKey={xAxisKey}
                                tick={{ fontSize: 12, fill: 'var(--color-text-muted, #6b7280)' }}
                                axisLine={{ stroke: 'var(--color-border, #e5e7eb)' }}
                                tickLine={{ stroke: 'var(--color-border, #e5e7eb)' }}
                                width={80}
                            />
                        </>
                    )}
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-bg-tertiary, #f3f4f6)', opacity: 0.5 }} />
                    {showLegend && (
                        <Legend
                            wrapperStyle={{ fontSize: '12px', color: 'var(--color-text-muted, #6b7280)' }}
                        />
                    )}
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
