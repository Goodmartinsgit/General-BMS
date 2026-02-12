import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { ArrowUpRight, ArrowDownLeft, Search, Calendar, Filter, Download, Banknote, Landmark, Wallet, Eye } from 'lucide-react';

const CashFlowPage = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialChannelId = queryParams.get('channelId') || '';

    const [channels, setChannels] = useState([]);
    const [history, setHistory] = useState([]);
    const [summary, setSummary] = useState({ total_inflow: 0, total_outflow: 0, total_transactions: 0 });
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        channelId: initialChannelId,
        startDate: '',
        endDate: '',
        limit: 50
    });

    const API_URL = 'http://localhost:5000/api';

    useEffect(() => {
        fetchChannels();
        fetchSummary();
    }, []);

    useEffect(() => {
        if (filters.channelId) {
            fetchHistory();
        } else if (channels.length > 0) {
            setFilters(prev => ({ ...prev, channelId: channels[0].id }));
        }
    }, [filters, channels]);

    const fetchChannels = async () => {
        try {
            const response = await axios.get(`${API_URL}/banks/channels`);
            setChannels(response.data);
            if (response.data.length > 0 && !filters.channelId) {
                setFilters(prev => ({ ...prev, channelId: response.data[0].id }));
            }
        } catch (error) {
            console.error('Error fetching channels:', error);
        }
    };

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/banks/channels/${filters.channelId}/history`, {
                params: {
                    startDate: filters.startDate,
                    endDate: filters.endDate,
                    limit: filters.limit
                }
            });
            setHistory(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching history:', error);
            setLoading(false);
        }
    };

    const fetchSummary = async () => {
        try {
            const response = await axios.get(`${API_URL}/banks/summary`, {
                params: {
                    startDate: filters.startDate,
                    endDate: filters.endDate
                }
            });
            setSummary(response.data);
        } catch (error) {
            console.error('Error fetching summary:', error);
        }
    };

    const selectedChannel = channels.find(c => c.id.toString() === filters.channelId.toString());

    return (
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">CASH FLOW AUDIT</h1>
                    <p className="text-slate-500 font-medium">Detailed financial transaction trail</p>
                </div>
                <div className="flex gap-2">
                    <button className="bg-white hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-2xl font-bold shadow-sm border border-slate-100 flex items-center gap-2 transition active:scale-95">
                        <Download size={20} /> EXPORT CSV
                    </button>
                </div>
            </div>

            {/* Summary Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Selected Account</div>
                    <div className="text-xl font-black text-slate-900 uppercase">{selectedChannel?.channel_name || 'All Channels'}</div>
                    <div className="text-xs font-bold text-blue-600 mt-1 uppercase tracking-widest">{selectedChannel?.bank_name || 'N/A'}</div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Account Balance</div>
                    <div className="text-2xl font-black text-slate-900">₦{parseFloat(selectedChannel?.current_balance || 0).toLocaleString()}</div>
                    <div className="flex items-center gap-1 text-[10px] font-black text-green-600 uppercase mt-1">
                        <ArrowUpRight size={10} /> Active
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border-l-[6px] border-l-green-500 shadow-sm border border-slate-100">
                    <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Total Inflow (Period)</div>
                    <div className="text-2xl font-black text-green-600">₦{parseFloat(summary.total_inflow || 0).toLocaleString()}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">Based on Filters</div>
                </div>
                <div className="bg-white p-6 rounded-3xl border-l-[6px] border-l-red-500 shadow-sm border border-slate-100">
                    <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Total Outflow (Period)</div>
                    <div className="text-2xl font-black text-red-600">₦{parseFloat(summary.total_outflow || 0).toLocaleString()}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">Based on Filters</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Select Channel</label>
                        <select 
                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={filters.channelId}
                            onChange={(e) => setFilters(prev => ({ ...prev, channelId: e.target.value }))}
                        >
                            {channels.map(c => (
                                <option key={c.id} value={c.id}>{c.channel_name} ({c.bank_name || 'Int.'})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Start Date</label>
                        <input 
                            type="date"
                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={filters.startDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">End Date</label>
                        <input 
                            type="date"
                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={filters.endDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Transactions Limit</label>
                        <select 
                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={filters.limit}
                            onChange={(e) => setFilters(prev => ({ ...prev, limit: e.target.value }))}
                        >
                            <option value="50">Last 50</option>
                            <option value="100">Last 100</option>
                            <option value="500">Last 500</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Transaction List */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Time</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type / Source</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Balance After</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">User</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400 font-bold italic">Loading transactions...</td>
                                </tr>
                            ) : history.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400 font-bold italic">No transactions found for this period.</td>
                                </tr>
                            ) : (
                                history.map(row => (
                                    <tr key={row.id} className="hover:bg-slate-50 transition border-0 group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-slate-900">{new Date(row.created_at).toLocaleDateString()}</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase">{new Date(row.created_at).toLocaleTimeString()}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-black uppercase tracking-widest">
                                                {row.reference_number || RowID(row.id)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {row.type === 'inflow' ? (
                                                    <div className="p-1 bg-green-100 text-green-600 rounded-full"><ArrowDownLeft size={14} /></div>
                                                ) : (
                                                    <div className="p-1 bg-red-100 text-red-600 rounded-full"><ArrowUpRight size={14} /></div>
                                                )}
                                                <div>
                                                    <div className="text-sm font-black text-slate-900 uppercase tracking-tight">{row.source}</div>
                                                    <div className={`text-[10px] font-bold uppercase ${row.type === 'inflow' ? 'text-green-500' : 'text-red-500'}`}>
                                                        {row.type}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-right font-black text-sm ${row.type === 'inflow' ? 'text-green-600' : 'text-red-600'}`}>
                                            {row.type === 'inflow' ? '+' : '-'}₦{parseFloat(row.amount).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right font-black text-sm text-slate-900">
                                            ₦{parseFloat(row.balance_after).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 max-w-xs">
                                            <div className="text-xs font-medium text-slate-500 line-clamp-2">{row.description}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-black text-xs uppercase">
                                                    {row.performer?.charAt(0) || 'U'}
                                                </div>
                                                <span className="text-xs font-bold text-slate-600">{row.performer || 'System'}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const RowID = (id) => `REF-${id.toString().padStart(5, '0')}`;

export default CashFlowPage;
