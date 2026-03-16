import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, BarChart3, TrendingUp, Boxes, ChevronRight, DollarSign
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { useCurrency } from '../context/CurrencyContext';
import PageHeader from '../components/common/PageHeader';

const CategoryInsightsPage = () => {
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const [categoryInsights, setCategoryInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCategoryInsights = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/products/category-groups');
      setCategoryInsights(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to load category insights:', error);
      toast.error('Failed to load category insights');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategoryInsights();
  }, [fetchCategoryInsights]);

  const totalProducts = categoryInsights.reduce((s, c) => s + (c.total_products || 0), 0);
  const totalStockValue = categoryInsights.reduce((s, c) => s + parseFloat(c.total_stock_value || 0), 0);
  const totalStockUnits = categoryInsights.reduce((s, c) => s + (c.total_stock || 0), 0);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-[1700px] mx-auto pb-6 sm:pb-10">
      <PageHeader
        title="Category Group Insights"
        subtitle="Aggregated analytics per root category"
        badge={`${categoryInsights.length} Categories`}
        icon={BarChart3}
        actions={
          <button
            onClick={() => navigate('/products')}
            className="border border-theme text-theme-secondary px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm hover:bg-theme-tertiary transition flex items-center justify-center gap-1.5 sm:gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Back to Products
          </button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-theme border-t-accent-gold rounded-full animate-spin" />
        </div>
      ) : categoryInsights.length === 0 ? (
        <div className="text-center py-24">
          <Boxes className="w-12 h-12 text-theme-muted mx-auto mb-3" />
          <p className="text-theme-muted">No root categories found</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="p-4 rounded-xl bg-theme-secondary border border-blue-500/30 shadow-theme-sm">
              <p className="text-xs text-theme-muted mb-1">Total Categories</p>
              <p className="text-xl font-bold text-theme-primary">{categoryInsights.length}</p>
            </div>
            <div className="p-4 rounded-xl bg-theme-secondary border border-green-500/30 shadow-theme-sm">
              <p className="text-xs text-theme-muted mb-1">Total Products</p>
              <p className="text-xl font-bold text-theme-primary">{totalProducts}</p>
            </div>
            <div className="p-4 rounded-xl bg-theme-secondary border border-accent-gold/30 shadow-theme-sm">
              <p className="text-xs text-theme-muted mb-1">Total Stock Value</p>
              <p className="text-lg font-bold text-theme-primary">{formatCurrency(totalStockValue)}</p>
            </div>
            <div className="p-4 rounded-xl bg-theme-secondary border border-purple-500/30 shadow-theme-sm">
              <p className="text-xs text-theme-muted mb-1">Total Stock Units</p>
              <p className="text-xl font-bold text-theme-primary">{totalStockUnits}</p>
            </div>
          </div>

          {/* Category Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {categoryInsights.map(cat => {
              const margin = parseFloat(cat.total_stock_value || 0) - parseFloat(cat.total_stock_cost || 0);
              const marginPct = parseFloat(cat.total_stock_value || 0) > 0
                ? ((margin / parseFloat(cat.total_stock_value)) * 100).toFixed(1)
                : 0;
              return (
                <div
                  key={cat.id}
                  className="p-4 rounded-xl bg-theme-secondary border border-theme hover:shadow-theme-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/products?category_id=${cat.id}`)}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 bg-theme-tertiary rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {cat.image_url ? (
                        <img src={cat.image_url} alt={cat.category_name} className="w-full h-full object-cover" />
                      ) : (
                        <Boxes className="w-6 h-6 text-theme-muted opacity-40" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-theme-primary text-sm truncate">{cat.category_name}</h3>
                      <p className="text-xs text-theme-muted">{cat.total_products} products &middot; {cat.active_products} active</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-theme-muted flex-shrink-0 mt-1" />
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div>
                      <p className="text-[10px] text-theme-muted uppercase tracking-wider">Total Stock</p>
                      <p className="text-sm font-bold text-theme-primary">{cat.total_stock} units</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-theme-muted uppercase tracking-wider">Price Range</p>
                      <p className="text-sm font-bold text-accent-gold">
                        {parseFloat(cat.min_price) > 0 && parseFloat(cat.max_price) > 0
                          ? parseFloat(cat.min_price) === parseFloat(cat.max_price)
                            ? formatCurrency(cat.min_price)
                            : `${formatCurrency(cat.min_price)} – ${formatCurrency(cat.max_price)}`
                          : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-theme-muted uppercase tracking-wider">Stock Value</p>
                      <p className="text-sm font-bold text-theme-primary">{formatCurrency(cat.total_stock_value || 0)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-theme-muted uppercase tracking-wider">Stock Cost</p>
                      <p className="text-sm font-bold text-theme-primary">{formatCurrency(cat.total_stock_cost || 0)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-theme-muted uppercase tracking-wider">Avg Price</p>
                      <p className="text-sm font-bold text-theme-primary">{formatCurrency(cat.avg_price || 0)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-theme-muted uppercase tracking-wider">Margin</p>
                      <p className={`text-sm font-bold flex items-center gap-1 ${margin >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        <TrendingUp className="w-3 h-3" />
                        {marginPct}%
                      </p>
                    </div>
                  </div>

                  {cat.featured_products > 0 && (
                    <div className="mt-2 pt-2 border-t border-theme">
                      <span className="text-[10px] px-1.5 py-0.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded font-bold uppercase">
                        {cat.featured_products} Featured
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default CategoryInsightsPage;
