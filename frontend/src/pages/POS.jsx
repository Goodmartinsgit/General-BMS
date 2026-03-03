import React, { useState, useEffect, useCallback } from 'react';
import { Search, LayoutGrid, List as ListIcon, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { productAPI } from '../api/products';
import api from '../api/axios';
import { POSProductGrid, POSCart, POSCheckout } from '../components/sales';
import { LoadingSpinner } from '../components/ui';
import { debounce } from 'lodash';
import { useCart } from '../context/CartContext';

const POS = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [mobileView, setMobileView] = useState('products');

    const { cartItems } = useCart();

    // On mobile: auto-switch to cart when the first item is added
    useEffect(() => {
        if (cartItems.length === 1 && window.innerWidth < 768) {
            setMobileView('cart');
        }
    }, [cartItems.length]);

    const fetchProducts = async (search = '', page = 1, categoryId = null) => {
        setLoading(true);
        try {
            const params = { search, page, limit: 20, view_mode: 'compact', is_active: true };
            if (categoryId) params.category_id = categoryId;
            const data = await productAPI.getProducts(params);
            setProducts(data.products);
            setPagination(data.pagination);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const debouncedSearch = useCallback(
        debounce((term, categoryId) => {
            fetchProducts(term, 1, categoryId);
        }, 500),
        []
    );

    useEffect(() => {
        fetchProducts();
        api.get('/products/categories')
            .then(res => setCategories(res.data || []))
            .catch(() => setCategories([]));
    }, []);

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        debouncedSearch(value, selectedCategoryId);
    };

    const handleCategorySelect = (categoryId) => {
        setSelectedCategoryId(categoryId);
        fetchProducts(searchTerm, 1, categoryId);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] sm:h-[calc(100vh-80px)] overflow-hidden bg-theme-primary -m-4 md:-m-6 lg:-m-8">

            {/* ── Mobile Tab Bar (hidden on md+) ── */}
            <div className="md:hidden shrink-0 flex items-stretch bg-theme-secondary border-b border-theme">
                <button
                    onClick={() => setMobileView('products')}
                    className={`flex-1 py-2.5 text-xs sm:text-sm font-medium transition-colors ${
                        mobileView === 'products'
                            ? 'text-accent-gold border-b-2 border-accent-gold'
                            : 'text-theme-muted'
                    }`}
                >
                    Products
                </button>
                <button
                    onClick={() => setMobileView('cart')}
                    className={`flex-1 py-2.5 text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                        mobileView === 'cart'
                            ? 'text-accent-gold border-b-2 border-accent-gold'
                            : 'text-theme-muted'
                    }`}
                >
                    <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Cart
                    {cartItems.length > 0 && (
                        <span className="bg-accent-gold text-white text-[10px] sm:text-xs w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center font-bold leading-none">
                            {cartItems.length}
                        </span>
                    )}
                </button>
            </div>

            {/* ── Main Panel Row ── */}
            <div className="flex flex-1 min-h-0 overflow-hidden">

                {/* Left Side: Product Selection */}
                <div className={`${mobileView === 'products' ? 'flex' : 'hidden'} md:flex flex-col flex-1 min-w-0 border-r border-theme`}>
                    {/* Header / Search */}
                    <div className="p-2 sm:p-3 md:p-4 bg-theme-secondary border-b border-theme space-y-2 sm:space-y-3">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-theme-muted w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <input
                                    placeholder="Search products..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    className="w-full pl-7 sm:pl-9 pr-2 sm:pr-4 py-1.5 sm:py-2 bg-theme-primary border border-theme rounded-lg text-theme-primary placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold transition-all text-xs sm:text-sm"
                                />
                            </div>
                            <div className="hidden sm:flex items-center gap-0.5 bg-theme-primary p-1 rounded-lg border border-theme shrink-0">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded-md transition ${viewMode === 'grid' ? 'bg-theme-secondary text-accent-gold shadow-sm' : 'text-theme-muted hover:text-theme-primary'}`}
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded-md transition ${viewMode === 'list' ? 'bg-theme-secondary text-accent-gold shadow-sm' : 'text-theme-muted hover:text-theme-primary'}`}
                                >
                                    <ListIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Categories */}
                        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-0.5 no-scrollbar">
                            <button
                                onClick={() => handleCategorySelect(null)}
                                className={`whitespace-nowrap px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition-all shrink-0 ${
                                    selectedCategoryId === null
                                        ? 'bg-accent-gold text-white shadow-sm'
                                        : 'bg-theme-primary border border-theme text-theme-secondary hover:border-accent-gold/50'
                                }`}
                            >
                                All Items
                            </button>
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => handleCategorySelect(cat.id)}
                                    className={`whitespace-nowrap px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition-all shrink-0 ${
                                        selectedCategoryId === cat.id
                                            ? 'bg-accent-gold text-white shadow-sm'
                                            : 'bg-theme-primary border border-theme text-theme-secondary hover:border-accent-gold/50'
                                    }`}
                                >
                                    {cat.category_name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Product Grid Area */}
                    <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 custom-scrollbar">
                        <AnimatePresence mode="wait">
                            {loading && products.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center justify-center h-full text-theme-muted"
                                >
                                    <LoadingSpinner size="lg" />
                                    <p className="mt-4 text-xs sm:text-sm">Loading products...</p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <POSProductGrid products={products} loading={loading} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Pagination / Footer */}
                    <div className="px-2 sm:px-3 md:px-4 py-2 bg-theme-secondary border-t border-theme flex items-center justify-between shrink-0">
                        <span className="text-[10px] sm:text-xs text-theme-muted">
                            {products.length} items
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                disabled={pagination.page <= 1 || loading}
                                onClick={() => fetchProducts(searchTerm, pagination.page - 1, selectedCategoryId)}
                                className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-theme-primary border border-theme rounded-lg text-[10px] sm:text-xs font-medium text-theme-primary hover:bg-theme-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                Prev
                            </button>
                            <span className="text-[10px] sm:text-xs font-medium text-theme-primary px-2 sm:px-2.5 py-0.5 sm:py-1 bg-theme-primary border border-theme rounded-lg">
                                {pagination.page} / {pagination.totalPages}
                            </span>
                            <button
                                disabled={pagination.page >= pagination.totalPages || loading}
                                onClick={() => fetchProducts(searchTerm, pagination.page + 1, selectedCategoryId)}
                                className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-theme-primary border border-theme rounded-lg text-[10px] sm:text-xs font-medium text-theme-primary hover:bg-theme-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Side: Cart & Checkout */}
                {/*
                    Mobile  (<md): full-width, overall panel scrolls (overflow-y-auto).
                              Cart and checkout stack naturally — no flex trickery.
                    Desktop (md+): fixed width side panel, flex layout with bounded sections.
                */}
                <div className={`
                    ${mobileView === 'cart' ? 'flex' : 'hidden'} md:flex
                    flex-col
                    w-full md:w-[340px] lg:w-[420px] shrink-0
                    bg-theme-secondary border-l border-theme
                    overflow-y-auto md:overflow-hidden
                `}>
                    {/* Cart — natural height on mobile, flex-1 on desktop */}
                    <div className="flex-none md:flex-1 md:min-h-0 md:overflow-hidden flex flex-col">
                        <POSCart />
                    </div>

                    {/* Checkout — natural height on mobile, bounded height on desktop */}
                    <div className="shrink-0 border-t border-theme flex flex-col md:overflow-hidden md:h-[clamp(320px,50vh,480px)]">
                        <POSCheckout />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default POS;
