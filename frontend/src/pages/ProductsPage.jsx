import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus, Search, RefreshCw, Package, Filter, X,
  Grid2x2, LayoutGrid, List, Grid3x3, Eye, BarChart3,
  DollarSign, TrendingUp
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/common/PageHeader';
import ProductFormModal from '../components/product/ProductFormModal';
import BlurredValue from '../components/common/BlurredValue';

const ProductsPage = () => {
  const { formatCurrency } = useCurrency();
  const { auth } = useAuth();
  const user = auth?.user;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);

  // Edit modal state
  const [editProduct, setEditProduct] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  // Categories for filters
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);

  // Filter state
  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    search: '',
    product_type: '',
    brand_id: '',
    category_id: '',
    is_active: '',
    is_featured: '',
    low_stock: false,
    sort_by: 'created_at',
    sort_order: 'DESC'
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });

  const [showFilters, setShowFilters] = useState(false);


  // View mode persisted in localStorage
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('productViewMode') || 'grid';
  });

  useEffect(() => {
    localStorage.setItem('productViewMode', viewMode);
  }, [viewMode]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const [brandsRes, catsRes] = await Promise.all([
          api.get('/products/brands'),
          api.get('/products/categories'),
        ]);
        setBrands(Array.isArray(brandsRes.data) ? brandsRes.data : []);
        setCategories(Array.isArray(catsRes.data) ? catsRes.data : []);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Handle URL parameters (e.g., lowStockOnly, edit)
  useEffect(() => {
    const lowStockParam = searchParams.get('low_stock');
    if (lowStockParam === 'true') {
      setFilters(prev => ({ ...prev, low_stock: true, page: 1 }));
      setShowFilters(true);
    }

    const editId = searchParams.get('edit');
    if (editId) {
      api.get(`/products/${editId}`)
        .then(res => {
          const p = res.data?.product || res.data;
          setEditProduct(p);
          setEditModalOpen(true);
        })
        .catch(() => toast.error('Could not load product for editing'));
    }
  }, [searchParams]);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', filters.page);
      params.set('limit', filters.limit);
      params.set('sort_by', filters.sort_by);
      params.set('sort_order', filters.sort_order);
      if (filters.search) params.set('search', filters.search);
      if (filters.product_type) params.set('product_type', filters.product_type);
      if (filters.brand_id) params.set('brand_id', filters.brand_id);
      if (filters.category_id) params.set('category_id', filters.category_id);
      if (filters.is_active !== '') params.set('is_active', filters.is_active);
      if (filters.is_featured !== '') params.set('is_featured', filters.is_featured);
      if (filters.low_stock) params.set('low_stock', 'true');

      const res = await api.get(`/products?${params.toString()}`);
      setProducts(res.data?.products || []);
      setPagination(res.data?.pagination || { page: 1, limit: 12, total: 0, totalPages: 0 });
    } catch (error) {
      toast.error('Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    try {
      const res = await api.get('/products/statistics');
      setStatistics(res.data);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchStatistics();
  }, [fetchProducts, fetchStatistics]);

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      ...(key !== 'page' && { page: 1 })
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      page: 1, limit: 12, search: '', product_type: '', brand_id: '',
      category_id: '', is_active: '', is_featured: '', low_stock: false,
      sort_by: 'created_at', sort_order: 'DESC'
    });
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted successfully');
      fetchProducts();
      fetchStatistics();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    }
  };

  const handleEditClose = () => {
    setEditModalOpen(false);
    setEditProduct(null);
    // Remove ?edit param from URL without adding to history
    const params = new URLSearchParams(searchParams);
    params.delete('edit');
    navigate({ search: params.toString() }, { replace: true });
    // Refresh data in case a product was created/edited
    fetchProducts();
    fetchStatistics();
  };

  const handleEditSubmit = async (formData) => {
    setEditLoading(true);
    try {
      let res;
      if (editProduct) {
        res = await api.put(`/products/${editProduct.id}`, formData);
        if (res.data?.multiple) {
          toast.success(`Product expanded into ${res.data.products.length} products`);
        } else {
          toast.success('Product updated successfully');
        }
      } else {
        res = await api.post('/products', formData);
        if (res.data?.multiple) {
          toast.success(`${res.data.products.length} products created successfully`);
        } else {
          toast.success('Product created successfully');
        }
      }
      // Return data first — modal will close itself after post-save work (colors, images, assignments)
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${editProduct ? 'update' : 'create'} product`);
      throw error;
    } finally {
      setEditLoading(false);
    }
  };

  const userPerms = user?.permissions || {};
  const canEdit = userPerms['manage_products'] === true || userPerms['admin'] === true;

  // Get first product image — prefer product_images_v2 (images array), then legacy JSONB, then category assignments
  const getImage = (product) => {
    // product_images_v2 rows (enriched by backend)
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      const primary = product.images.find(img => img.is_primary) || product.images[0];
      return primary.image_url;
    }
    // Legacy JSONB product_images column
    if (product.product_images && Array.isArray(product.product_images) && product.product_images.length > 0) {
      const firstImage = product.product_images[0];
      return typeof firstImage === 'object' && firstImage !== null ? firstImage.image_url : firstImage;
    }
    if (product.image_url) return product.image_url;
    // Fallback to category assignment images
    if (product.category_assignments && product.category_assignments.length > 0) {
      const withImage = product.category_assignments.find(a => a.image_url);
      if (withImage) return withImage.image_url;
    }
    return null;
  };

  // Stock helpers
  const getStock = (p) => {
    const inv = p.total_stock ?? p.stock ?? p.quantity_on_hand ?? 0;
    if (inv > 0) return inv;
    // Fallback: sum stock_allocated from category assignments
    if (p.category_assignments && p.category_assignments.length > 0) {
      return p.category_assignments.filter(a => a.is_leaf).reduce((sum, a) => sum + (parseInt(a.stock_allocated) || 0), 0);
    }
    return inv;
  };
  const getReorder = (p) => p.reorder_level ?? 10;
  const isLowStock = (p) => getStock(p) <= getReorder(p);

  // Price helper – prefer effective_price (from category assignment override)
  const getPrice = (p) => p.effective_price || p.retail_price || p.selling_price;
  const getCostPrice = (p) => p.effective_cost_price || p.cost_price;
  const hasPriceRange = (p) => p.price_min && p.price_max && p.price_min !== p.price_max;
  const formatPriceDisplay = (p) => {
    if (hasPriceRange(p)) {
      return `${formatCurrency(p.price_min)} - ${formatCurrency(p.price_max)}`;
    }
    return formatCurrency(getPrice(p));
  };

  // Product type badge
  const renderTypeBadge = (type) => {
    const colors = {
      physical: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
      service: 'bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700',
      digital: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
      bundle: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
    };
    return (
      <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded border uppercase ${colors[type] || colors.physical}`}>
        {type || 'physical'}
      </span>
    );
  };

  // ────────────────────────────
  // VIEW RENDERERS
  // ────────────────────────────

  // LIST VIEW
  const renderListView = () => (
    <>
      {/* Mobile cards */}
      <div className="block md:hidden space-y-3">
        {products.map(product => (
          <div
            key={product.id}
            onClick={() => navigate(`/products/${product.id}`)}
            className={`rounded-lg shadow-theme-sm p-4 cursor-pointer hover:shadow-theme-md transition-shadow bg-theme-secondary border ${
              isLowStock(product) ? 'border-red-400 dark:border-red-600' : 'border-theme'
            }`}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="h-12 w-12 flex-shrink-0 bg-theme-tertiary rounded flex items-center justify-center overflow-hidden">
                {getImage(product) ? (
                  <img src={getImage(product)} alt={product.product_name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-6 h-6 text-theme-muted" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-theme-primary mb-1 line-clamp-2">{product.product_name}</h3>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-accent-gold/20 text-accent-gold border border-accent-gold/40 inline-block">
                  {product.product_code}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-theme-muted mb-0.5">Brand</p>
                <p className="text-sm font-medium text-theme-primary">{product.brand_name || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-theme-muted mb-0.5">Category</p>
                <p className="text-sm font-medium text-theme-primary">{product.category_name || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-theme-muted mb-0.5">Price</p>
                <p className="text-sm font-bold text-accent-gold">{formatPriceDisplay(product)}</p>
              </div>
              <div>
                <p className="text-xs text-theme-muted mb-0.5">Stock</p>
                <p className={`text-sm font-bold ${
                  getStock(product) > getReorder(product) ? 'text-green-600 dark:text-green-400'
                  : getStock(product) > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {getStock(product)} units
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-theme-secondary rounded-lg shadow-theme-sm border border-theme overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-theme">
            <thead className="bg-theme-tertiary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-theme-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme">
              {products.map(product => (
                <tr
                  key={product.id}
                  onClick={() => navigate(`/products/${product.id}`)}
                  className={`cursor-pointer transition-colors ${
                    isLowStock(product) ? 'bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20' : 'hover:bg-theme-tertiary'
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 bg-theme-tertiary rounded flex items-center justify-center mr-3 overflow-hidden">
                        {getImage(product) ? (
                          <img src={getImage(product)} alt={product.product_name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-5 h-5 text-theme-muted" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-theme-primary">{product.product_name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-accent-gold/20 text-accent-gold border border-accent-gold/40">
                            {product.product_code}
                          </span>
                          {renderTypeBadge(product.product_type)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-secondary">
                    <div>{product.brand_name || '-'}</div>
                    <div className="text-xs text-theme-muted">{product.category_name || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-accent-gold">
                    {formatPriceDisplay(product)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-semibold ${
                      getStock(product) > getReorder(product) ? 'text-green-600 dark:text-green-400'
                      : getStock(product) > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {getStock(product)} units
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/products/${product.id}`); }}
                      className="text-accent-gold hover:text-accent-goldDark mr-3"
                    >
                      View
                    </button>
                    {canEdit && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }}
                        className="text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  // COMPACT VIEW
  const renderCompactView = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
      {products.map(product => (
        <div
          key={product.id}
          onClick={() => navigate(`/products/${product.id}`)}
          className={`rounded-lg shadow-theme-sm p-2 sm:p-3 hover:shadow-theme-md transition-shadow cursor-pointer min-h-[160px] flex flex-col bg-theme-secondary border ${
            isLowStock(product) ? 'border-red-400 dark:border-red-600' : 'border-theme'
          }`}
        >
          <div className="bg-theme-tertiary h-20 sm:h-24 rounded flex items-center justify-center mb-2 overflow-hidden">
            {getImage(product) ? (
              <img src={getImage(product)} alt={product.product_name} className="w-full h-full object-cover" />
            ) : (
              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-theme-muted" />
            )}
          </div>
          <div className="text-[10px] sm:text-xs font-mono font-semibold px-1 sm:px-1.5 py-0.5 rounded bg-accent-gold/20 text-accent-gold text-center mb-1 truncate border border-accent-gold/40">
            {product.product_code}
          </div>
          <h3 className="text-xs font-semibold text-theme-primary line-clamp-2 mb-1 flex-grow">{product.product_name}</h3>
          <div className="space-y-0.5">
            <p className="text-xs sm:text-sm font-bold text-accent-gold truncate">{formatPriceDisplay(product)}</p>
            <p className={`text-[10px] sm:text-xs font-semibold ${
              getStock(product) > getReorder(product) ? 'text-green-600 dark:text-green-400'
              : getStock(product) > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {getStock(product)} units
            </p>
          </div>
        </div>
      ))}
    </div>
  );

  // GRID VIEW (Default)
  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {products.map(product => (
        <div
          key={product.id}
          className={`rounded-lg shadow-theme-sm overflow-hidden hover:shadow-theme-md transition-shadow cursor-pointer bg-theme-secondary border ${
            isLowStock(product) ? 'border-red-400 dark:border-red-600' : 'border-theme'
          }`}
        >
          <div onClick={() => navigate(`/products/${product.id}`)}>
            <div className="bg-theme-tertiary h-48 flex items-center justify-center overflow-hidden">
              {getImage(product) ? (
                <img
                  src={getImage(product)}
                  alt={product.product_name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <Package className="w-16 h-16 text-theme-muted" />
              )}
            </div>
            <div className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xs font-mono font-semibold px-2 py-1 rounded bg-accent-gold/20 text-accent-gold border border-accent-gold/40">
                  {product.product_code}
                </span>
                {renderTypeBadge(product.product_type)}
              </div>
              <h3 className="text-lg font-semibold text-theme-primary mb-2 line-clamp-2">
                {product.product_name}
              </h3>
              <div className="space-y-1 mb-3 text-sm text-theme-secondary">
                <p><span className="font-medium">Brand:</span> {product.brand_name || '-'}</p>
                <p><span className="font-medium">Category:</span> {product.category_name || '-'}</p>
              </div>
              {/* Color swatches */}
              {product.colors && product.colors.length > 0 && (
                <div className="flex items-center gap-1.5 mb-3">
                  {product.colors.slice(0, 6).map(color => (
                    <div
                      key={color.id}
                      className="w-5 h-5 rounded-full border border-theme flex-shrink-0"
                      style={{ backgroundColor: color.color_code || '#ccc' }}
                      title={color.color_name}
                    />
                  ))}
                  {product.colors.length > 6 && (
                    <span className="text-xs text-theme-muted">+{product.colors.length - 6}</span>
                  )}
                </div>
              )}
              {/* Selection category badges with stock */}
              {product.category_assignments && product.category_assignments.filter(a => a.is_selection_attribute || a.is_leaf).length > 0 && (
                <div className="flex items-center gap-1 flex-wrap mb-3">
                  {product.category_assignments
                    .filter(a => a.is_selection_attribute || a.is_leaf)
                    .slice(0, 4)
                    .map(a => (
                      <span key={a.category_id} className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                        {a.category_name}{a.stock_allocated ? ` · ${a.stock_allocated}` : ''}{a.price_override ? ` · ${formatCurrency(a.price_override)}` : ''}
                      </span>
                    ))}
                  {product.category_assignments.filter(a => a.is_selection_attribute || a.is_leaf).length > 4 && (
                    <span className="text-[10px] text-theme-muted">+{product.category_assignments.filter(a => a.is_selection_attribute || a.is_leaf).length - 4} more</span>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-theme">
                <div>
                  <p className="text-xs text-theme-muted">Price</p>
                  <p className="text-lg font-bold text-accent-gold">
                    {formatPriceDisplay(product)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-theme-muted">Stock</p>
                  <p className={`text-lg font-bold ${
                    getStock(product) > getReorder(product) ? 'text-green-600 dark:text-green-400'
                    : getStock(product) > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {getStock(product)} units
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // DETAILED VIEW
  const renderDetailedView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
      {products.map(product => (
        <div
          key={product.id}
          onClick={() => navigate(`/products/${product.id}`)}
          className={`rounded-lg shadow-theme-sm overflow-hidden hover:shadow-theme-md transition-shadow cursor-pointer bg-theme-secondary border ${
            isLowStock(product) ? 'border-red-400 dark:border-red-600' : 'border-theme'
          }`}
        >
          <div className="sm:flex">
            <div className="sm:w-1/3 bg-theme-tertiary h-40 sm:h-auto flex items-center justify-center overflow-hidden">
              {getImage(product) ? (
                <img src={getImage(product)} alt={product.product_name} className="w-full h-full object-cover" />
              ) : (
                <Package className="w-12 h-12 sm:w-16 sm:h-16 text-theme-muted" />
              )}
            </div>
            <div className="p-3 sm:p-4 sm:w-2/3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-mono font-semibold px-2 py-1 rounded bg-accent-gold/20 text-accent-gold border border-accent-gold/40 inline-block mb-2">
                    {product.product_code}
                  </span>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-theme-primary mb-1 line-clamp-2">{product.product_name}</h3>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 text-xs sm:text-sm">
                <div>
                  <p className="text-theme-muted text-[10px] sm:text-xs">Brand</p>
                  <p className="font-semibold text-theme-primary truncate">{product.brand_name || '-'}</p>
                </div>
                <div>
                  <p className="text-theme-muted text-[10px] sm:text-xs">Category</p>
                  <p className="font-semibold text-theme-primary truncate">{product.category_name || '-'}</p>
                </div>
                <div>
                  <p className="text-theme-muted text-[10px] sm:text-xs">Type</p>
                  <p className="font-semibold text-theme-primary truncate capitalize">{product.product_type || 'physical'}</p>
                </div>
                <div>
                  <p className="text-theme-muted text-[10px] sm:text-xs">Status</p>
                  <p className="font-semibold text-theme-primary truncate">{product.is_active !== false ? 'Active' : 'Inactive'}</p>
                </div>
              </div>
              {/* Colors */}
              {product.colors && product.colors.length > 0 && (
                <div className="flex items-center gap-1.5 mb-2">
                  {product.colors.slice(0, 8).map(color => (
                    <div
                      key={color.id}
                      className="w-4 h-4 rounded-full border border-theme flex-shrink-0"
                      style={{ backgroundColor: color.color_code || '#ccc' }}
                      title={color.color_name}
                    />
                  ))}
                  {product.colors.length > 8 && (
                    <span className="text-[10px] text-theme-muted">+{product.colors.length - 8}</span>
                  )}
                </div>
              )}
              {/* Category attributes summary */}
              {product.category_assignments && product.category_assignments.filter(a => a.is_selection_attribute || a.is_leaf).length > 0 && (
                <div className="flex items-center gap-1 flex-wrap mb-2">
                  {product.category_assignments
                    .filter(a => a.is_selection_attribute || a.is_leaf)
                    .slice(0, 4)
                    .map(a => (
                      <span key={a.category_id} className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                        {a.category_name}{a.stock_allocated ? ` (${a.stock_allocated})` : ''}
                      </span>
                    ))}
                  {product.category_assignments.filter(a => a.is_selection_attribute || a.is_leaf).length > 4 && (
                    <span className="text-[10px] text-theme-muted">+{product.category_assignments.filter(a => a.is_selection_attribute || a.is_leaf).length - 4} more</span>
                  )}
                </div>
              )}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3 pb-3 border-t border-b border-theme py-2 sm:py-3">
                <div>
                  <p className="text-[10px] sm:text-xs text-theme-muted">Selling</p>
                  <p className="text-sm sm:text-base md:text-lg font-bold text-accent-gold truncate">
                    {formatPriceDisplay(product)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-theme-muted">Cost</p>
                  <p className="text-sm sm:text-base font-semibold text-theme-secondary truncate">
                    {formatCurrency(getCostPrice(product))}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] sm:text-xs text-theme-muted">Stock</p>
                  <p className={`text-base sm:text-lg md:text-xl font-bold ${
                    getStock(product) > getReorder(product) ? 'text-green-600 dark:text-green-400'
                    : getStock(product) > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {getStock(product)}
                  </p>
                  <p className="text-[10px] sm:text-xs text-theme-muted">units</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Render products based on view mode
  const renderProducts = () => {
    switch (viewMode) {
      case 'list': return renderListView();
      case 'compact': return renderCompactView();
      case 'detailed': return renderDetailedView();
      case 'grid':
      default: return renderGridView();
    }
  };

  // Pagination
  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;
    const pages = [];
    for (let i = 1; i <= pagination.totalPages; i++) {
      if (
        i === 1 || i === pagination.totalPages ||
        (i >= pagination.page - 1 && i <= pagination.page + 1)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return (
      <div className="flex items-center justify-between mt-6">
        <p className="text-sm text-theme-muted">
          Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} products
        </p>
        <div className="flex items-center gap-1">
          {pages.map((p, idx) =>
            p === '...' ? (
              <span key={`dots-${idx}`} className="px-2 text-theme-muted">…</span>
            ) : (
              <button
                key={p}
                onClick={() => handleFilterChange('page', p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  p === pagination.page
                    ? 'bg-accent-gold text-white'
                    : 'text-theme-secondary hover:bg-theme-tertiary'
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>
      </div>
    );
  };

  const headerActions = (
    <div className="flex items-center gap-2">
      <button
        onClick={() => navigate('/products/category-insights')}
        className="border border-theme text-theme-secondary px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm hover:bg-theme-tertiary transition flex items-center justify-center gap-1.5 sm:gap-2"
        title="Category Group Insights"
      >
        <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Category Insights</span>
      </button>
      {canEdit && (
        <button
          onClick={() => { setEditProduct(null); setEditModalOpen(true); }}
          className="bg-accent-gold text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm hover:bg-accent-goldDark transition flex items-center justify-center gap-1.5 sm:gap-2"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Add Product
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6 max-w-[1700px] mx-auto pb-6 sm:pb-10">
      <PageHeader
        title="Product Management"
        subtitle="Manage your product inventory"
        badge={`${pagination.total || products.length} Products`}
        icon={Package}
        actions={headerActions}
      />

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
          <div className="p-4 rounded-xl bg-theme-secondary border border-blue-500/50 shadow-theme-sm relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="text-xs md:text-sm font-medium text-theme-muted mb-1">Total Products</h3>
              <p className="text-xl md:text-2xl font-bold text-theme-primary">{statistics.total_products || 0}</p>
            </div>
            <Package className="absolute -right-2 -bottom-2 w-12 h-12 text-blue-500/10 group-hover:scale-110 transition-transform" />
          </div>

          <div className="p-4 rounded-xl bg-theme-secondary border border-green-500/50 shadow-theme-sm relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="text-xs md:text-sm font-medium text-theme-muted mb-1">Total Stock</h3>
              <p className="text-xl md:text-2xl font-bold text-theme-primary">{Number(statistics.total_stock || 0).toLocaleString()}</p>
            </div>
            <Grid2x2 className="absolute -right-2 -bottom-2 w-12 h-12 text-green-500/10 group-hover:scale-110 transition-transform" />
          </div>

          <div
            onClick={() => {
              handleFilterChange('low_stock', !filters.low_stock);
              if (!filters.low_stock) setShowFilters(true);
            }}
            className="p-4 rounded-xl bg-theme-secondary border border-yellow-500/50 shadow-theme-sm cursor-pointer hover:shadow-theme-md transition-all relative overflow-hidden group"
            title="Click to filter low stock products"
          >
            <div className="relative z-10">
              <h3 className="text-xs md:text-sm font-medium text-theme-muted mb-1">Low Stock</h3>
              <p className="text-xl md:text-2xl font-bold text-theme-primary">{statistics.low_stock_count || 0}</p>
            </div>
            <BarChart3 className="absolute -right-2 -bottom-2 w-12 h-12 text-yellow-500/10 group-hover:scale-110 transition-transform" />
          </div>

          <div className="p-4 rounded-xl bg-theme-secondary border border-purple-500/50 shadow-theme-sm relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="text-xs md:text-sm font-medium text-theme-muted mb-1">Stock Cost</h3>
              <p className="text-xl md:text-2xl font-bold text-theme-primary">
                {formatCurrency(statistics.stock_cost || 0)}
              </p>
            </div>
            <DollarSign className="absolute -right-2 -bottom-2 w-12 h-12 text-purple-500/10 group-hover:scale-110 transition-transform" />
          </div>

          <div className="p-4 rounded-xl bg-theme-secondary border border-accent-gold/50 shadow-theme-sm relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="text-xs md:text-sm font-medium text-theme-muted mb-1">Stock Value</h3>
              <p className="text-xl md:text-2xl font-bold text-theme-primary">
                {formatCurrency(statistics.stock_value || 0)}
              </p>
            </div>
            <TrendingUp className="absolute -right-2 -bottom-2 w-12 h-12 text-accent-gold/10 group-hover:scale-110 transition-transform" />
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-theme-secondary rounded-xl shadow-theme-sm border border-theme p-4">
        <div className="flex flex-col md:flex-row gap-3 md:gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-theme-muted absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-theme-primary border border-theme rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none text-sm text-theme-primary placeholder-theme-muted"
            />
          </div>
          <div className="flex gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-1 border border-theme rounded-lg bg-theme-tertiary">
              {[
                { mode: 'list', Icon: List, title: 'List View' },
                { mode: 'compact', Icon: Grid2x2, title: 'Compact View' },
                { mode: 'grid', Icon: LayoutGrid, title: 'Grid View' },
                { mode: 'detailed', Icon: Grid3x3, title: 'Detailed View' },
              ].map(({ mode, Icon, title }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`p-1 sm:p-1.5 rounded transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center ${
                    viewMode === mode
                      ? 'bg-accent-gold text-white'
                      : 'text-theme-muted hover:bg-theme-secondary'
                  }`}
                  title={title}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 border rounded-lg hover:bg-theme-tertiary transition-colors min-h-[36px] text-sm ${
                showFilters ? 'border-accent-gold text-accent-gold' : 'border-theme text-theme-secondary'
              }`}
            >
              <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Filters</span>
            </button>
            <button
              onClick={() => { fetchProducts(); fetchStatistics(); }}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-theme rounded-lg hover:bg-theme-tertiary transition-colors min-h-[36px] text-theme-secondary"
            >
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-theme">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">Product Type</label>
                <select
                  value={filters.product_type}
                  onChange={(e) => handleFilterChange('product_type', e.target.value)}
                  className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none text-sm"
                >
                  <option value="">All Types</option>
                  <option value="physical">Physical</option>
                  <option value="service">Service</option>
                  <option value="digital">Digital</option>
                  <option value="bundle">Bundle</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">Brand</label>
                <select
                  value={filters.brand_id}
                  onChange={(e) => handleFilterChange('brand_id', e.target.value)}
                  className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none text-sm"
                >
                  <option value="">All Brands</option>
                  {brands.map(brand => (
                    <option key={brand.id} value={brand.id}>{brand.brand_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">Category</label>
                <select
                  value={filters.category_id}
                  onChange={(e) => handleFilterChange('category_id', e.target.value)}
                  className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none text-sm"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.category_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">Status</label>
                <select
                  value={filters.is_active}
                  onChange={(e) => handleFilterChange('is_active', e.target.value)}
                  className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none text-sm"
                >
                  <option value="">All</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.low_stock}
                  onChange={(e) => handleFilterChange('low_stock', e.target.checked)}
                  className="rounded text-accent-gold focus:ring-accent-gold w-4 h-4"
                />
                <span className="text-sm text-theme-secondary">Low Stock Only</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.is_featured === 'true'}
                  onChange={(e) => handleFilterChange('is_featured', e.target.checked ? 'true' : '')}
                  className="rounded text-accent-gold focus:ring-accent-gold w-4 h-4"
                />
                <span className="text-sm text-theme-secondary">Featured Only</span>
              </label>
              <button
                onClick={clearFilters}
                className="ml-auto flex items-center gap-1 px-3 py-1 text-sm text-theme-muted hover:text-theme-primary"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Products Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-theme border-t-accent-gold rounded-full animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="bg-theme-secondary rounded-xl shadow-theme-sm border border-theme p-12 text-center">
          <Package className="w-16 h-16 text-theme-muted mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-theme-primary mb-2">No Products Found</h3>
          <p className="text-theme-muted mb-6">
            {filters.search || filters.brand_id || filters.category_id || filters.product_type
              ? 'Try adjusting your filters'
              : 'Get started by adding your first product'}
          </p>
          {canEdit && (
            <button
              onClick={() => { setEditProduct(null); setEditModalOpen(true); }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent-gold text-white font-semibold rounded-lg hover:bg-accent-goldDark transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Product
            </button>
          )}
        </div>
      ) : (
        <>
          {renderProducts()}
          {renderPagination()}
        </>
      )}
      <ProductFormModal
        isOpen={editModalOpen}
        onClose={handleEditClose}
        onSubmit={handleEditSubmit}
        product={editProduct}
        brands={brands}
        categories={categories}
        loading={editLoading}
      />

    </div>
  );
};

export default ProductsPage;
