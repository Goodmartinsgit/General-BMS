import React from 'react';
import { useCurrency } from '../../context/CurrencyContext';
import { Package } from 'lucide-react';

const TopProductsChart = ({ data = [], loading = false }) => {
  const { formatCurrency } = useCurrency();

  if (loading) {
    return (
      <div className="bg-theme-secondary rounded-lg shadow-theme-md p-4 md:p-6 border border-theme">
        <div className="h-4 w-32 bg-theme-tertiary rounded mb-4 animate-pulse"></div>
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-3 w-24 bg-theme-tertiary rounded mb-1.5"></div>
              <div className="h-5 bg-theme-tertiary rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-theme-secondary rounded-lg shadow-theme-md p-4 md:p-6 border border-theme">
        <h3 className="text-base md:text-lg font-semibold text-theme-primary mb-4">Top Selling Products</h3>
        <div className="h-64 flex flex-col items-center justify-center text-theme-muted">
          <Package className="w-10 h-10 mb-2 opacity-30" />
          <p>No product data available</p>
        </div>
      </div>
    );
  }

  const formattedData = data.slice(0, 10).map(item => ({
    name: item.product_name || 'Unknown',
    code: item.product_code || '',
    sold: parseInt(item.total_sold || 0),
    revenue: parseFloat(item.total_revenue || 0)
  }));

  const maxSold = Math.max(...formattedData.map(d => d.sold), 1);

  return (
    <div className="bg-theme-secondary rounded-lg shadow-theme-md p-4 md:p-6 border border-theme">
      <h3 className="text-base md:text-lg font-semibold text-theme-primary mb-4">Top Selling Products</h3>
      <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
        {formattedData.map((item, index) => {
          const pct = (item.sold / maxSold) * 100;
          return (
            <div key={index} className="group">
              <div className="flex items-center justify-between text-sm mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-accent-gold/10 text-accent-gold text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-theme-primary font-medium truncate">{item.name}</span>
                  {item.code && (
                    <span className="text-theme-muted text-xs font-mono hidden sm:inline">{item.code}</span>
                  )}
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <span className="text-theme-primary font-semibold">{item.sold}</span>
                  <span className="text-theme-muted text-xs ml-1">sold</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-theme-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background: 'linear-gradient(90deg, #D4AF37, #FFD700)'
                    }}
                  />
                </div>
                <span className="text-xs text-theme-muted font-medium w-20 text-right">
                  {formatCurrency(item.revenue)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TopProductsChart;
