import React, { useState, useEffect } from 'react';
import {
  Plus,
  Download,
  Upload,
  Filter,
  Star,
  Package,
  Grid,
  List,
  Search,
} from 'lucide-react';
import {
  Button,
  SearchBar,
  ViewModeToggle,
  Badge,
  LoadingSpinner,
  EmptyState,
  ConfirmDialog,
} from '../components/ui';
import {
  ProductGrid,
  ProductCard,
  ProductListItem,
  ProductFormModal,
  ProductDetailView,
} from '../components/product';

/**
 * ProductCatalog Page
 * Main product listing page with filtering, search, and view modes
 */
const ProductCatalog = () => {
  // State
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid, list, compact, detailed
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    product_type: '',
    brand_id: '',
    category_id: '',
    is_active: 'all',
    is_featured: false,
    low_stock_only: false,
    price_min: '',
    price_max: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // Filter options (these would come from API)
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Statistics
  const [stats, setStats] = useState({
    total_products: 0,
    active_products: 0,
    low_stock_count: 0,
    total_value: 0,
  });

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, [page, searchQuery, filters]);

  // Fetch filter options
  useEffect(() => {
    fetchBrands();
    fetchCategories();
    fetchStats();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // Build query params
      // const params = new URLSearchParams({
      //   page,
      //   limit: 20,
      //   search: searchQuery,
      //   ...filters,
      // });
      // const response = await fetch(`/api/products?${params}`);
      // const data = await response.json();

      // Mock data for now
      const mockData = [
        {
          id: '1',
          product_name: 'Wireless Mouse',
          product_code: 'PRD-0001',
          product_type: 'physical',
          selling_price: 29.99,
          cost_price: 15.00,
          quantity_on_hand: 45,
          reorder_level: 20,
          is_active: true,
          is_featured: true,
          brand_name: 'Logitech',
          category_name: 'Electronics',
          image_url: '',
          has_variants: false,
        },
        {
          id: '2',
          product_name: 'USB-C Cable',
          product_code: 'PRD-0002',
          product_type: 'physical',
          selling_price: 12.99,
          cost_price: 5.00,
          quantity_on_hand: 8,
          reorder_level: 15,
          is_active: true,
          is_featured: false,
          brand_name: 'Anker',
          category_name: 'Electronics',
          image_url: '',
          has_variants: true,
        },
        {
          id: '3',
          product_name: 'Office Chair',
          product_code: 'PRD-0003',
          product_type: 'physical',
          selling_price: 199.99,
          cost_price: 120.00,
          quantity_on_hand: 12,
          reorder_level: 5,
          is_active: true,
          is_featured: false,
          brand_name: 'Herman Miller',
          category_name: 'Furniture',
          image_url: '',
          has_variants: false,
        },
      ];

      setProducts(mockData);
      setTotalCount(mockData.length);
      setTotalPages(1);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBrands = async () => {
    // TODO: Replace with actual API call
    setBrands([
      { id: '1', brand_name: 'Logitech' },
      { id: '2', brand_name: 'Anker' },
      { id: '3', brand_name: 'Herman Miller' },
    ]);
  };

  const fetchCategories = async () => {
    // TODO: Replace with actual API call
    setCategories([
      { id: '1', category_name: 'Electronics' },
      { id: '2', category_name: 'Furniture' },
      { id: '3', category_name: 'Office Supplies' },
    ]);
  };

  const fetchStats = async () => {
    // TODO: Replace with actual API call
    setStats({
      total_products: 156,
      active_products: 142,
      low_stock_count: 12,
      total_value: 45678.90,
    });
  };

  const handleCreateProduct = async (productData) => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/products', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(productData),
      // });
      // const newProduct = await response.json();

      await fetchProducts();
      setShowProductForm(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Error creating product:', error);
    }
  };

  const handleUpdateProduct = async (productData) => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/products/${selectedProduct.id}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(productData),
      // });

      await fetchProducts();
      setShowProductForm(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/products/${productToDelete.id}`, {
      //   method: 'DELETE',
      // });

      await fetchProducts();
      setShowDeleteConfirm(false);
      setProductToDelete(null);
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleExport = () => {
    // TODO: Implement export to CSV
    console.log('Export products to CSV');
  };

  const handleImport = () => {
    // TODO: Implement import from CSV
    console.log('Import products from CSV');
  };

  const clearFilters = () => {
    setFilters({
      product_type: '',
      brand_id: '',
      category_id: '',
      is_active: 'all',
      is_featured: false,
      low_stock_only: false,
      price_min: '',
      price_max: '',
    });
    setSearchQuery('');
  };

  const activeFilterCount = Object.values(filters).filter((v) => v && v !== 'all').length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-theme-primary mb-2">Product Catalog</h1>
        <p className="text-theme-secondary">Manage your product inventory and pricing</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Products"
          value={stats.total_products}
          icon={Package}
          variant="primary"
        />
        <StatCard
          label="Active Products"
          value={stats.active_products}
          icon={Package}
          variant="success"
        />
        <StatCard
          label="Low Stock"
          value={stats.low_stock_count}
          icon={Package}
          variant="warning"
        />
        <StatCard
          label="Total Value"
          value={`$${stats.total_value.toLocaleString()}`}
          icon={Package}
          variant="info"
        />
      </div>

      {/* Toolbar */}
      <div className="bg-theme-secondary rounded-2xl shadow-theme-sm border border-theme p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search products by name, code, or SKU..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              icon={Filter}
              onClick={() => setShowFilters(!showFilters)}
              className={activeFilterCount > 0 ? 'border-blue-600 text-blue-600' : ''}
            >
              Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </Button>

            <ViewModeToggle
              value={viewMode}
              onChange={setViewMode}
              modes={['grid', 'list']}
            />

            <Button variant="outline" icon={Download} onClick={handleExport}>
              Export
            </Button>

            <Button variant="outline" icon={Upload} onClick={handleImport}>
              Import
            </Button>

            <Button
              variant="primary"
              icon={Plus}
              onClick={() => {
                setSelectedProduct(null);
                setShowProductForm(true);
              }}
            >
              Add Product
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-theme">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Product Type */}
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Product Type
                </label>
                <select
                  value={filters.product_type}
                  onChange={(e) => setFilters({ ...filters, product_type: e.target.value })}
                  className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" className="bg-theme-secondary">All Types</option>
                  <option value="physical" className="bg-theme-secondary">Physical</option>
                  <option value="service" className="bg-theme-secondary">Service</option>
                  <option value="digital" className="bg-theme-secondary">Digital</option>
                  <option value="bundle" className="bg-theme-secondary">Bundle</option>
                </select>
              </div>

              {/* Brand */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                <select
                  value={filters.brand_id}
                  onChange={(e) => setFilters({ ...filters, brand_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Brands</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.brand_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={filters.category_id}
                  onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.category_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.is_active}
                  onChange={(e) => setFilters({ ...filters, is_active: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>

            {/* Additional Filters */}
            <div className="flex items-center gap-4 mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.is_featured}
                  onChange={(e) => setFilters({ ...filters, is_featured: e.target.checked })}
                  className="w-4 h-4 text-theme-primary rounded focus:ring-blue-500"
                />
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-theme-secondary">Featured Only</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.low_stock_only}
                  onChange={(e) => setFilters({ ...filters, low_stock_only: e.target.checked })}
                  className="w-4 h-4 text-theme-primary rounded focus:ring-blue-500"
                />
                <span className="text-sm text-theme-secondary">Low Stock Only</span>
              </label>

              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All Filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Product List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products found"
          description="Try adjusting your filters or create your first product"
          action={
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => {
                setSelectedProduct(null);
                setShowProductForm(true);
              }}
            >
              Add Product
            </Button>
          }
        />
      ) : viewMode === 'grid' ? (
        <ProductGrid
          products={products}
          onEdit={(product) => {
            setSelectedProduct(product);
            setShowProductForm(true);
          }}
          onDelete={(product) => {
            setProductToDelete(product);
            setShowDeleteConfirm(true);
          }}
          onView={(product) => {
            setSelectedProduct(product);
            setShowProductDetail(true);
          }}
        />
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <ProductListItem
              key={product.id}
              product={product}
              onEdit={(product) => {
                setSelectedProduct(product);
                setShowProductForm(true);
              }}
              onDelete={(product) => {
                setProductToDelete(product);
                setShowDeleteConfirm(true);
              }}
              onView={(product) => {
                setSelectedProduct(product);
                setShowProductDetail(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={showProductForm}
        onClose={() => {
          setShowProductForm(false);
          setSelectedProduct(null);
        }}
        onSubmit={selectedProduct ? handleUpdateProduct : handleCreateProduct}
        product={selectedProduct}
        brands={brands}
        categories={categories}
      />

      {/* Product Detail Modal */}
      {showProductDetail && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-theme-secondary rounded-2xl shadow-theme-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-theme">
            <ProductDetailView
              product={selectedProduct}
              onEdit={(product) => {
                setShowProductDetail(false);
                setSelectedProduct(product);
                setShowProductForm(true);
              }}
              onDelete={(product) => {
                setShowProductDetail(false);
                setProductToDelete(product);
                setShowDeleteConfirm(true);
              }}
              onClose={() => {
                setShowProductDetail(false);
                setSelectedProduct(null);
              }}
            />
            <div className="p-6 border-t border-theme">
              <Button
                variant="outline"
                onClick={() => {
                  setShowProductDetail(false);
                  setSelectedProduct(null);
                }}
                className="w-full"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setProductToDelete(null);
        }}
        onConfirm={handleDeleteProduct}
        title="Delete Product"
        message={`Are you sure you want to delete "${productToDelete?.product_name}"? This action can be undone from the Recycle Bin.`}
        confirmText="Delete Product"
        variant="danger"
      />
    </div>
  );
};

// Stat Card Component
const StatCard = ({ label, value, icon: Icon, variant = 'default' }) => {
  const variants = {
    default: 'bg-theme-tertiary text-theme-primary border border-theme',
    primary: 'bg-blue-50 text-blue-900 border border-blue-100 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800',
    success: 'bg-green-50 text-green-900 border border-green-100 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800',
    warning: 'bg-yellow-50 text-yellow-900 border border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-200 dark:border-yellow-800',
    info: 'bg-cyan-50 text-cyan-900 border border-cyan-100 dark:bg-cyan-900/20 dark:text-cyan-200 dark:border-cyan-800',
  };

  return (
    <div className={`p-4 rounded-2xl ${variants[variant]} shadow-sm`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium opacity-75">{label}</span>
        <Icon className="w-5 h-5 opacity-50" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
};

export default ProductCatalog;
