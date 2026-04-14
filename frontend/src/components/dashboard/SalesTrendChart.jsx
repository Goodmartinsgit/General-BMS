import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import { format, parseISO } from 'date-fns';

const formatTrendDate = (dateVal) => {
  if (!dateVal) return '';
  
  // Convert to string safely (handles Date objects or other types)
  const dateStr = String(dateVal);
  
  // Check if it's hourly (HH:mm) from the backend
  if (dateStr.includes(':') && dateStr.length === 5) {
    return dateStr;
  }
  
  try {
    // If it's already a Date object, use it directly; else parse if it looks like ISO
    const dateObj = dateVal instanceof Date ? dateVal : parseISO(dateStr);
    return format(dateObj, 'MMM d, yyyy');
  } catch (e) {
    console.error('Trend date formatting error:', e, dateVal);
    return dateStr;
  }
};

const CustomTooltip = ({ active, payload, label, formatCurrency }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-theme-secondary p-3 border border-theme rounded-lg shadow-theme-lg backdrop-blur-md bg-opacity-90">
        <p className="text-[10px] uppercase tracking-wider text-theme-muted mb-1 font-semibold">
          {formatTrendDate(label)}
        </p>
        <p className="text-sm font-bold text-accent-gold">
          Revenue: {formatCurrency(payload[0].value)}
        </p>
        {payload[0].payload.count !== undefined && (
          <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-theme border-opacity-30">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            <p className="text-[10px] text-theme-secondary">
              Sales: {payload[0].payload.count}
            </p>
          </div>
        )}
      </div>
    );
  }
  return null;
};

const SalesTrendChart = ({ data, loading }) => {
  const { formatCurrency } = useCurrency();

  if (loading) {
// ... existing loading state ...

    return (
      <div className="bg-theme-secondary p-6 md:p-8 rounded-lg border border-theme shadow-theme-sm h-[400px] flex flex-col animate-pulse">
        <div className="flex justify-between items-center mb-6">
          <div className="space-y-2">
            <div className="h-4 w-32 bg-theme-tertiary rounded"></div>
            <div className="h-3 w-48 bg-theme-tertiary rounded opacity-50"></div>
          </div>
        </div>
        <div className="flex-1 w-full bg-theme-tertiary/20 rounded-xl"></div>
      </div>
    );
  }

  const hasData = data && data.length > 0;

  return (
    <div className="bg-theme-secondary p-6 md:p-8 rounded-lg border border-theme shadow-theme-sm flex flex-col hover:shadow-theme-md transition-all duration-300 overflow-hidden group h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-accent-gold/10 rounded-lg text-accent-gold group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-theme-primary text-base">Sales Trend</h3>
          </div>
          <p className="text-xs text-theme-muted">Revenue analysis across the selected timeframe</p>
        </div>

        {hasData && (
          <div className="hidden sm:block text-right">
            <p className="text-[10px] text-theme-muted uppercase tracking-wider font-medium">Current Period High</p>
            <p className="text-sm font-bold text-theme-primary">
              {formatCurrency(Math.max(...data.map(d => parseFloat(d.amount) || 0)))}
            </p>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-[300px] w-full relative">
        {!hasData ? (
          <div className="h-full flex flex-col items-center justify-center text-theme-muted text-sm gap-4">
            <div className="p-6 bg-theme-tertiary rounded-full border border-theme border-opacity-50">
              <BarChart3 size={40} className="opacity-40" />
            </div>
            <div className="text-center">
              <span className="block font-medium">No sales data available for this period</span>
              <span className="text-[10px] opacity-70">Try selecting a different date range</span>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-accent, #EAB308)" stopOpacity={0.25}/>
                  <stop offset="100%" stopColor="var(--color-accent, #EAB308)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="4 4" 
                vertical={false} 
                stroke="var(--color-border, #e2e8f0)"
                opacity={0.15}
              />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--color-text-muted, #64748b)', fontSize: 10, fontWeight: 500 }}
                tickFormatter={formatTrendDate}
                minTickGap={20}
                padding={{ left: 10, right: 10 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--color-text-muted, #64748b)', fontSize: 10, fontWeight: 500 }}
                tickFormatter={(val) => {
                  if (val >= 1000000) return `₦${(val/1000000).toFixed(1)}M`;
                  if (val >= 1000) return `₦${(val/1000).toFixed(0)}K`;
                  return `₦${val}`;
                }}
              />
              <Tooltip 
                cursor={{ stroke: 'var(--color-accent)', strokeWidth: 1, strokeDasharray: '4 4' }}
                content={<CustomTooltip formatCurrency={formatCurrency} />} 
              />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="var(--color-accent, #EAB308)" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
                animationDuration={1500}
                activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--color-accent)' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default SalesTrendChart;
