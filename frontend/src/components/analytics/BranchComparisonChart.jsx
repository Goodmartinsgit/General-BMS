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
import { Building2 } from 'lucide-react';

const BRANCH_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

/**
 * BranchComparisonChart Component
 * Compare performance across branches
 */
const BranchComparisonChart = ({
    data = [],
    title = 'Branch Comparison',
    height = 300,
    metric = 'revenue', // 'revenue', 'sales_count', 'profit'
    formatValue = (val) => `$${val.toLocaleString()}`,
    showTarget = false,
    className = ''
}) => {
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                    <p className="text-sm font-semibold text-gray-900 mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-sm" style={{ color: entry.fill }}>
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
                <div className="flex flex-col items-center justify-center h-[200px] text-gray-400">
                    <Building2 className="w-12 h-12 mb-2 opacity-50" />
                    <p>No branch data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-blue-500"></span>
                        <span className="text-gray-600">Actual</span>
                    </div>
                    {showTarget && (
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-gray-300"></span>
                            <span className="text-gray-600">Target</span>
                        </div>
                    )}
                </div>
            </div>
            <ResponsiveContainer width="100%" height={height}>
                <BarChart
                    data={data}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        dataKey="branch_name"
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis
                        tickFormatter={(val) => `$${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                        dataKey={metric}
                        name="Actual"
                        radius={[4, 4, 0, 0]}
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={BRANCH_COLORS[index % BRANCH_COLORS.length]}
                            />
                        ))}
                    </Bar>
                    {showTarget && (
                        <Bar
                            dataKey="target"
                            name="Target"
                            fill="#d1d5db"
                            radius={[4, 4, 0, 0]}
                        />
                    )}
                </BarChart>
            </ResponsiveContainer>

            {/* Branch summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mt-4 pt-4 border-t border-gray-100">
                {data.slice(0, 6).map((branch, index) => (
                    <div key={branch.id || index} className="text-center p-2 rounded-lg bg-gray-50">
                        <div
                            className="w-2 h-2 rounded-full mx-auto mb-1"
                            style={{ backgroundColor: BRANCH_COLORS[index % BRANCH_COLORS.length] }}
                        />
                        <p className="text-xs font-medium text-gray-700 truncate">{branch.branch_name}</p>
                        <p className="text-sm font-bold text-gray-900">{formatValue(branch[metric] || 0)}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BranchComparisonChart;
