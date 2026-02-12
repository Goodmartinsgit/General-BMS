import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, ShoppingBag, LayoutGrid, List as ListIcon } from 'lucide-react';
import { productAPI } from '../api/products';
import { POSProductGrid, POSCart, POSCheckout } from '../components/sales';
import { Input, Button, LoadingSpinner } from '../components/ui';
import { debounce } from 'lodash';

const POS = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

    const fetchProducts = async (search = '', page = 1) => {
        setLoading(true);
        try {
            const data = await productAPI.getProducts({
                search,
                page,
                limit: 20,
                view_mode: 'compact',
                is_active: true
            });
            setProducts(data.products);
            setPagination(data.pagination);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    // Debounced search
    const debouncedSearch = useCallback(
        debounce((term) => {
            fetchProducts(term, 1);
        }, 500),
        []
    );

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        debouncedSearch(value);
    };

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-gray-50 -m-6">
            {/* Left Side: Product Selection */}
            <div className="flex-grow flex flex-col min-w-0 border-r border-gray-200">
                {/* Header / Search */}
                <div className="p-4 bg-white border-b border-gray-200 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="relative flex-grow max-w-xl">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <Input
                                placeholder="Search products by name, code or scan barcode..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="pl-10 h-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                            <Button
                                variant={viewMode === 'grid' ? 'white' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('grid')}
                                className={viewMode === 'grid' ? 'shadow-sm' : ''}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </Button>
                            <Button
                                variant={viewMode === 'list' ? 'white' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('list')}
                                className={viewMode === 'list' ? 'shadow-sm' : ''}
                            >
                                <ListIcon className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Quick Filters / Categories */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                        <Button size="sm" variant="primary" className="rounded-full px-4">All Items</Button>
                        <Button size="sm" variant="white" className="rounded-full px-4 border-gray-200">Tiles</Button>
                        <Button size="sm" variant="white" className="rounded-full px-4 border-gray-200">Cement</Button>
                        <Button size="sm" variant="white" className="rounded-full px-4 border-gray-200">Tools</Button>
                        <Button size="sm" variant="white" className="rounded-full px-4 border-gray-200">Electrical</Button>
                    </div>
                </div>

                {/* Product Grid Area */}
                <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
                    {loading && products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <LoadingSpinner size="lg" />
                            <p className="mt-4 font-medium">Loading products...</p>
                        </div>
                    ) : (
                        <POSProductGrid products={products} loading={loading} />
                    )}
                </div>

                {/* Pagination / Footer */}
                <div className="p-3 bg-white border-t border-gray-200 flex items-center justify-between">
                    <span className="text-sm text-gray-500 font-medium">
                        Showing {products.length} products
                    </span>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="white" 
                            size="sm" 
                            disabled={pagination.page <= 1}
                            onClick={() => fetchProducts(searchTerm, pagination.page - 1)}
                        >
                            Previous
                        </Button>
                        <span className="text-sm font-bold px-3">
                            {pagination.page} / {pagination.totalPages}
                        </span>
                        <Button 
                            variant="white" 
                            size="sm"
                            disabled={pagination.page >= pagination.totalPages}
                            onClick={() => fetchProducts(searchTerm, pagination.page + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>

            {/* Right Side: Cart & Checkout */}
            <div className="w-[400px] flex flex-col bg-white border-l border-gray-200">
                <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-gray-900">Current Order</h3>
                </div>
                
                <div className="flex-grow overflow-hidden flex flex-col">
                    <POSCart />
                </div>

                <div className="h-[500px] flex-shrink-0 border-t border-gray-200">
                    <POSCheckout />
                </div>
            </div>
        </div>
    );
};

export default POS;
