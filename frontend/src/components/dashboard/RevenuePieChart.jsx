import React from 'react';
import { useCurrency } from '../../context/CurrencyContext';

const COLORS = ['#D4AF37', '#FFD700', '#B8860B', '#DAA520', '#F0E68C', '#EEE8AA', '#CD853F', '#DEB887'];

const RevenuePieChart = ({ data = [], loading = false }) => {
  const { formatCurrency } = useCurrency();

  if (loading) {
    return (
      <div className="bg-theme-secondary rounded-lg shadow-theme-md p-4 md:p-6 border border-theme">
        <div className="h-4 w-40 bg-theme-tertiary rounded mb-4 animate-pulse"></div>
        <div className="h-64 bg-theme-tertiary rounded animate-pulse"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-theme-secondary rounded-lg shadow-theme-md p-4 md:p-6 border border-theme">
        <h3 className="text-base md:text-lg font-semibold text-theme-primary mb-4">Revenue by Category</h3>
        <div className="h-64 flex items-center justify-center text-theme-muted">
          <p>No revenue data available</p>
        </div>
      </div>
    );
  }

  const formattedData = data
    .map(item => ({
      name: item.category || 'Uncategorized',
      value: parseFloat(item.revenue || 0)
    }))
    .filter(item => item.value > 0);

  const total = formattedData.reduce((sum, item) => sum + item.value, 0);

  // Build SVG pie chart segments
  let cumulativePercent = 0;
  const segments = formattedData.map((item, index) => {
    const percent = item.value / total;
    const startAngle = cumulativePercent * 2 * Math.PI;
    cumulativePercent += percent;
    const endAngle = cumulativePercent * 2 * Math.PI;

    const x1 = 50 + 40 * Math.cos(startAngle - Math.PI / 2);
    const y1 = 50 + 40 * Math.sin(startAngle - Math.PI / 2);
    const x2 = 50 + 40 * Math.cos(endAngle - Math.PI / 2);
    const y2 = 50 + 40 * Math.sin(endAngle - Math.PI / 2);
    const largeArc = percent > 0.5 ? 1 : 0;

    const path = percent >= 0.999
      ? `M 50 10 A 40 40 0 1 1 49.99 10 Z`
      : `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;

    return {
      ...item,
      percent,
      path,
      color: COLORS[index % COLORS.length]
    };
  });

  return (
    <div className="bg-theme-secondary rounded-lg shadow-theme-md p-4 md:p-6 border border-theme">
      <h3 className="text-base md:text-lg font-semibold text-theme-primary mb-4">Revenue by Category</h3>

      <div className="flex flex-col md:flex-row items-center gap-4">
        {/* Pie */}
        <div className="w-48 h-48 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            {segments.map((seg, i) => (
              <path
                key={i}
                d={seg.path}
                fill={seg.color}
                stroke="var(--color-bg-secondary)"
                strokeWidth="0.5"
                className="transition-opacity hover:opacity-80"
              >
                <title>{`${seg.name}: ${formatCurrency(seg.value)} (${(seg.percent * 100).toFixed(1)}%)`}</title>
              </path>
            ))}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2 w-full">
          {segments.map((seg, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: seg.color }}></span>
              <span className="text-theme-primary truncate flex-1">{seg.name}</span>
              <span className="text-theme-muted text-xs font-medium whitespace-nowrap">
                {(seg.percent * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RevenuePieChart;
