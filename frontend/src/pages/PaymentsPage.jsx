import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CreditCard, Search, FileText, ArrowRight, CheckCircle2, AlertCircle, Filter, Download } from 'lucide-react';

const PaymentsPage = () => {
    const [allocations, setAllocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchAllocations();
    }, []);

    const fetchAllocations = async () => {
        try {
            const res = await axios.get('/api/payments/allocations');
            setAllocations(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const filteredAllocations = allocations.filter(alloc => 
        (alloc.sale_number?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (alloc.order_number?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <CreditCard className="text-purple-600" />
                        Payment Allocations
                    </h1>
                    <p className="text-slate-500 text-sm">Track how payments are distributed across sales and orders</p>
                </div>
                
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search Sale/Order #"
                            className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="p-2 border rounded-xl bg-white hover:bg-slate-50 text-slate-600 transition">
                        <Filter size={20} />
                    </button>
                    <button className="p-2 border rounded-xl bg-white hover:bg-slate-50 text-slate-600 transition">
                        <Download size={20} />
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Reference</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Allocated Amount</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan="5" className="px-6 py-10 text-center text-slate-400">Loading payment data...</td></tr>
                        ) : filteredAllocations.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-10 text-center text-slate-400">No payment allocations found</td></tr>
                        ) : (
                            filteredAllocations.map(alloc => (
                                <tr key={alloc.id} className="hover:bg-slate-50 transition">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <FileText size={16} className="text-slate-400" />
                                            <span className="font-medium text-slate-700">
                                                {alloc.sale_number || alloc.order_number || 'N/A'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {alloc.sale_id ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                                Retail Sale
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                                                Wholesale Order
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-slate-900 font-bold">₦{parseFloat(alloc.amount).toLocaleString()}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {new Date(alloc.allocated_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-slate-400 hover:text-blue-600 transition">
                                            <ArrowRight size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-6 rounded-2xl text-white shadow-lg shadow-blue-200">
                    <div className="text-blue-100 text-sm mb-1">Total Sales Allocation</div>
                    <div className="text-2xl font-bold">₦{allocations.filter(a => a.sale_id).reduce((sum, a) => sum + parseFloat(a.amount), 0).toLocaleString()}</div>
                    <div className="mt-4 flex items-center gap-2 text-xs text-blue-100">
                        <CheckCircle2 size={14} /> 100% reconciled today
                    </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-500 to-purple-700 p-6 rounded-2xl text-white shadow-lg shadow-purple-200">
                    <div className="text-purple-100 text-sm mb-1">Wholesale Receivables Collected</div>
                    <div className="text-2xl font-bold">₦{allocations.filter(a => a.wholesale_order_id).reduce((sum, a) => sum + parseFloat(a.amount), 0).toLocaleString()}</div>
                    <div className="mt-4 flex items-center gap-2 text-xs text-purple-100">
                        <CheckCircle2 size={14} /> Updated 5m ago
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                            <AlertCircle size={24} />
                        </div>
                        <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">Action Required</span>
                    </div>
                    <div className="text-slate-800 font-bold">Outstanding Balances</div>
                    <div className="text-2xl font-bold text-slate-900">12 Orders</div>
                </div>
            </div>
        </div>
    );
};

export default PaymentsPage;
