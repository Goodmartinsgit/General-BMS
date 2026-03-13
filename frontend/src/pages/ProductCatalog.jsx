import React, { useState, useEffect } from 'react';
import { Plus, Download, Filter, Star, Package, LayoutGrid, List, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '../components/ui/Modal';
import PageHeader from '../components/common/PageHeader';
import { ProductGrid, ProductListItem, ProductFormModal, ProductDetailView } from '../components/product';
import { useCurrency } from '../context/CurrencyContext';
import api from '../api/axios';
import { toast } from 'react-toastify';

const inputClass = 'w-full px-3 py-2.5 bg-theme-primary border border-theme rounded-lg text-sm text-theme-primary placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 transition-all';
const labelClass = 'block text-sm font-medium text-theme-secondary mb-1';
const PAGE_SIZE = 24;

const ProductCatalog = () => {
  const { formatCurrency } = useCurrency();

  const [products, setProducts]     = useState([]);
  const [loading, setLoading]       = useState(false);
  const [viewMode, setViewMode]     = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters]       = useState({
    product_type: '', brand_id: '', category_id: '',
    is_active: 'all', is_featured: false, low_stock_only: false,
  });

  const [showForm, setShowForm]           = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetail, setShowDetail]       = useState(false);
  const [deleteModal, setDeleteModal]     = useState({ open: false, product: null });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [brands, setBrands]         = useState([]);
  const [categories, setCategories] = useState([]);

  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [stats, setStats] = useState({ total_products: 0, active_products: 0, low_stock_count: 0, total_value: 0 });

  useEffect(() => { fetchProducts(); }, [page, searchQuery, filters]);

  useEffect(() => {
    fetchBrands();
    fetchCategories();
    fetchStats();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (searchQuery) params.search = searchQuery;
      if (filters.product_type) params.product_type = filters.product_type;
      if (filters.brand_id)     params.brand_id     = filters.brand_id;
      if (filters.category_id)  params.category_id  = filters.category_id;
      if (filters.is_active !== 'all') params.is_active = filters.is_active;
      if (filters.is_featured)  params.is_featured  = true;
      if (filters.low_stock_only) params.low_stock_only = true;

      const res = await api.get('/products', { params });
      const data = res.data;
      setProducts(data.products || data.data || []);
      setTotalCount(data.total || data.total_count || 0);
      setTotalPages(Math.ceil((data.total || data.total_count || 0) / PAGE_SIZE) || 1);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await api.get('/products/brands');
      setBrands(res.data?.brands || res.data || []);
    } catch { /* silent */ }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/products/categories');
      setCategories(res.data?.categories || res.data || []);
    } catch { /* silent */ }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/products/statistics');
      setStats(res.data?.statistics || res.data || stats);
    } catch { /* silent */ }
  };

  const handleCreate = async (productData) => {
    try {
      const res = await api.post('/products', productData);
      toast.success('Product created');
      return res.data;
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create product');
      throw e;
    }
  };

  const handleUpdate = async (productData) => {
    try {
      const res = await api.put(`/products/${selectedProduct.id}`, productData);
      toast.success('Product updated');
      return res.data;
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update product');
      throw e;
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.product) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/products/${deleteModal.product.id}`);
      toast.success('Product deleted');
      setDeleteModal({ open: false, product: null });
      fetchProducts(); fetchStats();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete product');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExport = () => {
    try {
      const headers = ['Name', 'Code', 'Type', 'Price', 'Cost', 'Stock', 'Brand', 'Category', 'Active'];
      const rows = products.map(p => [
        p.product_name, p.product_code, p.product_type,
        p.selling_price, p.cost_price, p.quantity_on_hand,
        p.brand_name || '', p.category_name || '',
        p.is_active ? 'Yes' : 'No',
      ]);
      const csv = [headers, ...rows].map(r => r.map(c => `"${c ?? ''}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `products-${new Date().toISOString().split('T')[0]}.csv`;
      a.click(); URL.revokeObjectURL(url);
      toast.success('Products exported');
    } catch {
      toast.error('Failed to export products');
    }
  };

  const clearFilters = () => {
    setFilters({ product_type: '', brand_id: '', category_id: '', is_active: 'all', is_featured: false, low_stock_only: false });
    setSearchQuery('');
    setPage(1);
  };

  const openEdit   = (p) => { setSelectedProduct(p); setShowForm(true); };
  const openCreate = ()  => { setSelectedProduct(null); setShowForm(true); };
  const openView   = (p) => { setSelectedProduct(p); setShowDetail(true); };
  const openDelete = (p) => setDeleteModal({ open: true, product: p });

  const activeFilterCount = Object.values(filters).filter(v => v && v !== 'all').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Product Catalog"
        subtitle="Manage your product inventory and pricing"
        icon={Package}
        badge={totalCount > 0 ? `${totalCount} products` : null}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-theme-secondary bg-theme-primary hover:bg-theme-tertiary border border-theme rounded-lg transition-colors">
              <Download className="w-4 h-4" /> Export
            </button>
            <button onClick={openCreate}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-accent-gold rounded-lg hover:bg-accent-goldDark transition-colors">
              <Plus className="w-4 h-4" /> Add Product
            </button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Products',  value: stats.total_products,  color: 'text-blue-500',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20' },
          { label: 'Active Products', value: stats.active_products, color: 'text-green-500',  bg: 'bg-green-500/10',  border: 'border-green-500/20' },
          { label: 'Low Stock',       value: stats.low_stock_count, color: 'text-red-500',    bg: 'bg-red-500/10',    border: 'border-red-500/20' },
          { label: 'Total Value',     value: formatCurrency(stats.total_value || 0), color: 'text-accent-gold', bg: 'bg-accent-gold/10', border: 'border-accent-gold/20' },
        ].map(({ label, value, color, bg, border }) => (
          <div key={label} className="bg-theme-secondary border border-theme rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-theme-muted">{label}</span>
              <div className={`w-8 h-8 ${bg} border ${border} rounded-lg flex items-center justify-center`}>
                <Package className={`w-4 h-4 ${color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-theme-primary">{value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-theme-secondary border border-theme rounded-xl p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-theme-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder="Search by name, code, or SKU..."
              className={`${inputClass} pl-9 pr-8`}
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-primary">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(f => !f)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${activeFilterCount > 0 ? 'bg-accent-gold/10 text-accent-gold border-accent-gold/30' : 'text-theme-secondary bg-theme-primary border-theme hover:bg-theme-tertiary'}`}
            >
              <Filter className="w-4 h-4" />
              Filters {activeFilterCount > 0 && <span className="w-4 h-4 flex items-center justify-center bg-accent-gold text-white text-[10px] font-bold rounded-full">{activeFilterCount}</span>}
            </button>

            <div className="flex items-center border border-theme rounded-lg overflow-hidden">
              <button onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-accent-gold text-white' : 'bg-theme-primary text-theme-muted hover:bg-theme-tertiary'}`}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-accent-gold text-white' : 'bg-theme-primary text-theme-muted hover:bg-theme-tertiary'}`}>
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="pt-4 border-t border-theme space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className={labelClass}>Product Type</label>
                <select value={filters.product_type} onChange={e => setFilters(f => ({ ...f, product_type: e.target.value }))} className={inputClass}>
                  <option value="">All Types</option>
                  <option value="physical">Physical</option>
                  <option value="service">Service</option>
                  <option value="digital">Digital</option>
                  <option value="bundle">Bundle</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Brand</label>
                <select value={filters.brand_id} onChange={e => setFilters(f => ({ ...f, brand_id: e.target.value }))} className={inputClass}>
                  <option value="">All Brands</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.brand_name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Category</label>
                <select value={filters.category_id} onChange={e => setFilters(f => ({ ...f, category_id: e.target.value }))} className={inputClass}>
                  <option value="">All Categories</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <select value={filters.is_active} onChange={e => setFilters(f => ({ ...f, is_active: e.target.value }))} className={inputClass}>
                  <option value="all">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={filters.is_featured}
                  onChange={e => setFilters(f => ({ ...f, is_featured: e.target.checked }))}
                  className="w-4 h-4 rounded" />
                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                <span className="text-sm text-theme-secondary">Featured Only</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={filters.low_stock_only}
                  onChange={e => setFilters(f => ({ ...f, low_stock_only: e.target.checked }))}
                  className="w-4 h-4 rounded" />
                <span className="text-sm text-theme-secondary">Low Stock Only</span>
              </label>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="text-xs text-theme-muted hover:text-theme-primary underline">
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Product List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-theme border-t-accent-gold rounded-full animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-theme-secondary border border-theme rounded-xl">
          <div className="w-14 h-14 bg-accent-gold/10 border border-accent-gold/20 rounded-xl flex items-center justify-center mb-4">
            <Package className="w-7 h-7 text-accent-gold" />
          </div>
          <p className="text-base font-semibold text-theme-primary mb-1">No products found</p>
          <p className="text-sm text-theme-muted mb-4">
            {searchQuery || activeFilterCount > 0 ? 'Try adjusting your search or filters' : 'Create your first product to get started'}
          </p>
          {!searchQuery && activeFilterCount === 0 && (
            <button onClick={openCreate}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-accent-gold rounded-lg hover:bg-accent-goldDark transition-colors">
              <Plus className="w-4 h-4" /> Add Product
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <ProductGrid products={products} onEdit={openEdit} onDelete={openDelete} onView={openView} />
      ) : (
        <div className="space-y-2">
          {products.map(p => (
            <ProductListItem key={p.id} product={p} onEdit={openEdit} onDelete={openDelete} onView={openView} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-theme-muted">
            Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} products
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-2 text-theme-secondary border border-theme rounded-lg hover:bg-theme-tertiary disabled:opacity-40 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-sm text-theme-primary font-medium">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-2 text-theme-secondary border border-theme rounded-lg hover:bg-theme-tertiary disabled:opacity-40 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setSelectedProduct(null); fetchProducts(); fetchStats(); }}
        onSubmit={selectedProduct ? handleUpdate : handleCreate}
        product={selectedProduct}
        brands={brands}
        categories={categories}
      />

      {/* Product Detail Modal */}
      {showDetail && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-theme-secondary rounded-2xl shadow-theme-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-theme">
            <ProductDetailView
              product={selectedProduct}
              onEdit={(p) => { setShowDetail(false); openEdit(p); }}
              onDelete={(p) => { setShowDetail(false); openDelete(p); }}
              onClose={() => { setShowDetail(false); setSelectedProduct(null); }}
            />
            <div className="p-4 border-t border-theme">
              <button onClick={() => { setShowDetail(false); setSelectedProduct(null); }}
                className="w-full px-4 py-2 text-sm font-medium text-theme-secondary bg-theme-primary hover:bg-theme-tertiary border border-theme rounded-lg transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, product: null })}
        title="Delete Product"
        size="sm"
        footer={
          <div className="flex items-center gap-3">
            <button onClick={() => setDeleteModal({ open: false, product: null })} disabled={deleteLoading}
              className="px-4 py-2 text-sm font-medium text-theme-secondary bg-theme-primary hover:bg-theme-tertiary border border-theme rounded-lg transition-colors">
              Cancel
            </button>
            <button onClick={handleDelete} disabled={deleteLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50">
              {deleteLoading && <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              Delete Product
            </button>
          </div>
        }
      >
        <p className="text-sm text-theme-secondary">
          Are you sure you want to delete <span className="font-semibold text-theme-primary">"{deleteModal.product?.product_name}"</span>?
          This action can be undone from the Recycle Bin.
        </p>
      </Modal>
    </div>
  );
};

export default ProductCatalog;
