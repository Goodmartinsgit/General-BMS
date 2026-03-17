import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, BarChart3, TrendingUp, Boxes, ChevronRight, X,
  Package, Layers, Star
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

  // Breakdown modal state
  const [breakdownData, setBreakdownData] = useState(null);
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

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

  const openBreakdown = async (cat) => {
    setShowBreakdown(true);
    setBreakdownLoading(true);
    setBreakdownData(null);
    try {
      const res = await api.get(`/products/category-groups/${cat.id}/breakdown`);
      setBreakdownData(res.data);
    } catch (error) {
      console.error('Failed to load breakdown:', error);
      toast.error('Failed to load category breakdown');
      setShowBreakdown(false);
    } finally {
      setBreakdownLoading(false);
    }
  };

  const totalProducts = categoryInsights.reduce((s, c) => s + (c.total_products || 0), 0);
  const totalStockValue = categoryInsights.reduce((s, c) => s + parseFloat(c.total_stock_value || 0), 0);
  const totalStockUnits = categoryInsights.reduce((s, c) => s + (c.total_stock || 0), 0);

  const renderMargin = (stockValue, stockCost) => {
    const sv = parseFloat(stockValue || 0);
    const sc = parseFloat(stockCost || 0);
    const margin = sv - sc;
    const pct = sv > 0 ? ((margin / sv) * 100).toFixed(1) : 0;
    return (
      <span className={`flex items-center gap-1 ${margin >= 0 ? 'text-green-500' : 'text-red-500'}`}>
        <TrendingUp className="w-3 h-3" />
        {pct}%
      </span>
    );
  };

  const renderPriceRange = (min, max) => {
    const mi = parseFloat(min);
    const ma = parseFloat(max);
    if (mi > 0 && ma > 0) {
      return mi === ma ? formatCurrency(mi) : `${formatCurrency(mi)} – ${formatCurrency(ma)}`;
    }
    return '—';
  };

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
            {categoryInsights.map(cat => (
              <div
                key={cat.id}
                className="p-4 rounded-xl bg-theme-secondary border border-theme hover:shadow-theme-md transition-shadow cursor-pointer"
                onClick={() => openBreakdown(cat)}
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
                    <p className="text-sm font-bold text-accent-gold">{renderPriceRange(cat.min_price, cat.max_price)}</p>
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
                    <p className="text-sm font-bold">{renderMargin(cat.total_stock_value, cat.total_stock_cost)}</p>
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
            ))}
          </div>
        </>
      )}

      {/* ── Breakdown Modal ── */}
      {showBreakdown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowBreakdown(false)}>
          <div className="bg-theme-primary rounded-2xl shadow-xl border border-theme w-full max-w-5xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-theme flex-shrink-0">
              <div className="flex items-center gap-3">
                {breakdownData?.root?.image_url ? (
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={breakdownData.root.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-theme-tertiary flex items-center justify-center flex-shrink-0">
                    <Layers className="w-5 h-5 text-theme-muted" />
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-bold text-theme-primary">
                    {breakdownData?.root?.category_name || 'Category Breakdown'}
                  </h2>
                  <p className="text-sm text-theme-muted">Detailed subcategory breakdown</p>
                </div>
              </div>
              <button onClick={() => setShowBreakdown(false)} className="p-2 hover:bg-theme-tertiary rounded-lg transition-colors">
                <X className="w-5 h-5 text-theme-muted" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {breakdownLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-2 border-theme border-t-accent-gold rounded-full animate-spin" />
                </div>
              ) : breakdownData ? (
                <div className="space-y-6">
                  {/* ── Subcategory Breakdown Table ── */}
                  <div>
                    <h3 className="text-sm font-semibold text-theme-primary mb-3 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-accent-gold" />
                      Subcategory Breakdown ({breakdownData.subcategories?.length || 0})
                    </h3>
                    <div className="overflow-x-auto rounded-xl border border-theme">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-theme-tertiary text-theme-muted text-[11px] uppercase tracking-wider">
                            <th className="text-left px-4 py-3 font-semibold">Category</th>
                            <th className="text-right px-3 py-3 font-semibold">Products</th>
                            <th className="text-right px-3 py-3 font-semibold">Stock</th>
                            <th className="text-right px-3 py-3 font-semibold">Price Range</th>
                            <th className="text-right px-3 py-3 font-semibold">Avg Price</th>
                            <th className="text-right px-3 py-3 font-semibold">Stock Value</th>
                            <th className="text-right px-3 py-3 font-semibold">Stock Cost</th>
                            <th className="text-right px-3 py-3 font-semibold">Margin</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-theme">
                          {(breakdownData.subcategories || []).map((sub) => {
                            const isRoot = sub.category_id === breakdownData.root.id;
                            const indent = Math.max(0, (sub.level || 1) - 1);
                            return (
                              <tr key={sub.category_id} className={`hover:bg-theme-secondary transition-colors ${isRoot ? 'bg-theme-secondary/50 font-semibold' : ''}`}>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2" style={{ paddingLeft: `${indent * 20}px` }}>
                                    {sub.image_url ? (
                                      <img src={sub.image_url} alt="" className="w-7 h-7 rounded object-cover flex-shrink-0" />
                                    ) : (
                                      <div className="w-7 h-7 rounded bg-theme-tertiary flex items-center justify-center flex-shrink-0">
                                        <Boxes className="w-3.5 h-3.5 text-theme-muted opacity-40" />
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <p className={`truncate text-theme-primary ${isRoot ? 'font-bold' : ''}`}>
                                        {sub.category_name}
                                        {isRoot && <span className="ml-1.5 text-[10px] px-1.5 py-0.5 bg-accent-gold/10 text-accent-gold border border-accent-gold/20 rounded uppercase font-bold">Root</span>}
                                      </p>
                                      <p className="text-[10px] text-theme-muted">
                                        {sub.active_products} active
                                        {sub.featured_products > 0 && <> &middot; <Star className="w-2.5 h-2.5 inline text-yellow-500" /> {sub.featured_products}</>}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="text-right px-3 py-3 text-theme-primary">{sub.total_products}</td>
                                <td className="text-right px-3 py-3 text-theme-primary">{sub.total_stock} <span className="text-theme-muted text-[10px]">units</span></td>
                                <td className="text-right px-3 py-3 text-accent-gold text-xs font-medium">{renderPriceRange(sub.min_price, sub.max_price)}</td>
                                <td className="text-right px-3 py-3 text-theme-primary">{formatCurrency(sub.avg_price || 0)}</td>
                                <td className="text-right px-3 py-3 text-theme-primary font-medium">{formatCurrency(sub.total_stock_value || 0)}</td>
                                <td className="text-right px-3 py-3 text-theme-primary">{formatCurrency(sub.total_stock_cost || 0)}</td>
                                <td className="text-right px-3 py-3 font-medium">{renderMargin(sub.total_stock_value, sub.total_stock_cost)}</td>
                              </tr>
                            );
                          })}
                          {/* Totals row */}
                          {breakdownData.subcategories?.length > 1 && (() => {
                            const tots = breakdownData.subcategories.reduce((acc, s) => ({
                              products: acc.products + (s.total_products || 0),
                              stock: acc.stock + (s.total_stock || 0),
                              stockValue: acc.stockValue + parseFloat(s.total_stock_value || 0),
                              stockCost: acc.stockCost + parseFloat(s.total_stock_cost || 0),
                            }), { products: 0, stock: 0, stockValue: 0, stockCost: 0 });
                            return (
                              <tr className="bg-theme-tertiary font-bold border-t-2 border-theme">
                                <td className="px-4 py-3 text-theme-primary">Total</td>
                                <td className="text-right px-3 py-3 text-theme-primary">{tots.products}</td>
                                <td className="text-right px-3 py-3 text-theme-primary">{tots.stock} <span className="text-theme-muted text-[10px] font-normal">units</span></td>
                                <td className="text-right px-3 py-3"></td>
                                <td className="text-right px-3 py-3"></td>
                                <td className="text-right px-3 py-3 text-theme-primary">{formatCurrency(tots.stockValue)}</td>
                                <td className="text-right px-3 py-3 text-theme-primary">{formatCurrency(tots.stockCost)}</td>
                                <td className="text-right px-3 py-3">{renderMargin(tots.stockValue, tots.stockCost)}</td>
                              </tr>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* ── Top Products ── */}
                  {breakdownData.topProducts?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-theme-primary mb-3 flex items-center gap-2">
                        <Package className="w-4 h-4 text-accent-gold" />
                        Top Products by Stock Value ({breakdownData.topProducts.length})
                      </h3>
                      <div className="overflow-x-auto rounded-xl border border-theme">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-theme-tertiary text-theme-muted text-[11px] uppercase tracking-wider">
                              <th className="text-left px-4 py-3 font-semibold">Product</th>
                              <th className="text-left px-3 py-3 font-semibold">Category</th>
                              <th className="text-right px-3 py-3 font-semibold">Stock</th>
                              <th className="text-right px-3 py-3 font-semibold">Retail Price</th>
                              <th className="text-right px-3 py-3 font-semibold">Cost Price</th>
                              <th className="text-right px-3 py-3 font-semibold">Stock Value</th>
                              <th className="text-center px-3 py-3 font-semibold">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-theme">
                            {breakdownData.topProducts.map((p) => (
                              <tr key={p.id} className="hover:bg-theme-secondary transition-colors">
                                <td className="px-4 py-3">
                                  <p className="text-theme-primary font-medium truncate max-w-[200px]">{p.product_name}</p>
                                  {p.product_code && <p className="text-[10px] text-theme-muted">{p.product_code}</p>}
                                </td>
                                <td className="px-3 py-3 text-theme-muted text-xs">{p.direct_category || '—'}</td>
                                <td className="text-right px-3 py-3 text-theme-primary">{p.stock} <span className="text-theme-muted text-[10px]">units</span></td>
                                <td className="text-right px-3 py-3 text-theme-primary">{formatCurrency(p.retail_price || 0)}</td>
                                <td className="text-right px-3 py-3 text-theme-muted">{formatCurrency(p.cost_price || 0)}</td>
                                <td className="text-right px-3 py-3 text-theme-primary font-medium">{formatCurrency(p.stock_value || 0)}</td>
                                <td className="text-center px-3 py-3">
                                  <div className="flex items-center justify-center gap-1.5">
                                    {p.is_active ? (
                                      <span className="text-[10px] px-1.5 py-0.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded font-bold">Active</span>
                                    ) : (
                                      <span className="text-[10px] px-1.5 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded font-bold">Inactive</span>
                                    )}
                                    {p.is_featured && (
                                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryInsightsPage;
