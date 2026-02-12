import React, { useState, useEffect } from 'react';
import { Calendar, Filter, Search, History, RefreshCw, FileText } from 'lucide-react';
import { salesAPI } from '../api/sales';
import { SaleCard } from '../components/sales';
import { Input, Button, LoadingSpinner, EmptyState } from '../components/ui';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const SalesHistory = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = async () => {
        setLoading(true);
        try {
            const data = await salesAPI.getSales({ includeReversed: true });
            setSales(data);
        } catch (error) {
            console.error('Error fetching sales:', error);
            toast.error('Failed to load sales history');
        } finally {
            setLoading(false);
        }
    };

    const filteredSales = sales.filter(sale => 
        sale.sale_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sale.customer_name && sale.customer_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-4">
                        Archive
                        <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-[10px] font-black border border-gray-200 uppercase tracking-widest">
                            {sales.length} Records
                        </span>
                    </h2>
                    <p className="text-gray-400 text-sm mt-1 uppercase font-bold tracking-widest flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        Historical Transaction Ledger
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={fetchSales} 
                        className="bg-white text-gray-900 border border-gray-100 px-6 py-3 rounded-2xl font-black text-xs hover:bg-gray-50 transition shadow-sm flex items-center gap-2 uppercase tracking-widest"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Sync Registry
                    </button>
                    <button 
                        onClick={() => navigate('/pos')} 
                        className="bg-gray-900 text-white px-6 py-3 rounded-2xl font-black text-xs hover:bg-black transition shadow-xl shadow-black/10 flex items-center gap-2 uppercase tracking-widest"
                    >
                        <FileText className="w-4 h-4" />
                        Initiate Terminal
                    </button>
                </div>
            </div>

            {/* Premium Intelligence Bar */}
            <div className="bg-white p-4 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-grow w-full">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                        placeholder="Retrieve transaction by ID or verified identity..." 
                        className="w-full pl-14 pr-4 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none transition-all text-sm font-black"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                    <button className="flex items-center gap-2 px-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] text-xs font-black text-gray-500 hover:bg-white hover:border-blue-100 transition-all uppercase tracking-widest">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        Temporal Scope
                    </button>
                    <button className="flex items-center gap-2 px-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] text-xs font-black text-gray-500 hover:bg-white hover:border-blue-100 transition-all uppercase tracking-widest">
                        <Filter className="w-4 h-4 text-blue-500" />
                        Logic Gates
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="py-32 flex flex-col items-center justify-center gap-6">
                    <div className="w-16 h-16 border-4 border-blue-50 border-t-blue-600 rounded-full animate-spin"></div>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Retrieving Secure Records</div>
                </div>
            ) : filteredSales.length === 0 ? (
                <div className="py-32 text-center bg-white rounded-[3rem] border border-dashed border-gray-200">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mx-auto mb-6">
                         <History size={48} />
                    </div>
                    <p className="font-black text-gray-900 text-xl tracking-tight">Vault is Empty</p>
                    <p className="text-gray-400 text-sm mt-1 uppercase font-bold tracking-widest">No transaction matching your current query was found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {filteredSales.map(sale => (
                        <SaleCard 
                            key={sale.id} 
                            sale={sale} 
                            onClick={(s) => navigate(`/sales/${s.id}`)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default SalesHistory;
