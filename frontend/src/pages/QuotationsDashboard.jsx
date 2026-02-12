import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiPlus, FiSearch, FiFileText, FiRefreshCw, FiArrowRight } from 'react-icons/fi';
import { format } from 'date-fns';
import QuotationForm from '../components/quotations/QuotationForm';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const QuotationsDashboard = () => {
    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchQuotations();
    }, []);

    const fetchQuotations = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/quotations`);
            setQuotations(res.data);
        } catch (error) {
            console.error('Error fetching quotations:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredQuotations = quotations.filter(q => 
        q.quotation_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'bg-blue-100 text-blue-800';
            case 'Converted': return 'bg-green-100 text-green-800';
            case 'Expired': return 'bg-red-100 text-red-800';
            case 'Cancelled': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen dark:bg-gray-900">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <FiFileText className="text-blue-600" /> Quotations & Pro-formas
                        </h1>
                        <p className="text-gray-500 mt-1">Generate quotes and convert them into sales easily</p>
                    </div>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-transform hover:scale-[1.02]"
                    >
                        <FiPlus size={20} /> Create New Quote
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-8 flex items-center gap-4">
                    <div className="relative flex-grow">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search by quote number or customer..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <button onClick={fetchQuotations} className="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200" title="Refresh">
                        <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Number</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Total</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {loading ? (
                                    <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-400">Loading quotations...</td></tr>
                                ) : filteredQuotations.length === 0 ? (
                                    <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-400">No quotations found.</td></tr>
                                ) : (
                                    filteredQuotations.map(q => (
                                        <tr key={q.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                            <td className="px-6 py-4 text-sm font-medium">{format(new Date(q.created_at), 'dd MMM yyyy')}</td>
                                            <td className="px-6 py-4 text-sm font-bold font-mono text-blue-600">{q.quotation_number}</td>
                                            <td className="px-6 py-4 text-sm font-medium">{q.customer_name}</td>
                                            <td className="px-6 py-4 text-sm font-bold">₦{parseFloat(q.total_amount).toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold ${getStatusColor(q.status)}`}>
                                                    {q.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button 
                                                    onClick={() => navigate(`/quotations/${q.id}`)}
                                                    className="flex items-center gap-1 text-blue-600 font-bold text-xs hover:underline"
                                                >
                                                    DETAILS <FiArrowRight />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <QuotationForm 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSuccess={fetchQuotations} 
            />
        </div>
    );
};

export default QuotationsDashboard;
