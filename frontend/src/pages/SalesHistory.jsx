import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Filter, Search, History, RefreshCw, FileText } from 'lucide-react';
import { salesAPI } from '../api/sales';
import { SaleCard } from '../components/sales';
import PeriodFilter from '../components/common/PeriodFilter';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const SalesHistory = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchSales();
    }, [dateRange]);

    const fetchSales = async () => {
        setLoading(true);
        try {
            const params = { includeReversed: true };
            if (dateRange?.start_date) params.start_date = dateRange.start_date;
            if (dateRange?.end_date) params.end_date = dateRange.end_date;
            const data = await salesAPI.getSales(params);
            setSales(data);
        } catch (error) {
            console.error('Error fetching sales:', error);
            toast.error('Failed to load sales history');
        } finally {
            setLoading(false);
        }
    };

    const handlePeriodChange = useCallback((range) => {
        setDateRange(range);
    }, []);

    const filteredSales = sales.filter(sale => 
        sale.sale_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sale.customer_name && sale.customer_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 md:gap-6">
                <div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2 sm:gap-4">
                        Archive
                        <span className="bg-gray-100 text-gray-500 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-black border border-gray-200 uppercase tracking-widest">
                            {sales.length} Records
                        </span>
                    </h2>
                    <span className="text-gray-400 text-xs sm:text-sm mt-1 uppercase font-bold tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
                        Historical Transaction Ledger
                    </span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto">
                    <button 
                        onClick={fetchSales} 
                        className="flex-1 md:flex-none bg-white text-gray-900 border border-gray-100 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs hover:bg-gray-50 transition shadow-sm flex items-center justify-center gap-1.5 sm:gap-2 uppercase tracking-widest"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${loading ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Sync Registry</span>
                        <span className="sm:hidden">Sync</span>
                    </button>
                    <button 
                        onClick={() => navigate('/pos')} 
                        className="flex-1 md:flex-none bg-gray-900 text-white px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs hover:bg-black transition shadow-xl shadow-black/10 flex items-center justify-center gap-1.5 sm:gap-2 uppercase tracking-widest"
                    >
                        <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Initiate Terminal</span>
                        <span className="sm:hidden">POS</span>
                    </button>
                </div>
            </div>

            {/* Premium Intelligence Bar */}
            <div className="bg-white p-3 sm:p-4 rounded-2xl sm:rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 sm:gap-4 items-center">
                <div className="relative flex-grow w-full">
                    <Search className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <input 
                        placeholder="Search transactions..." 
                        className="w-full pl-9 sm:pl-14 pr-3 sm:pr-4 py-2.5 sm:py-4 bg-gray-50 border border-transparent rounded-xl sm:rounded-[1.5rem] focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none transition-all text-xs sm:text-sm font-black"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                    <PeriodFilter storageKey="sales-history" onChange={handlePeriodChange} />
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-theme border-t-accent-gold rounded-full animate-spin" />
                </div>
            ) : filteredSales.length === 0 ? (
                <div className="py-16 sm:py-24 md:py-32 text-center bg-white rounded-2xl sm:rounded-[3rem] border border-dashed border-gray-200">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mx-auto mb-4 sm:mb-6">
                         <History size={32} className="sm:w-10 sm:h-10 md:w-12 md:h-12" />
                    </div>
                    <p className="font-black text-gray-900 text-base sm:text-lg md:text-xl tracking-tight">Vault is Empty</p>
                    <p className="text-gray-400 text-xs sm:text-sm mt-1 uppercase font-bold tracking-widest px-4">No transaction matching your current query was found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
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
