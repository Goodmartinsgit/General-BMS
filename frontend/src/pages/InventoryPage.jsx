import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Search, Filter, RefreshCw, AlertTriangle, History } from 'lucide-react';
import { Link } from 'react-router-dom';
import InventoryUpdateModal from '../components/InventoryUpdateModal';

const InventoryPage = () => {
    const [inventory, setInventory] = useState([]);
    const [products, setProducts] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [branchFilter, setBranchFilter] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const API_URL = 'http://localhost:5000/api';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [invRes, prodRes, branchRes] = await Promise.all([
                axios.get(`${API_URL}/inventory`),
                axios.get(`${API_URL}/products`),
                axios.get(`${API_URL}/branches`)
            ]);
            setInventory(invRes.data);
            setProducts(prodRes.data);
            setBranches(branchRes.data);
        } catch (error) {
            console.error('Error fetching inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStock = async (formData) => {
        try {
            await axios.post(`${API_URL}/inventory/update`, formData);
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Error updating stock:', error);
            alert('Failed to update stock');
        }
    };

    const filteredInventory = inventory.filter(item => {
        const matchesSearch = item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              item.product_code?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesBranch = branchFilter ? item.branch_id.toString() === branchFilter : true;
        return matchesSearch && matchesBranch;
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-theme-primary">Inventory Status</h2>
                <div className="flex gap-4">
                    <Link to="/inventory/movements" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 px-4 py-2 rounded-lg transition-colors">
                        <History size={20} /> Audit Trail
                    </Link>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-600/20"
                    >
                        <RefreshCw size={20} /> Update Stock
                    </button>
                </div>
            </div>

            <div className="bg-theme-secondary p-4 rounded-[1.5rem] shadow-theme-sm border border-theme flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" size={18} />
                    <input
                        type="text"
                        placeholder="Search by product name or code..."
                        className="pl-10 pr-4 py-2.5 border border-theme bg-theme-primary text-theme-primary rounded-xl w-full focus:ring-2 focus:ring-blue-500 outline-none placeholder-theme-muted"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={20} className="text-theme-muted" />
                    <select
                        className="border border-theme bg-theme-primary text-theme-primary rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                        value={branchFilter}
                        onChange={(e) => setBranchFilter(e.target.value)}
                    >
                        <option value="" className="bg-theme-secondary">All Branches</option>
                        {branches.map(b => (
                            <option key={b.id} value={b.id} className="bg-theme-secondary">{b.branch_name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-theme-secondary rounded-xl shadow-theme-sm overflow-hidden border border-theme">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-theme-tertiary text-theme-secondary uppercase text-xs font-semibold">
                        <tr>
                            <th className="px-6 py-4">Product</th>
                            <th className="px-6 py-4">Branch</th>
                            <th className="px-6 py-4">Stock on Hand</th>
                            <th className="px-6 py-4">Reserved</th>
                            <th className="px-6 py-4 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-theme">
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-10 text-center text-theme-muted">Loading inventory...</td>
                            </tr>
                        ) : filteredInventory.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-10 text-center text-theme-muted">No inventory data available</td>
                            </tr>
                        ) : (
                            filteredInventory.map((item) => (
                                <tr key={item.id} className="hover:bg-theme-tertiary/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-theme-primary">{item.product_name}</div>
                                        <div className="text-xs text-theme-muted">{item.product_code}</div>
                                    </td>
                                    <td className="px-6 py-4 text-theme-secondary">{item.branch_name}</td>
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-theme-primary">{item.quantity_on_hand}</span>
                                    </td>
                                    <td className="px-6 py-4 text-theme-muted">{item.quantity_reserved}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center">
                                            {item.quantity_on_hand <= 10 ? (
                                                <div className="flex items-center gap-1 text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 px-2.5 py-1 rounded-lg text-xs font-bold border border-red-100 dark:border-red-800/30">
                                                    <AlertTriangle size={14} /> Low Stock
                                                </div>
                                            ) : (
                                                <div className="text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400 px-2.5 py-1 rounded-lg text-xs font-bold border border-green-100 dark:border-green-800/30">
                                                    Optimal
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <InventoryUpdateModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleUpdateStock}
                products={products}
                branches={branches}
            />
        </div>
    );
};

export default InventoryPage;
