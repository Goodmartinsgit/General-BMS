import React, { useEffect, useState } from 'react';
import axios from 'axios';
const ProductsPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await axios.get('/products');
            setProducts(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-theme-primary tracking-tight flex items-center gap-3">
                        Product Catalog
                        <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-[10px] font-bold border border-blue-200 uppercase tracking-widest dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
                            {products.length} Items Total
                        </span>
                    </h2>
                    <p className="text-theme-muted text-sm mt-1 uppercase font-bold tracking-widest">Manage your enterprise inventory</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="bg-theme-secondary border border-theme text-theme-secondary px-5 py-2.5 rounded-2xl font-bold text-sm hover:bg-theme-tertiary transition shadow-sm flex items-center gap-2">
                        <Package size={18} /> Export CSV
                    </button>
                    <button className="bg-blue-600 text-white px-6 py-2.5 rounded-2xl font-bold text-sm hover:bg-blue-700 transition shadow-lg shadow-blue-200 dark:shadow-blue-900/20 flex items-center gap-2">
                        <Plus className="w-5 h-5" /> Add New Product
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-theme-secondary p-4 rounded-[2rem] border border-theme shadow-theme-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-grow w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                        type="text"
                        placeholder="Search products by name, code or specs..." 
                        className="w-full pl-12 pr-4 py-3 bg-theme-primary border border-transparent rounded-2xl focus:bg-theme-secondary focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none transition-all text-sm font-medium text-theme-primary placeholder-gray-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 border border-theme rounded-2xl text-sm font-bold text-theme-secondary hover:bg-theme-tertiary transition">
                        <Filter className="w-4 h-4" /> Category
                    </button>
                    <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 border border-theme rounded-2xl text-sm font-bold text-theme-secondary hover:bg-theme-tertiary transition">
                        <ArrowLeftRight className="w-4 h-4 rotate-90" /> Sort
                    </button>
                </div>
            </div>
            
            {/* Table Area */}
            <div className="bg-theme-secondary rounded-[2.5rem] border border-theme shadow-theme-sm overflow-hidden hover:shadow-theme-md transition-shadow duration-500">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-theme">
                        <thead>
                            <tr className="bg-theme-tertiary">
                                <th className="px-8 py-5 text-left text-[10px] font-black text-theme-muted uppercase tracking-[0.2em]">Product Core</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-theme-muted uppercase tracking-[0.2em]">Inventory Status</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-theme-muted uppercase tracking-[0.2em]">Market Valuation</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-theme-muted uppercase tracking-[0.2em]">Interaction</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-theme">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="4" className="px-8 py-10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-theme-tertiary rounded-2xl"></div>
                                                <div className="space-y-2">
                                                    <div className="w-48 h-4 bg-theme-tertiary rounded"></div>
                                                    <div className="w-24 h-3 bg-theme-tertiary rounded"></div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-20 h-20 bg-theme-tertiary rounded-full flex items-center justify-center text-theme-muted">
                                                <Package size={40} />
                                            </div>
                                            <div>
                                                <p className="font-black text-theme-primary">No assets detected</p>
                                                <p className="text-theme-muted text-sm mt-1">Start by adding your first product to the repository</p>
                                            </div>
                                            <button className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold text-xs mt-4">Add Product</button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                products.map((product) => (
                                    <tr key={product.id} className="hover:bg-theme-tertiary transition duration-200 group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm border border-blue-100 dark:border-blue-800 group-hover:border-blue-600">
                                                    <Package className="w-7 h-7" />
                                                </div>
                                                <div>
                                                    <div className="font-black text-theme-primary text-base">{product.product_name}</div>
                                                    <div className="text-[10px] text-theme-muted font-mono font-bold mt-1 uppercase">{product.product_code}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${product.stock > 10 ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                                                    <span className="text-sm font-bold text-theme-secondary tracking-tight">{product.stock || 0} Units Available</span>
                                                </div>
                                                <div className="text-[10px] text-theme-muted font-bold uppercase tracking-wider">Storage Location: Main Hub</div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-1">
                                                <div className="text-lg font-black text-blue-600 dark:text-blue-400 tracking-tighter">₦{parseFloat(product.retail_price).toLocaleString()}</div>
                                                <div className="text-[10px] text-theme-muted font-bold uppercase tracking-widest">Base Valuation</div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button className="p-3 text-theme-muted hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition">
                                                    <Edit className="w-5 h-5" />
                                                </button>
                                                <button className="p-3 text-theme-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition">
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Table Footer */}
                <div className="px-8 py-6 bg-theme-tertiary border-t border-theme flex items-center justify-between">
                    <div className="text-xs font-bold text-theme-muted uppercase tracking-widest">Total Valuation: ₦{products.reduce((acc, p) => acc + (parseFloat(p.retail_price) * (p.stock || 0)), 0).toLocaleString()}</div>
                    <div className="flex items-center gap-4">
                        <button className="text-sm font-bold text-theme-muted hover:text-theme-primary transition">Previous</button>
                        <div className="flex gap-1">
                             <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</span>
                        </div>
                        <button className="text-sm font-bold text-theme-muted hover:text-theme-primary transition">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Need more icons
import { Plus, Search, Filter, Edit, Trash2, ArrowLeftRight } from 'lucide-react';

export default ProductsPage;
