import React, { useMemo } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

const SalesTrendChart = ({ data, loading }) => {
  const { formatCurrency } = useCurrency();
  const chartData = useMemo(() => {
    if (!data || data.length < 2) return null;

    const amounts = data.map(d => parseFloat(d.amount) || 0);
    const max = Math.max(...amounts, 1);
    const min = Math.min(...amounts, 0);
    const range = max - min;
    const pad = data.length - 1;

    const points = data.map((d, i) => {
      const x = (i / pad) * 100;
      const amount = parseFloat(d.amount) || 0;
      const y = 90 - ((amount - min) / range) * 70;
      return `${x},${y}`;
    }).join(' ');

    return { points, max, min };
  }, [data]);

  if (loading) {
    return (
      <div className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm h-[400px] animate-pulse">
        <div className="flex justify-between items-center mb-6">
          <div className="space-y-2">
            <div className="h-4 w-32 bg-theme-tertiary rounded"></div>
            <div className="h-3 w-48 bg-theme-tertiary rounded opacity-50"></div>
          </div>
        </div>
        <div className="flex-1 w-full h-[250px] bg-theme-tertiary/20 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="bg-theme-secondary p-6 md:p-8 rounded-lg border border-theme shadow-theme-sm flex flex-col hover:shadow-theme-md transition-all overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-accent-gold" />
            <h3 className="font-semibold text-theme-primary text-base">Sales Trend</h3>
          </div>
          <p className="text-xs text-theme-muted">Revenue over the current period</p>
        </div>
      </div>

      <div className="flex-1 min-h-[300px] relative">
        {!chartData ? (
          <div className="h-full flex flex-col items-center justify-center text-theme-muted text-sm gap-3">
            <div className="p-4 bg-theme-tertiary rounded-full">
              <BarChart3 size={32} className="opacity-40" />
            </div>
            <span>No sales data available for this period</span>
          </div>
        ) : (
          <div className="w-full h-full relative">
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.3" />
                  <stop offset="60%" stopColor="var(--color-accent)" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              <line x1="0" y1="20" x2="100" y2="20" stroke="currentColor" className="text-theme-tertiary" strokeWidth="0.1" strokeDasharray="2,2" />
              <line x1="0" y1="55" x2="100" y2="55" stroke="currentColor" className="text-theme-tertiary" strokeWidth="0.1" strokeDasharray="2,2" />
              <line x1="0" y1="90" x2="100" y2="90" stroke="currentColor" className="text-theme-tertiary" strokeWidth="0.1" strokeDasharray="2,2" />

              {/* Area */}
              <path
                d={`M 0,100 L ${chartData.points} L 100,100 Z`}
                fill="url(#chartFill)"
              />

              {/* Line */}
              <polyline
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={chartData.points}
              />

              {/* Dots */}
              {data.map((d, i) => {
                const x = (i / (data.length - 1)) * 100;
                const amount = parseFloat(d.amount) || 0;
                const y = 90 - ((amount - chartData.min) / (chartData.max - chartData.min)) * 70;
                return (
                  <g key={i} className="cursor-help">
                    <circle
                      cx={x}
                      cy={y}
                      r="3"
                      fill="var(--color-bg-secondary)"
                      stroke="var(--color-accent)"
                      strokeWidth="2"
                    />
                    <title>{`${d.date}: ${formatCurrency(amount)}`}</title>
                  </g>
                );
              })}
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesTrendChart;
