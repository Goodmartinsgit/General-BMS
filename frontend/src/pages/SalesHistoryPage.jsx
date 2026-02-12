import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Search, Filter, ShoppingBag, User, MapPin, Eye, FileText } from 'lucide-react';
import { format } from 'date-fns';
import InvoicePrintModal from '../components/InvoicePrintModal';

const SalesHistoryPage = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSale, setSelectedSale] = useState(null);
    const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

    const API_URL = 'http://localhost:5000/api/sales';

    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = async () => {
        try {
            setLoading(true);
            const response = await axios.get(API_URL);
            setSales(response.data);
        } catch (error) {
            console.error('Error fetching sales history:', error);
        } finally {
            setLoading(false);
        }
    };

    const viewInvoice = async (id) => {
        try {
            const response = await axios.get(`${API_URL}/${id}`);
            setSelectedSale(response.data);
            setIsInvoiceOpen(true);
        } catch (error) {
            alert('Failed to load invoice details');
        }
    };

    const filteredSales = sales.filter(s => 
        s.sale_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Sales Record Archive</h2>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 bg-white border px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition">
                        <FileText size={18} /> Export CSV
                    </button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border flex gap-4 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by sale number or customer name..."
                        className="pl-10 pr-4 py-2 bg-gray-50 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                    <Filter size={20} />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-widest border-b">
                        <tr>
                            <th className="px-6 py-4">Transaction Details</th>
                            <th className="px-6 py-4">Branch / Salesperson</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">Financials</th>
                            <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 italic text-sm">
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-20 text-center text-gray-400">Syncing sales data...</td>
                            </tr>
                        ) : filteredSales.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-20 text-center text-gray-400">No sales transactions found.</td>
                            </tr>
                        ) : (
                            filteredSales.map((sale) => (
                                <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-mono text-xs font-bold text-blue-600 mb-1">{sale.sale_number}</div>
                                        <div className="flex items-center gap-1 text-gray-500 text-[10px]">
                                            <Calendar size={10} /> {format(new Date(sale.created_at), 'dd MMM yyyy, HH:mm')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-gray-800 font-medium">
                                            <MapPin size={12} className="text-gray-400" /> {sale.branch_name}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-gray-400 text-xs mt-1">
                                            <User size={12} /> {sale.salesperson}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-gray-900 font-bold uppercase">{sale.customer_name || 'Walk-in'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-black text-gray-900">₦{parseFloat(sale.total_amount).toLocaleString()}</div>
                                        <div className={`text-[10px] mt-1 font-bold ${sale.payment_method === 'Cash' ? 'text-green-600' : 'text-blue-600'}`}>
                                            via {sale.payment_method}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center">
                                            <button 
                                                onClick={() => viewInvoice(sale.id)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <InvoicePrintModal 
                isOpen={isInvoiceOpen}
                onClose={() => setIsInvoiceOpen(false)}
                data={selectedSale}
            />
        </div>
    );
};

export default SalesHistoryPage;
